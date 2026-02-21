/**
 * WorkoutHistoryView Component - Display completed workout history
 */

import { Show, For, createSignal, createMemo } from 'solid-js'
import { getWorkoutHistory, deleteWorkoutFromHistory, LIFT_NAMES, setWorkoutToView } from '../store.js'
import { haptic } from '../hooks/useMobile.js'
import CopyButton from './CopyButton.jsx'
import { formatWorkoutForLLM, formatCycleForLLM } from '../utils/formatForLLM.js'

function formatDate(isoString) {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatDuration(seconds) {
  if (seconds < 60) return '<1 min'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

function WorkoutCard(props) {
  const [expanded, setExpanded] = createSignal(false)
  const [confirmDelete, setConfirmDelete] = createSignal(false)

  const workout = () => props.workout

  const mainSetsCompleted = () => workout().mainSets.filter(s => s.completed).length
  const mainSetsTotal = () => workout().mainSets.length
  const amrapSet = () => workout().mainSets.find(s => s.isAmrap && s.actualReps)

  const handleDelete = async () => {
    haptic()
    await deleteWorkoutFromHistory(workout().id)
    setConfirmDelete(false)
  }

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <button
        class="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={() => { haptic(); setExpanded(!expanded()) }}
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="font-medium">{LIFT_NAMES[workout().liftId]}</span>
            <span class="text-xs text-text-dim bg-bg-hover px-1.5 py-0.5 rounded-none font-mono">
              Week {workout().week}
            </span>
          </div>
          <div class="text-sm text-text-muted mt-0.5 font-mono">
            {formatDate(workout().completedAt)} at {formatTime(workout().completedAt)}
          </div>
        </div>
        <div class="flex items-center gap-3">
          <Show when={workout().rpe}>
            <div class="text-xs bg-bg-hover px-1.5 py-0.5 rounded-none text-text-muted font-mono font-bold">
              RPE {workout().rpe}
            </div>
          </Show>
          <div class="text-right">
            <div class="text-sm font-bold font-mono">{mainSetsCompleted()}/{mainSetsTotal()}</div>
            <div class="text-xs text-text-dim font-mono">{formatDuration(workout().duration)}</div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`w-5 h-5 text-text-muted transition-transform ${expanded() ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <Show when={expanded()}>
        <div class="px-4 pb-4 border-t border-border pt-3 space-y-3">
          {/* Main Sets */}
          <div>
            <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Main Sets</div>
            <div class="space-y-1.5">
              <For each={workout().mainSets}>
                {(set) => (
                  <div class="flex items-center justify-between text-sm font-mono">
                    <span class={set.completed ? '' : 'text-text-dim line-through'}>
                      {set.weight} x {String(set.targetReps).replace('+', '')}
                      <Show when={set.isAmrap}>
                        <span class="text-text-muted">+</span>
                      </Show>
                    </span>
                    <span class="text-text-muted text-xs">
                      {set.percentage}%
                      <Show when={set.isAmrap && set.actualReps}>
                        <span class="text-text ml-2 font-bold">{set.actualReps} reps</span>
                      </Show>
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Joker Sets */}
          <Show when={workout().jokerSets && workout().jokerSets.length > 0}>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Joker Sets</div>
              <div class="space-y-1.5">
                <For each={workout().jokerSets}>
                  {(set) => (
                    <div class="flex items-center justify-between text-sm font-mono">
                      <span class={set.completed ? '' : 'text-text-dim line-through'}>
                        {set.weight} x {set.reps}
                      </span>
                      <span class="text-text-muted text-xs">
                        {set.percentage}%
                        <Show when={set.completed}>
                          <span class="text-text ml-2 font-bold">OK</span>
                        </Show>
                      </span>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Supplemental */}
          <Show when={workout().supplemental && workout().supplemental.targetSets > 0}>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Supplemental</div>
              <div class="flex items-center justify-between text-sm font-mono">
                <span>{workout().supplemental.weight} x {workout().supplemental.reps}</span>
                <span class="text-text-muted">
                  {workout().supplemental.completedSets}/{workout().supplemental.targetSets} sets
                </span>
              </div>
            </div>
          </Show>

          {/* Accessories */}
          <Show when={workout().accessories && workout().accessories.length > 0}>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Accessories</div>
              <Show when={typeof workout().accessories[0] === 'object'} fallback={
                <div class="text-sm text-text-muted font-mono">
                  {workout().accessories.length} exercises completed
                </div>
              }>
                <div class="space-y-1">
                  <For each={workout().accessories}>
                    {(accessory) => (
                      <div class="flex items-center justify-between text-sm font-mono">
                        <span>{accessory.name}</span>
                        <span class="text-text-muted">
                          {accessory.weight ? <span>{accessory.weight} lbs <span class="text-text-dim">/</span> </span> : ''}
                          {accessory.completedSets}/{accessory.sets}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          {/* Note */}
          <Show when={workout().note}>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Note</div>
              <p class="text-sm text-text-muted font-mono">{workout().note}</p>
            </div>
          </Show>

          {/* RPE */}
          <Show when={workout().rpe}>
            <div>
              <div class="text-xs text-text-muted uppercase tracking-wider mb-2 font-mono">Session RPE</div>
              <div class="text-sm font-mono">{workout().rpe}/10</div>
            </div>
          </Show>

          {/* Snapshot Info */}
          <div class="pt-2 border-t border-border flex items-center justify-between text-xs text-text-dim font-mono">
            <span>TM: {Math.round(workout().trainingMax)} {workout().unit}</span>
            <span>1RM: {workout().oneRepMax} {workout().unit}</span>
          </div>

          {/* Actions */}
          <div class="pt-2 flex items-center justify-between">
            <CopyButton
              getText={() => formatWorkoutForLLM(workout())}
              label="Copy workout"
            />
          </div>

          {/* Delete Action */}
          <div class="pt-2">
            <Show when={!confirmDelete()} fallback={
              <div class="flex gap-2">
                <button
                  class="flex-1 py-2 text-sm text-text-muted hover:text-text font-mono uppercase rounded-none border border-transparent hover:border-border"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  class="flex-1 py-2 text-sm text-red-500 hover:text-red-400 font-mono uppercase rounded-none border border-transparent hover:border-red-900/30"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            }>
              <button
                class="w-full py-2 text-xs text-text-dim hover:text-text-muted font-mono uppercase tracking-widest"
                onClick={() => { haptic(); setConfirmDelete(true) }}
              >
                Delete from history
              </button>
            </Show>
          </div>

          {/* View Detail Action */}
          <div class="pt-2">
            <button
              class="w-full py-2 bg-text text-bg text-xs font-bold uppercase font-mono tracking-widest hover:bg-text/90 transition-colors rounded-none"
              onClick={() => { haptic(); setWorkoutToView(workout()) }}
            >
              View Details
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default function WorkoutHistoryView() {
  const [filterLift, setFilterLift] = createSignal(null)

  const history = createMemo(() => {
    const all = getWorkoutHistory(filterLift())
    // Sort by completedAt descending (newest first)
    return [...all].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  })

  const groupedHistory = createMemo(() => {
    const groups = {}
    for (const workout of history()) {
      const date = new Date(workout.completedAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(workout)
    }
    return Object.entries(groups).map(([date, workouts]) => ({
      date,
      displayDate: formatDate(workouts[0].completedAt),
      workouts
    }))
  })

  return (
    <div class="space-y-4">
      {/* Filter */}
      <div class="flex gap-2 flex-wrap">
        <button
          class={`px-3 py-1.5 text-xs font-bold font-mono uppercase rounded-none border ${filterLift() === null
            ? 'bg-text text-bg border-text'
            : 'border-border text-text-muted hover:border-text hover:text-text'
            }`}
          onClick={() => { haptic(); setFilterLift(null) }}
        >
          All
        </button>
        <For each={['squat', 'bench', 'deadlift', 'ohp']}>
          {(liftId) => (
            <button
              class={`px-3 py-1.5 text-xs font-bold font-mono uppercase rounded-none border ${filterLift() === liftId
                ? 'bg-text text-bg border-text'
                : 'border-border text-text-muted hover:border-text hover:text-text'
                }`}
              onClick={() => { haptic(); setFilterLift(liftId) }}
            >
              {LIFT_NAMES[liftId].split(' ')[0]}
            </button>
          )}
        </For>
        <Show when={history().length > 0}>
          <CopyButton
            getText={() => formatCycleForLLM(history())}
            label="Copy cycle"
          />
        </Show>
      </div>

      {/* Workout List */}
      <Show when={history().length > 0} fallback={
        <div class="text-center py-12 text-text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto mb-3 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No workouts recorded yet</p>
          <p class="text-sm text-text-dim mt-1">Complete a workout to see it here</p>
        </div>
      }>
        <For each={groupedHistory()}>
          {(group) => (
            <div>
              <div class="text-xs text-text-dim uppercase tracking-wider mb-2">
                {group.displayDate}
              </div>
              <div class="space-y-2">
                <For each={group.workouts}>
                  {(workout) => <WorkoutCard workout={workout} />}
                </For>
              </div>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}
