/**
 * FinishWorkoutButton Component - Shows when workout has progress
 */

import { Show, createSignal } from 'solid-js'
import { state, getCurrentWorkout, LIFT_NAMES, getLiftData } from '../store.js'
import { getMainCompletedCount, getCompletedCount } from '../hooks/useCompletedSets.js'
import { getCompletedAccessoryCount } from '../hooks/useAccessoryTracking.js'
import FinishWorkoutModal from './FinishWorkoutModal.jsx'

export default function FinishWorkoutButton() {
  const [showModal, setShowModal] = createSignal(false)

  const currentWorkout = () => getCurrentWorkout()

  const hasProgress = () => {
    const workout = currentWorkout()
    if (!workout) return false

    const mainCount = getMainCompletedCount(workout.liftId)
    const supCount = getCompletedCount(workout.liftId)
    const accessoryCount = getCompletedAccessoryCount()

    return mainCount > 0 || supCount > 0 || accessoryCount > 0
  }

  const progressSummary = () => {
    const workout = currentWorkout()
    if (!workout) return null

    const liftData = getLiftData(workout.liftId, workout.week)
    const mainCount = getMainCompletedCount(workout.liftId)
    const mainTotal = liftData.mainSets.length
    const supCount = getCompletedCount(workout.liftId)
    const supTotal = liftData.supplemental?.sets || 0
    const accessoryCount = getCompletedAccessoryCount()

    const parts = []
    parts.push(`${mainCount}/${mainTotal} main`)
    if (supTotal > 0) {
      parts.push(`${supCount}/${supTotal} supplemental`)
    }
    if (accessoryCount > 0) {
      parts.push(`${accessoryCount} accessories`)
    }

    return parts.join(', ')
  }

  return (
    <Show when={hasProgress()}>
      <div class="mt-6 pt-4 border-t border-border">
        <button
          class="w-full py-3 px-4 bg-text text-bg font-bold font-mono uppercase tracking-wider rounded-none flex items-center justify-center gap-2 hover:bg-white transition-colors border border-transparent"
          onClick={() => setShowModal(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Finish Workout
        </button>
        <p class="text-[10px] text-text-dim text-center mt-2 font-mono uppercase tracking-widest">{progressSummary()}</p>
      </div>

      <Show when={showModal()}>
        <FinishWorkoutModal onClose={() => setShowModal(false)} />
      </Show>
    </Show>
  )
}
