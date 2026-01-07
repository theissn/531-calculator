/**
 * SetRow Component - Display a single set with optional completion tracking
 */

import { Show, For } from 'solid-js'
import { state, setAmrapModal } from '../store.js'
import { haptic } from '../hooks/useMobile.js'

/**
 * Format plates array for display
 * e.g., [{weight: 45, count: 2}, {weight: 10, count: 1}] -> "45 45 10"
 */
function formatPlates(platesData) {
  if (!platesData?.plates?.length) return null
  
  const parts = []
  for (const { weight, count } of platesData.plates) {
    for (let i = 0; i < count; i++) {
      // Format: remove unnecessary decimals (45.0 -> 45, 2.5 -> 2.5)
      parts.push(weight % 1 === 0 ? weight.toString() : weight.toFixed(1))
    }
  }
  return parts.join(' + ')
}

export default function SetRow(props) {
  const textColor = () => {
    if (props.isWarmup) return 'text-text-dim'
    if (props.isComplete?.()) return 'text-text-dim line-through'
    return 'text-text'
  }

  const handleToggle = () => {
    haptic()
    props.onToggle?.()
  }

  const handleAmrapClick = () => {
    haptic()
    // Extract min reps from "5+" format
    const minReps = parseInt(props.set.reps, 10)
    setAmrapModal({
      liftId: props.liftId,
      weight: props.set.weight,
      week: state.currentWeek,
      minReps
    })
  }

  const platesDisplay = () => formatPlates(props.plates)

  return (
    <div class="py-1">
      <div class={`flex items-center justify-between ${textColor()}`}>
        <Show when={props.onToggle} fallback={
          <span class="w-16 text-sm text-text-dim">{props.set.percentage}%</span>
        }>
          <button
            class="w-16 flex items-center gap-2 text-sm text-text-dim hover:text-text"
            onClick={handleToggle}
          >
            <div class={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              props.isComplete?.() ? 'bg-text border-text' : 'border-border-hover'
            }`}>
              <Show when={props.isComplete?.()}>
                <svg class="w-3 h-3 text-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Show>
            </div>
            <span>{props.set.percentage}%</span>
          </button>
        </Show>
        <span class="flex-1 font-medium">{props.set.weight} {props.unit}</span>
        <Show when={props.set.isAmrap && props.liftId} fallback={
          <span class="w-12 text-right">×{props.set.reps}</span>
        }>
          <button
            class="w-12 text-right text-text-muted hover:text-text"
            onClick={handleAmrapClick}
          >
            ×{props.set.reps}
          </button>
        </Show>
      </div>
      <Show when={platesDisplay()}>
        <div class="text-xs text-text-dim ml-16 mt-0.5">{platesDisplay()}</div>
      </Show>
    </div>
  )
}
