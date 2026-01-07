/**
 * LiftCard Component - Display a single lift with sets
 */

import { For, Show } from 'solid-js'
import { LIFT_NAMES } from '../store.js'
import { roundWeight } from '../calculator.js'
import { isMainSetComplete, toggleMainSet } from '../hooks/useCompletedSets.js'
import SetRow from './SetRow.jsx'
import SupplementalSection from './SupplementalSection.jsx'

export default function LiftCard(props) {
  const displayTM = () => roundWeight(props.lift.trainingMax, 1)
  const warmupSets = () => props.isDeload ? [] : props.lift.mainSets.filter(s => s.type === 'warmup')
  const workSets = () => props.lift.mainSets.filter(s => s.type === 'work')

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
                {(set) => <SetRow set={set} unit={props.lift.unit} isWarmup={true} />}
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
      </div>
    </div>
  )
}
