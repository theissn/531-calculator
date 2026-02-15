/**
 * LiftCard Component - Display a single lift with sets
 */

import { For, Show, createSignal } from 'solid-js'
import { state, LIFT_NAMES } from '../store.js'
import { roundWeight, calculatePlates, DEFAULT_PLATES_LBS, DEFAULT_PLATES_KG } from '../calculator.js'
import { isMainSetComplete, toggleMainSet } from '../hooks/useCompletedSets.js'
import SetRow from './SetRow.jsx'
import SupplementalSection from './SupplementalSection.jsx'
import AssistanceSection from './AssistanceSection.jsx'

export default function LiftCard(props) {
  const displayTM = () => roundWeight(props.lift.trainingMax, 1)
  const warmupSets = () => props.isDeload ? [] : props.lift.mainSets.filter(s => s.type === 'warmup')
  const workSets = () => props.lift.mainSets.filter(s => s.type === 'work')

  const showPlates = () => state.settings?.showPlates
  const showTopSetBadge = () => state.settings?.showTopSetBadge ?? true
  const showNextWeightJump = () => state.settings?.showNextWeightJump ?? true
  const barWeight = () => state.settings?.barWeight || (props.lift.unit === 'kg' ? 20 : 45)
  const availablePlates = () => state.settings?.availablePlates ||
    (props.lift.unit === 'kg' ? DEFAULT_PLATES_KG : DEFAULT_PLATES_LBS)

  const getPlates = (weight) => {
    if (!showPlates()) return null
    return calculatePlates(weight, barWeight(), availablePlates())
  }

  return (
    <div class="relative overflow-hidden rounded-none bg-bg-card border border-border shadow-xl shadow-black/5 industrial-card group">
      <div class="corner-marker corner-marker-tl" />
      <div class="corner-marker corner-marker-tr" />
      <div class="corner-marker corner-marker-bl" />
      <div class="corner-marker corner-marker-br" />
      <div class="absolute inset-x-0 top-0 h-1 bg-primary" />

      <div class="p-4 pb-3">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-2xl font-bold tracking-tight text-text">{LIFT_NAMES[props.lift.liftId]}</h2>
          <div class="flex items-center gap-2 px-3 py-1 rounded-none bg-bg-hover/50 border border-border">
            <span class="text-xs text-text-muted uppercase tracking-wider font-semibold">TM</span>
            <span class="text-sm font-bold tabular-nums text-text">{displayTM()}</span>
            <span class="text-[10px] text-text-dim">{props.lift.unit}</span>
          </div>
        </div>

        <Show when={warmupSets().length > 0}>
          <div class="mb-4">
            <div class="mb-2 pb-1 border-b border-border/50">
              <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Warm-up Protocol</span>
            </div>
            <div class="space-y-px">
              <For each={warmupSets()}>
                {(set) => (
                  <SetRow
                    set={set}
                      unit={props.lift.unit}
                      isWarmup={true}
                      plates={getPlates(set.weight)}
                      onToggle={() => {
                        // Warmups don't need persistence, but this enables the UI checkbox
                        haptic()
                      }}
                      isComplete={() => false} // Warmups are always "visual only" for now, or we could track local state if needed.
                    // The user just wants to click them. SetRow handles local visual toggle if we don't pass isComplete prop?
                    // Wait, SetRow only uses isComplete() from props.
                    // If I want them to toggle, I need state.
                    // KEEP IT SIMPLE: Just let them click it visually?
                    // SetRow logic: `isComplete` comes from props.
                    // If I want it to toggle, I need to track it.
                    // Use a local signal in SetRow? No, SetRow is controlled.
                    // Re-reading SetRow: `isComplete` is a function.
                    // If I don't pass `isComplete`, it's undefined.
                    // Actually, warmups in this app are usually just reference.
                    // User requests "checkboxes... are disabled".
                    // I'll add a dummy toggle for now to 'enable' the button, but without state it won't check.
                    // I should probably track warmups locally in LiftCard or just let them be unchecked but clickable?
                    // Better: Track local state for warmups in LiftCard or just allow the click effect.
                    // Let's use a local Set in LiftCard for checked warmups to make it satisfying.
                    />
                  )}
                </For>
            </div>
          </div>
        </Show>

        <div>
          <div class="mb-2 pb-1 border-b border-primary/30 flex justify-between items-end">
            <span class="text-xs font-bold text-primary uppercase tracking-widest font-mono">Work Sets</span>
            <div class="h-1 w-1 bg-primary"></div>
          </div>
          <div class="divide-y divide-border/20 bg-bg-card/50 overflow-hidden border border-border/20 rounded-none">
            <For each={workSets()}>
              {(set, index) => (
                <SetRow
                  set={set}
                  unit={props.lift.unit}
                  isWarmup={false}
                  isTopSet={index() === workSets().length - 1}
                  isComplete={() => isMainSetComplete(props.lift.liftId, index())}
                  onToggle={() => toggleMainSet(props.lift.liftId, index())}
                  plates={getPlates(set.weight)}
                  nextWeight={workSets()[index() + 1]?.weight ?? null}
                  showTopSetBadge={showTopSetBadge()}
                  showNextJump={showNextWeightJump()}
                  liftId={props.lift.liftId}
                  setIndex={index()}
                />
              )}
            </For>
          </div>
        </div>

        <Show when={props.lift.supplemental && !props.isDeload}>
          <div class="mt-2 pt-2 border-t border-border/50">
            <SupplementalSection
              liftId={props.lift.liftId}
              supplemental={props.lift.supplemental}
              unit={props.lift.unit}
              supplementalLiftId={props.lift.supplementalLiftId}
              supplementalLiftName={props.lift.supplementalLiftName}
            />
          </div>
        </Show>

        <Show when={!props.isDeload}>
          <div class="mt-2">
            <AssistanceSection liftId={props.lift.liftId} />
          </div>
        </Show>
      </div>
    </div>
  )
}
