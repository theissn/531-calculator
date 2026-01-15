/**
 * ResumeWorkoutModal Component - Prompt to resume or discard incomplete workout
 */

import { Portal } from 'solid-js/web'
import {
  incompleteWorkout,
  dismissIncompleteWorkout,
  discardWorkout,
  setCurrentLift,
  setCurrentWeek,
  LIFT_NAMES
} from '../store.js'
import { initFromWorkout, clearAllProgress } from '../hooks/useCompletedSets.js'
import { initAccessoriesFromWorkout, resetAccessories } from '../hooks/useAccessoryTracking.js'
import { haptic } from '../hooks/useMobile.js'

function formatTimeAgo(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'yesterday'
  return `${diffDays} days ago`
}

function formatProgress(workout) {
  const parts = []

  const mainCount = workout.mainSets?.completed?.length || 0
  if (mainCount > 0) {
    parts.push(`${mainCount} main sets`)
  }

  const supCount = workout.supplemental?.completedCount || 0
  if (supCount > 0) {
    parts.push(`${supCount} supplemental`)
  }

  const accessoryCount = workout.accessories?.length || 0
  if (accessoryCount > 0) {
    parts.push(`${accessoryCount} accessories`)
  }

  return parts.length > 0 ? parts.join(', ') : 'No progress'
}

export default function ResumeWorkoutModal() {
  const workout = () => incompleteWorkout()

  const handleResume = async () => {
    haptic()
    const w = workout()
    if (!w) return

    // Restore tracking state from saved workout
    initFromWorkout(w)
    initAccessoriesFromWorkout(w)

    // Navigate to the workout's lift and week
    await setCurrentLift(w.liftId)
    await setCurrentWeek(w.week)

    // Dismiss the modal
    dismissIncompleteWorkout()
  }

  const handleDiscard = async () => {
    haptic()
    await discardWorkout()
    clearAllProgress()
    resetAccessories()
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-bg border border-border rounded-lg w-full max-w-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <h2 class="text-lg font-semibold">Resume Workout?</h2>
          </div>

          <div class="p-4">
            <p class="text-text-muted mb-4">
              You have an incomplete workout from a previous session.
            </p>

            <div class="bg-bg-hover rounded-lg p-3 space-y-2 mb-4">
              <div class="flex justify-between">
                <span class="text-text-muted">Lift</span>
                <span class="font-medium">{LIFT_NAMES[workout()?.liftId]}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Week</span>
                <span class="font-medium">{workout()?.week}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Started</span>
                <span class="font-medium">{formatTimeAgo(workout()?.startedAt)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-muted">Progress</span>
                <span class="font-medium text-sm">{formatProgress(workout())}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                class="flex-1 py-3 text-text-dim hover:text-text-muted"
                onClick={handleDiscard}
              >
                Discard
              </button>
              <button
                class="flex-1 py-3 bg-text text-bg rounded-lg font-medium"
                onClick={handleResume}
              >
                Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
