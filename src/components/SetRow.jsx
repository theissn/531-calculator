/**
 * SetRow Component - Display a single set with optional completion tracking
 */

import { Show } from 'solid-js'

export default function SetRow(props) {
  const textColor = () => {
    if (props.isWarmup) return 'text-text-dim'
    if (props.isComplete?.()) return 'text-text-dim line-through'
    return 'text-text'
  }

  return (
    <div class={`flex items-center justify-between py-1 ${textColor()}`}>
      <Show when={props.onToggle} fallback={
        <span class="w-16 text-sm text-text-dim">{props.set.percentage}%</span>
      }>
        <button
          class="w-16 flex items-center gap-2 text-sm text-text-dim hover:text-text"
          onClick={props.onToggle}
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
      <span class="w-12 text-right">
        {props.set.isAmrap ? (
          <>×<span class="text-text-muted">{props.set.reps}</span></>
        ) : (
          <>×{props.set.reps}</>
        )}
      </span>
    </div>
  )
}
