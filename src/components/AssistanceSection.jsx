/**
 * AssistanceSection Component - Assistance exercises with set tracking
 */

import { For, Show, createMemo } from 'solid-js'
import { getTemplateForLift } from '../store.js'
import { isAccessoryComplete, toggleAccessory } from '../hooks/useAccessoryTracking.js'
import { startTimer, stopTimer } from '../hooks/useTimer.js'
import { haptic } from '../hooks/useMobile.js'

function formatExercise(exercise) {
  if (typeof exercise === 'string') return { name: exercise, sets: 3, reps: 10 }
  return exercise
}

function ExerciseRow(props) {
  const exercise = () => formatExercise(props.exercise)
  const totalSets = () => exercise().sets
  
  // Track completed sets for this exercise using keys like "liftId-exerciseIndex-setIndex"
  const getSetKey = (setIndex) => `${props.liftId}-${props.exerciseIndex}-${setIndex}`
  
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
        toggleAccessory(getSetKey(i))
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
        toggleAccessory(getSetKey(i))
      }
    }
    stopTimer()
  }

  return (
    <div class="py-3">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-text-muted">{exercise().name}</span>
        <span class="text-xs text-text-dim">{completedCount()}/{totalSets()} sets</span>
      </div>
      
      <div class="text-sm mb-2">
        {exercise().reps} reps
      </div>

      <div class="flex gap-1 mb-2">
        <For each={Array.from({ length: totalSets() }, (_, i) => i)}>
          {(i) => {
            const isDone = () => isAccessoryComplete(getSetKey(i))
            return (
              <div class={`flex-1 h-1.5 rounded-full ${isDone() ? 'bg-text' : 'bg-border'}`} />
            )
          }}
        </For>
      </div>

      <Show when={!allDone()} fallback={
        <button
          class="w-full py-2 px-4 bg-bg-hover text-text-dim hover:text-text-muted text-sm rounded-lg"
          onClick={handleReset}
        >
          Reset
        </button>
      }>
        <button
          class="w-full py-2 px-4 bg-border hover:bg-border-hover text-sm font-medium rounded-lg flex items-center justify-center gap-2"
          onClick={handleSetDone}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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
      <div class="mt-4 pt-3 border-t border-border">
        <div class="text-xs text-text-dim uppercase tracking-wider mb-1">Assistance</div>
        
        <div class="divide-y divide-border">
          <For each={exercises()}>
            {(exercise, index) => (
              <ExerciseRow
                exercise={exercise}
                liftId={props.liftId}
                exerciseIndex={index()}
              />
            )}
          </For>
        </div>
      </div>
    </Show>
  )
}
