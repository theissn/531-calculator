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
  getBodyWeightHistory,
  getLatestBodyWeight,
  LIFT_NAMES
} from '../store.js'
import { haptic } from '../hooks/useMobile.js'
import WorkoutHistoryView from './WorkoutHistoryView.jsx'

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
            <rect
              x={pt.x - 3}
              y={pt.y - 3}
              width="6"
              height="6"
              class="fill-text"
            />
          )}
        </For>
      </svg>
      <div class="flex justify-between text-xs text-text-dim px-2 font-mono">
        <span>{Math.round(points().minVal)}</span>
        <span>{Math.round(points().maxVal)}</span>
      </div>
    </Show>
  )
}

/**
 * Body Weight Card with trend chart
 */
function BodyWeightCard() {
  const data = createMemo(() => {
    const history = getBodyWeightHistory()
    return history.map(h => ({
      value: h.weight,
      date: new Date(h.date).toLocaleDateString()
    }))
  })

  const latest = () => getLatestBodyWeight()

  const trend = createMemo(() => {
    const history = getBodyWeightHistory()
    if (history.length < 2) return null

    const first = history[0].weight
    const last = history[history.length - 1].weight
    const diff = last - first

    return {
      value: Math.abs(diff).toFixed(1),
      direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
    }
  })

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <div class="px-4 py-3 border-b border-border">
        <div class="flex items-baseline justify-between">
          <h3 class="font-bold font-mono uppercase">Body Weight</h3>
          <Show when={latest()}>
            <span class="text-sm font-mono">
              <span class="font-bold">{latest().weight}</span>
              <span class="text-text-dim ml-1">{state.settings?.unit || 'lbs'}</span>
            </span>
          </Show>
        </div>
      </div>

      <div class="p-4">
        <Show when={data().length > 0} fallback={
          <div class="text-center text-text-dim text-sm py-8 font-mono">
            No weight logged yet. Log your weight in Settings.
          </div>
        }>
          <LineChart data={data()} />
          <Show when={trend()}>
            <div class="text-center text-sm text-text-muted mt-2 font-mono">
              <Show when={trend().direction === 'up'}>
                <span class="text-amber-500">+{trend().value}</span> since first log
              </Show>
              <Show when={trend().direction === 'down'}>
                <span class="text-green-500">-{trend().value}</span> since first log
              </Show>
              <Show when={trend().direction === 'same'}>
                No change since first log
              </Show>
            </div>
          </Show>
        </Show>
      </div>
    </div>
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
      <div class="text-center text-text-dim text-sm py-8 font-mono">No data yet</div>
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
                  <rect
                    x={pt.x - 2.5}
                    y={pt.y - 2.5}
                    width="5"
                    height="5"
                    fill={line.color}
                  />
                )}
              </For>
            </>
          )}
        </For>
      </svg>
      <div class="flex justify-between text-xs text-text-dim px-2 -mt-1 font-mono">
        <span>{Math.round(chartData().minVal)}</span>
        <span>{Math.round(chartData().maxVal)}</span>
      </div>
      {/* Legend */}
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        <For each={chartData().lines}>
          {(line) => (
            <div class="flex items-center gap-1.5">
              <div class="w-3 h-3 rounded-none" style={{ "background-color": line.color }} />
              <span class="text-xs text-text-muted font-mono uppercase">{LIFT_NAMES[line.liftId]}</span>
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
      <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="font-bold font-mono uppercase">Training Max Comparison</h3>
        </div>
        <div class="p-4">
          <ComparisonChart datasets={tmDatasets()} />
        </div>
      </div>

      {/* 1RM Comparison */}
      <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="font-bold font-mono uppercase">Estimated 1RM Comparison</h3>
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
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <div class="px-4 py-3 border-b border-border">
        <div class="flex items-baseline justify-between">
          <h3 class="font-bold font-mono uppercase">{LIFT_NAMES[props.liftId]}</h3>
          <Show when={currentTM()}>
            <span class="text-sm text-text-dim font-mono">TM: {currentTM()}</span>
          </Show>
        </div>
      </div>

      <div class="p-4 space-y-4">
        {/* TM History Chart */}
        <div>
          <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Training Max History</div>
          <LineChart data={tmData()} />
        </div>

        {/* PR History Chart */}
        <div>
          <div class="flex items-baseline justify-between mb-2">
            <span class="text-xs text-text-muted uppercase tracking-wider font-mono">Estimated 1RM</span>
            <Show when={bestPR()}>
              <span class="text-xs text-text-dim font-mono">Best: {bestPR().estimated1RM}</span>
            </Show>
          </div>
          <LineChart data={prData()} />
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const [view, setView] = createSignal('per-lift') // 'per-lift' | 'compare' | 'history'

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
            <div class="flex rounded-none bg-bg-card border border-border p-px">
              <button
                class={`flex-1 px-3 py-1.5 text-sm font-bold font-mono uppercase rounded-none transition-colors ${view() === 'per-lift'
                  ? 'bg-text text-bg'
                  : 'text-text-muted hover:text-text'
                  }`}
                onClick={() => toggleView('per-lift')}
              >
                Per Lift
              </button>
              <button
                class={`flex-1 px-3 py-1.5 text-sm font-bold font-mono uppercase rounded-none transition-colors ${view() === 'compare'
                  ? 'bg-text text-bg'
                  : 'text-text-muted hover:text-text'
                  }`}
                onClick={() => toggleView('compare')}
              >
                Compare
              </button>
              <button
                class={`flex-1 px-3 py-1.5 text-sm font-bold font-mono uppercase rounded-none transition-colors ${view() === 'history'
                  ? 'bg-text text-bg'
                  : 'text-text-muted hover:text-text'
                  }`}
                onClick={() => toggleView('history')}
              >
                History
              </button>
            </div>

            {/* Per-lift view */}
            <Show when={view() === 'per-lift'}>
              <BodyWeightCard />
              <For each={['squat', 'bench', 'deadlift', 'ohp']}>
                {(liftId) => <LiftProgressCard liftId={liftId} />}
              </For>
            </Show>

            {/* Comparison view */}
            <Show when={view() === 'compare'}>
              <AllLiftsComparison />
            </Show>

            {/* History view */}
            <Show when={view() === 'history'}>
              <WorkoutHistoryView />
            </Show>

            {/* Recent Notes (only show on per-lift and compare views) */}
            <Show when={view() !== 'history' && getAllWorkoutNotes().length > 0}>
              <div class="bg-bg-card border border-border rounded-none overflow-hidden">
                <div class="px-4 py-3 border-b border-border">
                  <h3 class="font-bold font-mono uppercase">Recent Notes</h3>
                </div>
                <div class="divide-y divide-border">
                  <For each={getAllWorkoutNotes().slice(0, 5)}>
                    {(noteEntry) => (
                      <div class="px-4 py-3">
                        <div class="flex items-baseline justify-between mb-1">
                          <span class="text-xs text-text-dim font-mono">
                            {new Date(noteEntry.date).toLocaleDateString()}
                          </span>
                          <span class="text-xs text-text-dim font-mono">Week {noteEntry.week}</span>
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
