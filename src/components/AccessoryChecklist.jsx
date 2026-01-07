/**
 * AccessoryChecklist Component - Display and track accessories per lift
 */

import { Show, For, createMemo } from 'solid-js'
import { state, getTemplateForLift, LIFT_NAMES } from '../store.js'
import { 
  isAccessoryComplete, 
  toggleAccessory, 
  getCompletedAccessoryCount,
  resetAccessories 
} from '../hooks/useAccessoryTracking.js'
import { haptic } from '../hooks/useMobile.js'

/**
 * Format exercise for display
 */
function formatExercise(exercise) {
  if (typeof exercise === 'string') return exercise
  return `${exercise.name} ${exercise.sets}x${exercise.reps}`
}

function LiftAccessories(props) {
  const template = () => getTemplateForLift(props.liftId)
  const exercises = () => template()?.exercises || []
  
  // Use lift-specific keys for tracking: "liftId-exerciseIndex"
  const getKey = (index) => `${props.liftId}-${index}`
  
  const completedCount = createMemo(() => {
    let count = 0
    for (let i = 0; i < exercises().length; i++) {
      if (isAccessoryComplete(getKey(i))) count++
    }
    return count
  })
  
  const allDone = () => exercises().length > 0 && completedCount() >= exercises().length

  const handleToggle = (index) => {
    haptic()
    toggleAccessory(getKey(index))
  }

  const handleReset = () => {
    haptic()
    for (let i = 0; i < exercises().length; i++) {
      if (isAccessoryComplete(getKey(i))) {
        toggleAccessory(getKey(i))
      }
    }
  }

  return (
    <Show when={template() && exercises().length > 0}>
      <div class="border-t border-border">
        <div class="px-4 py-2 flex items-center justify-between bg-bg-hover/50">
          <span class="text-xs text-text-muted uppercase tracking-wider">{template().name}</span>
          <span class="text-xs text-text-dim">{completedCount()}/{exercises().length}</span>
        </div>
        
        <div class="divide-y divide-border">
          <For each={exercises()}>
            {(exercise, index) => {
              const isComplete = () => isAccessoryComplete(getKey(index()))
              return (
                <button
                  class="w-full px-4 py-2 flex items-center gap-3 text-left hover:bg-bg-hover"
                  onClick={() => handleToggle(index())}
                >
                  <div class={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isComplete() ? 'bg-text border-text' : 'border-border-hover'
                  }`}>
                    <Show when={isComplete()}>
                      <svg class="w-3 h-3 text-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </Show>
                  </div>
                  <span class={`text-sm ${isComplete() ? 'text-text-dim line-through' : ''}`}>
                    {formatExercise(exercise)}
                  </span>
                </button>
              )
            }}
          </For>
        </div>

        <Show when={allDone()}>
          <button
            class="w-full px-4 py-2 text-xs text-text-muted hover:text-text border-t border-border"
            onClick={handleReset}
          >
            Reset
          </button>
        </Show>
      </div>
    </Show>
  )
}

export default function AccessoryChecklist() {
  // Check if any lift has accessories assigned
  const hasAnyAccessories = createMemo(() => {
    return ['squat', 'bench', 'deadlift', 'ohp'].some(liftId => {
      const template = getTemplateForLift(liftId)
      return template && template.exercises.length > 0
    })
  })

  return (
    <Show when={hasAnyAccessories()}>
      <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <h3 class="font-semibold">Accessories</h3>
        </div>
        
        <For each={['squat', 'bench', 'deadlift', 'ohp']}>
          {(liftId) => <LiftAccessories liftId={liftId} />}
        </For>
      </div>
    </Show>
  )
}
