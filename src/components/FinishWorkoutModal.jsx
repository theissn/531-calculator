/**
 * FinishWorkoutModal Component - Confirm and save workout to history
 */

import { Show, createSignal } from 'solid-js'
import { Portal } from 'solid-js/web'
import {
  getCurrentWorkout,
  finishWorkout,
  discardWorkout,
  LIFT_NAMES,
  getLiftData,
  state
} from '../store.js'
import { getMainCompletedCount, getCompletedCount, clearAllProgress } from '../hooks/useCompletedSets.js'
import { getCompletedAccessoryCount, resetAccessories } from '../hooks/useAccessoryTracking.js'
import { haptic } from '../hooks/useMobile.js'

function formatDuration(startedAt) {
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  const minutes = Math.floor((now - start) / 60000)

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function FinishWorkoutModal(props) {
  const [saving, setSaving] = createSignal(false)
  const [saved, setSaved] = createSignal(false)

  const workout = () => getCurrentWorkout()

  const summary = () => {
    const w = workout()
    if (!w) return null

    const liftData = getLiftData(w.liftId, w.week)
    const mainCount = getMainCompletedCount(w.liftId)
    // Filter out warmup sets - only count work sets
    const mainTotal = liftData.mainSets.filter(s => s.type !== 'warmup').length
    const supCount = getCompletedCount(w.liftId)
    const supTotal = liftData.supplemental?.sets || 0
    const accessoryCount = getCompletedAccessoryCount()

    return {
      liftName: LIFT_NAMES[w.liftId],
      week: w.week,
      duration: formatDuration(w.startedAt),
      mainSets: `${mainCount}/${mainTotal}`,
      supplementalSets: supTotal > 0 ? `${supCount}/${supTotal}` : null,
      accessories: accessoryCount,
      amrapReps: w.mainSets?.amrapReps
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !saving()) {
      props.onClose()
    }
  }

  const handleSave = async () => {
    haptic()
    setSaving(true)

    try {
      await finishWorkout()
      clearAllProgress()
      resetAccessories()
      setSaved(true)

      // Auto-close after showing success
      setTimeout(() => {
        props.onClose()
      }, 1200)
    } catch (err) {
      console.error('Failed to save workout:', err)
      setSaving(false)
    }
  }

  const handleDiscard = async () => {
    haptic()
    await discardWorkout()
    clearAllProgress()
    resetAccessories()
    props.onClose()
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/50" />
        <div class="relative bg-bg border border-border rounded-lg w-full max-w-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-border">
            <h2 class="text-lg font-semibold">Finish Workout</h2>
          </div>

          <div class="p-4">
            <Show when={!saved()} fallback={
              <div class="text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 mx-auto text-text mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div class="text-lg font-medium">Workout Saved</div>
              </div>
            }>
              <Show when={summary()}>
                {(s) => (
                  <div class="space-y-3">
                    <div class="flex justify-between items-center">
                      <span class="text-text-muted">Lift</span>
                      <span class="font-medium">{s().liftName}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-text-muted">Week</span>
                      <span class="font-medium">{s().week}</span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-text-muted">Duration</span>
                      <span class="font-medium">{s().duration}</span>
                    </div>

                    <div class="border-t border-border pt-3 mt-3">
                      <div class="flex justify-between items-center">
                        <span class="text-text-muted">Main Sets</span>
                        <span class="font-medium">{s().mainSets}</span>
                      </div>
                      <Show when={s().supplementalSets}>
                        <div class="flex justify-between items-center mt-2">
                          <span class="text-text-muted">Supplemental</span>
                          <span class="font-medium">{s().supplementalSets}</span>
                        </div>
                      </Show>
                      <Show when={s().accessories > 0}>
                        <div class="flex justify-between items-center mt-2">
                          <span class="text-text-muted">Accessories</span>
                          <span class="font-medium">{s().accessories} exercises</span>
                        </div>
                      </Show>
                      <Show when={s().amrapReps}>
                        <div class="flex justify-between items-center mt-2">
                          <span class="text-text-muted">AMRAP</span>
                          <span class="font-medium">{s().amrapReps} reps</span>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Show>

              <div class="flex gap-2 mt-6">
                <button
                  class="flex-1 py-3 text-text-dim hover:text-text-muted text-sm"
                  onClick={handleDiscard}
                  disabled={saving()}
                >
                  Discard
                </button>
                <button
                  class="flex-1 py-3 bg-text text-bg rounded-lg font-medium disabled:opacity-50"
                  onClick={handleSave}
                  disabled={saving()}
                >
                  {saving() ? 'Saving...' : 'Save Workout'}
                </button>
              </div>

              <button
                class="w-full py-2 mt-2 text-text-dim hover:text-text-muted text-sm"
                onClick={props.onClose}
                disabled={saving()}
              >
                Cancel
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  )
}
