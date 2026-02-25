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
    <div class="mt-2 pt-2">
      <div class="flex items-center justify-between mb-3">
        <span class="text-xs font-bold font-mono uppercase tracking-widest text-text-muted">
          {props.supplemental.templateName}
          <Show when={props.supplementalLiftId && props.supplementalLiftId !== props.liftId}>
            {' '}{props.supplementalLiftName}
          </Show>
        </span>
        <div class="px-2 py-px border border-border text-[10px] font-bold font-mono text-text-dim uppercase">
          {completedCount()}/{totalSets} SETS
        </div>
      </div>

      <div class="flex items-center justify-between mb-3">
        <span class="text-lg font-bold font-mono text-text">
          {props.supplemental.reps} <span class="text-xs font-bold text-text-dim">REPS @</span> {props.supplemental.weight} <span class="text-xs font-bold text-text-dim">{props.unit}</span>
        </span>
      </div>

      <div class="flex gap-1 mb-3">
        <For each={Array.from({ length: totalSets }, (_, i) => i)}>
          {(i) => {
            const isDone = () => i < completedCount()
            return (
              <div
                class={`flex-1 h-2 border border-border transition-colors duration-0 ${isDone() ? 'bg-primary' : 'bg-transparent'}`}
              />
            )
          }}
        </For>
      </div>

      <div class="flex gap-2">
        <Show when={!allDone()} fallback={
          <button
            class="w-full py-2.5 px-4 bg-bg hover:bg-bg-hover text-text-dim hover:text-text text-xs font-bold font-mono uppercase tracking-wider border border-border transition-colors rounded-none"
            onClick={handleReset}
          >
            Reset Section
          </button>
        }>
          <button
            class="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-primary-content text-xs font-bold font-mono uppercase tracking-wider border border-transparent flex items-center justify-center gap-2 transition-all active:translate-y-px rounded-none"
            onClick={handleSetDone}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Complete Set
          </button>
        </Show>
      </div>
    </div>
  )
}
