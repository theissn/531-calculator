/**
 * Progress Component - TM history and PR charts
 */

import { Show, For, createMemo, createSignal } from 'solid-js'
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

// Colors for each lift in comparison view
const LIFT_COLORS = {
  squat: '#ef4444',    // red
  bench: '#3b82f6',    // blue
  deadlift: '#22c55e', // green
  ohp: '#f59e0b'       // amber
}

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

/**
 * Multi-line chart for comparing all lifts
 */
function ComparisonChart(props) {
  const chartData = createMemo(() => {
    const datasets = props.datasets || []
    if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) return null
    
    // Get all values across all datasets for scaling
    const allValues = datasets.flatMap(d => d.data.map(p => p.value))
    if (allValues.length === 0) return null
    
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const range = maxVal - minVal || 1
    
    const width = 300
    const height = 160
    const padding = { top: 15, right: 15, bottom: 25, left: 15 }
    
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    
    // Process each dataset into points and path
    const lines = datasets.map(dataset => {
      const data = dataset.data
      if (data.length === 0) return null
      
      const pts = data.map((d, i) => {
        const x = padding.left + (data.length === 1 ? chartWidth / 2 : (i / (data.length - 1)) * chartWidth)
        const y = padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight
        return { x, y, ...d }
      })
      
      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      
      return { 
        liftId: dataset.liftId, 
        color: LIFT_COLORS[dataset.liftId], 
        pts, 
        pathD 
      }
    }).filter(Boolean)
    
    return { lines, minVal, maxVal, width, height }
  })

  return (
    <Show when={chartData()} fallback={
      <div class="text-center text-text-dim text-sm py-8">No data yet</div>
    }>
      <svg viewBox={`0 0 ${chartData().width} ${chartData().height}`} class="w-full h-40">
        {/* Lines */}
        <For each={chartData().lines}>
          {(line) => (
            <>
              <path
                d={line.pathD}
                fill="none"
                stroke={line.color}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <For each={line.pts}>
                {(pt) => (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="3"
                    fill={line.color}
                  />
                )}
              </For>
            </>
          )}
        </For>
      </svg>
      <div class="flex justify-between text-xs text-text-dim px-2 -mt-1">
        <span>{Math.round(chartData().minVal)}</span>
        <span>{Math.round(chartData().maxVal)}</span>
      </div>
      {/* Legend */}
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        <For each={chartData().lines}>
          {(line) => (
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-0.5 rounded" style={{ "background-color": line.color }} />
              <span class="text-xs text-text-muted">{LIFT_NAMES[line.liftId]}</span>
            </div>
          )}
        </For>
      </div>
    </Show>
  )
}

/**
 * All lifts comparison view
 */
function AllLiftsComparison() {
  const tmDatasets = createMemo(() => {
    return ['squat', 'bench', 'deadlift', 'ohp'].map(liftId => ({
      liftId,
      data: getTMHistory(liftId).map(h => ({
        value: h.trainingMax,
        date: new Date(h.date).toLocaleDateString()
      }))
    }))
  })

  const prDatasets = createMemo(() => {
    return ['squat', 'bench', 'deadlift', 'ohp'].map(liftId => ({
      liftId,
      data: getPRHistory(liftId).map(h => ({
        value: h.estimated1RM,
        date: new Date(h.date).toLocaleDateString()
      }))
    }))
  })

  return (
    <div class="space-y-4">
      {/* TM Comparison */}
      <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="font-semibold">Training Max Comparison</h3>
        </div>
        <div class="p-4">
          <ComparisonChart datasets={tmDatasets()} />
        </div>
      </div>

      {/* 1RM Comparison */}
      <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="font-semibold">Estimated 1RM Comparison</h3>
        </div>
        <div class="p-4">
          <ComparisonChart datasets={prDatasets()} />
        </div>
      </div>
    </div>
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
  const [view, setView] = createSignal('per-lift') // 'per-lift' | 'compare'

  const handleClose = () => {
    haptic()
    setShowProgress(false)
  }

  const toggleView = (newView) => {
    haptic()
    setView(newView)
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
            {/* View Toggle */}
            <div class="flex rounded-lg bg-bg-card border border-border p-1">
              <button
                class={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view() === 'per-lift' 
                    ? 'bg-bg-hover text-text' 
                    : 'text-text-muted hover:text-text'
                }`}
                onClick={() => toggleView('per-lift')}
              >
                Per Lift
              </button>
              <button
                class={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  view() === 'compare' 
                    ? 'bg-bg-hover text-text' 
                    : 'text-text-muted hover:text-text'
                }`}
                onClick={() => toggleView('compare')}
              >
                Compare All
              </button>
            </div>

            {/* Per-lift view */}
            <Show when={view() === 'per-lift'}>
              <For each={['squat', 'bench', 'deadlift', 'ohp']}>
                {(liftId) => <LiftProgressCard liftId={liftId} />}
              </For>
            </Show>

            {/* Comparison view */}
            <Show when={view() === 'compare'}>
              <AllLiftsComparison />
            </Show>
            
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
