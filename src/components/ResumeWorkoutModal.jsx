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
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div class="relative bg-bg border border-border rounded-none w-full max-w-sm overflow-hidden shadow-2xl">
          <div class="px-4 py-3 border-b border-border bg-bg-card">
            <h2 class="text-lg font-bold font-mono uppercase tracking-wide">Resume Session?</h2>
          </div>

          <div class="p-4">
            <p class="text-text-muted mb-6 text-sm font-mono">
              Incomplete session data detected in local storage.
            </p>

            <div class="bg-bg-hover border border-border/50 rounded-none p-4 space-y-3 mb-6">
              <div class="flex justify-between items-center text-sm">
                <span class="text-text-muted font-mono uppercase text-xs">Lift</span>
                <span class="font-bold font-mono uppercase">{LIFT_NAMES[workout()?.liftId]}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-text-muted font-mono uppercase text-xs">Week</span>
                <span class="font-bold font-mono">{workout()?.week}</span>
              </div>
              <div class="flex justify-between items-center text-sm">
                <span class="text-text-muted font-mono uppercase text-xs">Started</span>
                <span class="font-bold font-mono">{formatTimeAgo(workout()?.startedAt)}</span>
              </div>
              <div class="flex justify-between items-center text-sm border-t border-border/50 pt-2 mt-2">
                <span class="text-text-muted font-mono uppercase text-xs">Progress</span>
                <span class="font-bold font-mono text-xs uppercase">{formatProgress(workout())}</span>
              </div>
            </div>

            <div class="flex gap-3">
              <button
                class="flex-1 py-3 text-text-muted hover:text-text font-mono uppercase text-xs font-bold border border-transparent hover:border-border transition-colors rounded-none"
                onClick={handleDiscard}
              >
                Discard Data
              </button>
              <button
                class="flex-1 py-3 bg-text text-bg hover:bg-white rounded-none font-bold font-mono uppercase text-xs transition-colors"
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
