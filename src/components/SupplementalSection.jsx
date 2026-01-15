/**
 * SupplementalSection Component - Supplemental sets with tracking
 */

import { For, Show } from 'solid-js'
import { getCompletedCount, markSetComplete, resetCompletedSets } from '../hooks/useCompletedSets.js'
import { startTimer, stopTimer } from '../hooks/useTimer.js'
import { haptic } from '../hooks/useMobile.js'

export default function SupplementalSection(props) {
  const completedCount = () => getCompletedCount(props.liftId)
  const totalSets = props.supplemental.sets
  const allDone = () => completedCount() >= totalSets

  const handleSetDone = () => {
    haptic()
    markSetComplete(props.liftId, {
      targetSets: totalSets,
      weight: props.supplemental.weight,
      reps: props.supplemental.reps
    })
    startTimer()
  }

  const handleReset = () => {
    haptic()
    resetCompletedSets(props.liftId)
    stopTimer()
  }

  return (
    <div class="mt-4 pt-3 border-t border-border">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-text-muted">
          {props.supplemental.templateName}
          <Show when={props.supplementalLiftId && props.supplementalLiftId !== props.liftId}>
            {' '}{props.supplementalLiftName}
          </Show>
        </span>
        <span class="text-xs text-text-dim">{completedCount()}/{totalSets} sets</span>
      </div>

      <div class="flex items-center justify-between mb-3">
        <span class="font-medium">{props.supplemental.reps} reps @ {props.supplemental.weight} {props.unit}</span>
      </div>

      <div class="flex gap-2">
        <For each={Array.from({ length: totalSets }, (_, i) => i)}>
          {(i) => {
            const isDone = () => i < completedCount()
            return (
              <button
                class={`flex-1 h-2 rounded-full ${isDone() ? 'bg-text' : 'bg-border'}`}
                disabled={isDone()}
              />
            )
          }}
        </For>
      </div>

      <div class="flex gap-2 mt-3">
        <Show when={!allDone()} fallback={
          <button
            class="flex-1 py-2 px-4 bg-bg-hover text-text-dim hover:text-text-muted text-sm font-medium rounded-lg"
            onClick={handleReset}
          >
            Reset
          </button>
        }>
          <button
            class="flex-1 py-2 px-4 bg-border hover:bg-border-hover text-sm font-medium rounded-lg flex items-center justify-center gap-2"
            onClick={handleSetDone}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Set Done
          </button>
        </Show>
      </div>
    </div>
  )
}
