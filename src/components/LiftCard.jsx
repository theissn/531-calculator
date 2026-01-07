/**
 * LiftCard Component - Display a single lift with sets
 */

import { For, Show } from 'solid-js'
import { state, LIFT_NAMES, getTemplateForLift } from '../store.js'
import { roundWeight, calculatePlates, DEFAULT_PLATES_LBS, DEFAULT_PLATES_KG } from '../calculator.js'
import { isMainSetComplete, toggleMainSet } from '../hooks/useCompletedSets.js'
import { isAccessoryComplete, toggleAccessory } from '../hooks/useAccessoryTracking.js'
import { haptic } from '../hooks/useMobile.js'
import SetRow from './SetRow.jsx'
import SupplementalSection from './SupplementalSection.jsx'

function formatExercise(exercise) {
  if (typeof exercise === 'string') return exercise
  return `${exercise.name} ${exercise.sets}x${exercise.reps}`
}

export default function LiftCard(props) {
  const displayTM = () => roundWeight(props.lift.trainingMax, 1)
  const warmupSets = () => props.isDeload ? [] : props.lift.mainSets.filter(s => s.type === 'warmup')
  const workSets = () => props.lift.mainSets.filter(s => s.type === 'work')
  
  const showPlates = () => state.settings?.showPlates
  const barWeight = () => state.settings?.barWeight || (props.lift.unit === 'kg' ? 20 : 45)
  const availablePlates = () => state.settings?.availablePlates || 
    (props.lift.unit === 'kg' ? DEFAULT_PLATES_KG : DEFAULT_PLATES_LBS)
  
  const getPlates = (weight) => {
    if (!showPlates()) return null
    return calculatePlates(weight, barWeight(), availablePlates())
  }

  // Accessories
  const accessoryTemplate = () => getTemplateForLift(props.lift.liftId)
  const accessories = () => accessoryTemplate()?.exercises || []
  const getAccessoryKey = (index) => `${props.lift.liftId}-${index}`
  
  const handleAccessoryToggle = (index) => {
    haptic()
    toggleAccessory(getAccessoryKey(index))
  }

  return (
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-border">
        <div class="flex items-baseline justify-between">
          <h2 class="text-lg font-semibold">{LIFT_NAMES[props.lift.liftId]}</h2>
          <span class="text-sm text-text-dim">TM: {displayTM()} {props.lift.unit}</span>
        </div>
      </div>

      <div class="px-4 py-3">
        <Show when={warmupSets().length > 0}>
          <div class="mb-4">
            <div class="text-xs text-text-dim uppercase tracking-wider mb-2">Warm-up</div>
            <div class="space-y-1">
              <For each={warmupSets()}>
                {(set) => <SetRow set={set} unit={props.lift.unit} isWarmup={true} plates={getPlates(set.weight)} />}
              </For>
            </div>
          </div>
        </Show>

        <div class="space-y-1">
          <For each={workSets()}>
            {(set, index) => (
              <SetRow
                set={set}
                unit={props.lift.unit}
                isWarmup={false}
                isComplete={() => isMainSetComplete(props.lift.liftId, index())}
                onToggle={() => toggleMainSet(props.lift.liftId, index())}
                plates={getPlates(set.weight)}
                liftId={props.lift.liftId}
                setIndex={index()}
              />
            )}
          </For>
        </div>

        <Show when={props.lift.supplemental && !props.isDeload}>
          <SupplementalSection
            liftId={props.lift.liftId}
            supplemental={props.lift.supplemental}
            unit={props.lift.unit}
          />
        </Show>

        <Show when={accessories().length > 0 && !props.isDeload}>
          <div class="mt-4 pt-3 border-t border-border">
            <div class="text-xs text-text-dim uppercase tracking-wider mb-2">Assistance</div>
            <div class="space-y-1">
              <For each={accessories()}>
                {(exercise, index) => {
                  const isComplete = () => isAccessoryComplete(getAccessoryKey(index()))
                  return (
                    <button
                      class="w-full flex items-center gap-2 py-1 text-left"
                      onClick={() => handleAccessoryToggle(index())}
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
                      <span class={`text-sm ${isComplete() ? 'text-text-dim line-through' : 'text-text-muted'}`}>
                        {formatExercise(exercise)}
                      </span>
                    </button>
                  )
                }}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  )
}
