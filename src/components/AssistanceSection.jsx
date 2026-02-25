/**
 * AssistanceSection Component - Assistance exercises with set tracking
 */

import { For, Show, createMemo } from 'solid-js'
import { getTemplateForLift, state } from '../store.js'
import { isAccessoryComplete, toggleAccessory } from '../hooks/useAccessoryTracking.js'
import { startTimer, stopTimer } from '../hooks/useTimer.js'
import { haptic } from '../hooks/useMobile.js'

function formatExercise(exercise) {
  if (typeof exercise === 'string') return { name: exercise, sets: 3, reps: 10 }
  return exercise
}

import { getAccessoryWeight, updateAccessoryWeight } from '../hooks/useAccessoryTracking.js'

function ExerciseRow(props) {
  const exercise = () => formatExercise(props.exercise)
  const totalSets = () => exercise().sets

  // Track completed sets for this exercise using keys like "liftId-exerciseIndex-setIndex"
  const getSetKey = (setIndex) => `${props.liftId}-${props.exerciseIndex}-${setIndex}`

  // Track weight using key "liftId-exerciseIndex" (shared across sets for this exercise)
  const getWeightKey = () => `${props.liftId}-${props.exerciseIndex}`

  const completedCount = createMemo(() => {
    let count = 0
    for (let i = 0; i < totalSets(); i++) {
      if (isAccessoryComplete(getSetKey(i))) count++
    }
    return count
  })

  const allDone = () => completedCount() >= totalSets()

  const handleSetDone = () => {
    haptic()
    // Mark the next incomplete set as done
    for (let i = 0; i < totalSets(); i++) {
      if (!isAccessoryComplete(getSetKey(i))) {
        toggleAccessory(getSetKey(i), props.liftId)
        break
      }
    }
    startTimer()
  }

  const handleReset = () => {
    haptic()
    // Reset all sets for this exercise
    for (let i = 0; i < totalSets(); i++) {
      if (isAccessoryComplete(getSetKey(i))) {
        toggleAccessory(getSetKey(i), props.liftId)
      }
    }
    stopTimer()
  }

  return (
    <div class="border border-border p-2.5 bg-bg">
      <div class="flex items-baseline justify-between mb-1.5">
        <span class="text-sm font-bold uppercase tracking-wide text-text font-mono">{exercise().name}</span>
        <span class="text-[10px] font-bold text-text-dim font-mono border border-border px-1">{completedCount()}/{totalSets()}</span>
      </div>

      <div class="flex items-center justify-start gap-2 mb-2.5 text-xs text-text-muted font-mono">
        <span class="font-bold text-text">{exercise().reps}</span> REPS
        <span class="text-text-dim">@</span>
        <input
          type="number"
          placeholder="___"
          class="w-12 bg-transparent border-b border-border focus:border-primary outline-none text-center text-text font-bold p-0 rounded-none placeholder:text-text-dim"
          value={getAccessoryWeight(getWeightKey())}
          onInput={(e) => updateAccessoryWeight(getWeightKey(), e.currentTarget.value, props.liftId)}
        />
        <span class="text-text-dim uppercase">{state.settings?.unit || 'lbs'}</span>
      </div>

      <div class="flex gap-1 mb-3">
        <For each={Array.from({ length: totalSets() }, (_, i) => i)}>
          {(i) => {
            const isDone = () => isAccessoryComplete(getSetKey(i))
            return (
              <div class={`flex-1 h-1.5 border border-border transition-colors duration-0 ${isDone() ? 'bg-primary' : 'bg-transparent'}`} />
            )
          }}
        </For>
      </div>

      <Show when={!allDone()} fallback={
        <button
          class="w-full py-2 bg-bg hover:bg-bg-hover text-text-dim hover:text-text-muted text-xs font-bold uppercase font-mono border border-border transition-colors rounded-none"
          onClick={handleReset}
        >
          Reset
        </button>
      }>
        <button
          class="w-full py-2 bg-primary hover:bg-primary-hover text-primary-content text-xs font-bold uppercase font-mono border border-transparent flex items-center justify-center gap-2 transition-all active:translate-y-px rounded-none"
          onClick={handleSetDone}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Set Done
        </button>
      </Show>
    </div>
  )
}

export default function AssistanceSection(props) {
  const template = () => getTemplateForLift(props.liftId)
  const exercises = () => template()?.exercises || []

  return (
    <Show when={exercises().length > 0}>
      <div class="mt-3 pt-1">
        <div class="flex items-center justify-between mb-3 px-1">
          <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Assistance Work</span>
          <div class="h-px flex-1 bg-border ml-3"></div>
        </div>

        <div class="space-y-3">
          <For each={exercises()}>
            {(exercise, index) => (
              <div class="p-0">
                <ExerciseRow
                  exercise={exercise}
                  liftId={props.liftId}
                  exerciseIndex={index()}
                />
              </div>
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
