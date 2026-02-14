/**
 * SetRow Component - Display a single set with optional completion tracking
 */

import { Show, For } from 'solid-js'
import { state, setAmrapModal } from '../store.js'
import { estimateReps } from '../calculator.js'
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

function formatWeight(value) {
  if (value === null || value === undefined) return null
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}

export default function SetRow(props) {
  const isComplete = () => props.isComplete?.()

  const textColor = () => {
    if (props.isWarmup) return 'text-text-dim'
    if (isComplete()) return 'text-text-muted transition-colors duration-300'
    return 'text-text transition-colors duration-300'
  }

  const handleToggle = () => {
    haptic()
    if (props.set.isAmrap && props.liftId) {
      // Logic handled in parent or modal, but here we just pass through
      // Actually the original logic was mixed. Let's keep it simple.
      // The original code passed openAmrapModal if isAmrap.
      // We need to keep that logic intact.
      props.liftId ? setAmrapModal({
        liftId: props.liftId,
        weight: props.set.weight,
        week: state.currentWeek,
        minReps: parseInt(props.set.reps, 10),
        setIndex: props.setIndex
      }) : props.onToggle?.()
    } else {
      props.onToggle?.()
    }
  }

  const platesDisplay = () => formatPlates(props.plates)

  const nextJump = () => {
    if (!props.showNextJump || props.nextWeight == null) return null
    const diff = Math.round((props.nextWeight - props.set.weight) * 100) / 100
    if (diff === 0) return null
    const sign = diff > 0 ? '+' : ''
    const value = diff % 1 === 0 ? diff.toString() : diff.toFixed(1)
    return `Next: ${sign}${value} ${props.unit}`
  }

  return (
    <div class={`group flex flex-col py-1.5 px-3 border border-border transition-colors ${isComplete() ? 'bg-bg-hover border-primary/20 bg-hazard-stripe' : 'bg-bg hover:bg-bg-hover'
      }`}>
      <div class={`flex items-center gap-4 ${textColor()}`}>
        {/* Industrial Checkbox */}
        <button
          class="flex items-center gap-3 shrink-0"
          onClick={handleToggle}
          disabled={!props.onToggle}
        >
          <div class={`w-5 h-5 border-2 flex items-center justify-center transition-all duration-0 ${isComplete()
            ? 'bg-primary border-primary'
            : 'border-text-dim group-hover:border-primary'
            }`}>
            <Show when={isComplete()}>
              <svg class="w-4 h-4 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Show>
          </div>
          <span class="text-xs font-mono font-bold tabular-nums opacity-60 w-12 text-left">{props.set.percentage}%</span>
        </button>

        {/* Weight & Reps - Monospace Data */}
        <div class="flex-1 flex items-baseline justify-between">
          <div class="flex flex-col">
            <span class={`text-base font-mono font-bold tracking-tight ${isComplete() ? 'text-text-muted' : 'text-text'
              }`}>
              {props.set.weight} <span class="text-xs font-bold text-text-dim">{props.unit}</span>
            </span>
            <Show when={platesDisplay()}>
              <span class="text-xs font-mono text-text-dim hidden group-hover:block">
                [{platesDisplay()}]
              </span>
            </Show>
          </div>

          <div class="flex flex-col items-end">
            <button
              class={`text-base font-mono font-bold tabular-nums flex items-center gap-1 ${props.set.isAmrap ? 'text-primary underline decoration-2 underline-offset-4' : ''
                }`}
              onClick={handleToggle}
            >
              {props.set.reps.toString().replace('+', '')}
              {props.set.isAmrap && <span class="text-xs font-bold no-underline">+</span>}
            </button>
            <Show when={nextJump()}>
              <span class="text-[10px] font-mono text-text-dim uppercase tracking-wide">
                {nextJump()}
              </span>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
