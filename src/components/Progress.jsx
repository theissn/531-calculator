/**
 * Progress Component - TM history and PR charts
 */

import { Show, For, createMemo } from 'solid-js'
import { Portal } from 'solid-js/web'
import { 
  state, 
  setShowProgress, 
  getTMHistory, 
  getPRHistory,
  getAllWorkoutNotes,
  LIFT_NAMES 
} from '../store.js'
import { haptic } from '../hooks/useMobile.js'

/**
 * Simple line chart component using SVG
 */
function LineChart(props) {
  const points = createMemo(() => {
    const data = props.data || []
    if (data.length === 0) return null
    
    const values = data.map(d => d.value)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const range = maxVal - minVal || 1
    
    const width = 280
    const height = 100
    const padding = 10
    
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    
    const pts = data.map((d, i) => {
      const x = padding + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth)
      const y = padding + chartHeight - ((d.value - minVal) / range) * chartHeight
      return { x, y, ...d }
    })
    
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    
    return { pts, pathD, minVal, maxVal, width, height }
  })

  return (
    <Show when={points()} fallback={
      <div class="text-center text-text-dim text-sm py-8">No data yet</div>
    }>
      <svg viewBox={`0 0 ${points().width} ${points().height}`} class="w-full h-24">
        {/* Line */}
        <path
          d={points().pathD}
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="text-text-muted"
        />
        {/* Points */}
        <For each={points().pts}>
          {(pt) => (
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              class="fill-text"
            />
          )}
        </For>
      </svg>
      <div class="flex justify-between text-xs text-text-dim px-2">
        <span>{Math.round(points().minVal)}</span>
        <span>{Math.round(points().maxVal)}</span>
      </div>
    </Show>
  )
}

function LiftProgressCard(props) {
  const tmData = createMemo(() => {
    const history = getTMHistory(props.liftId)
    return history.map(h => ({
      value: h.trainingMax,
      date: new Date(h.date).toLocaleDateString()
    }))
  })

  const prData = createMemo(() => {
    const history = getPRHistory(props.liftId)
    return history.map(h => ({
      value: h.estimated1RM,
      date: new Date(h.date).toLocaleDateString()
    }))
  })

  const currentTM = () => {
    const lift = state.lifts[props.liftId]
    if (!lift?.oneRepMax) return null
    return Math.round(lift.oneRepMax * (state.settings.tmPercentage / 100))
  }

  const bestPR = () => {
    const history = getPRHistory(props.liftId)
    if (history.length === 0) return null
    return history.reduce((best, pr) => pr.estimated1RM > best.estimated1RM ? pr : best)
  }

  return (
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-border">
        <div class="flex items-baseline justify-between">
          <h3 class="font-semibold">{LIFT_NAMES[props.liftId]}</h3>
          <Show when={currentTM()}>
            <span class="text-sm text-text-dim">TM: {currentTM()}</span>
          </Show>
        </div>
      </div>
      
      <div class="p-4 space-y-4">
        {/* TM History Chart */}
        <div>
          <div class="text-xs text-text-muted uppercase tracking-wider mb-2">Training Max History</div>
          <LineChart data={tmData()} />
        </div>
        
        {/* PR History Chart */}
        <div>
          <div class="flex items-baseline justify-between mb-2">
            <span class="text-xs text-text-muted uppercase tracking-wider">Estimated 1RM</span>
            <Show when={bestPR()}>
              <span class="text-xs text-text-dim">Best: {bestPR().estimated1RM}</span>
            </Show>
          </div>
          <LineChart data={prData()} />
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const handleClose = () => {
    haptic()
    setShowProgress(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/50" />
        <div class="absolute inset-y-0 right-0 w-full max-w-md bg-bg border-l border-border overflow-y-auto">
          <div class="sticky top-0 z-10 bg-bg border-b border-border">
            <div class="flex items-center justify-between px-4 h-14">
              <h2 class="text-lg font-semibold">Progress</h2>
              <button class="p-2 -mr-2 text-text-muted hover:text-text" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4">
            <For each={['squat', 'bench', 'deadlift', 'ohp']}>
              {(liftId) => <LiftProgressCard liftId={liftId} />}
            </For>
            
            {/* Recent Notes */}
            <Show when={getAllWorkoutNotes().length > 0}>
              <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
                <div class="px-4 py-3 border-b border-border">
                  <h3 class="font-semibold">Recent Notes</h3>
                </div>
                <div class="divide-y divide-border">
                  <For each={getAllWorkoutNotes().slice(0, 5)}>
                    {(noteEntry) => (
                      <div class="px-4 py-3">
                        <div class="flex items-baseline justify-between mb-1">
                          <span class="text-xs text-text-dim">
                            {new Date(noteEntry.date).toLocaleDateString()}
                          </span>
                          <span class="text-xs text-text-dim">Week {noteEntry.week}</span>
                        </div>
                        <p class="text-sm text-text-muted">{noteEntry.note}</p>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  )
}
