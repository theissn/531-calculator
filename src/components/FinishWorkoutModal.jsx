/**
 * FinishWorkoutModal Component - Confirm and save workout to history
 */

import { Show, For, createSignal } from 'solid-js'
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
import { stopTimer } from '../hooks/useTimer.js'
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

// RPE labels: 1-3 Easy, 4-5 Moderate, 6-7 Hard, 8-9 Very Hard, 10 Maximal
const RPE_LABELS = {
  1: 'Easy', 2: 'Easy', 3: 'Easy',
  4: 'Moderate', 5: 'Moderate',
  6: 'Hard', 7: 'Hard',
  8: 'Very Hard', 9: 'Very Hard',
  10: 'Maximal'
}

export default function FinishWorkoutModal(props) {
  const [saving, setSaving] = createSignal(false)
  const [saved, setSaved] = createSignal(false)
  const [rpe, setRpe] = createSignal(null)

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
    stopTimer()
    setSaving(true)

    try {
      await finishWorkout(rpe())
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

  const handleExport = () => {
    const s = summary()
    if (!s) return

    haptic()
    const text = `5/3/1 ${s.liftName} - Week ${s.week}\nDuration: ${s.duration}\nMain: ${s.mainSets}${s.amrapReps ? ` (AMRAP: ${s.amrapReps} reps)` : ''}\n${s.supplementalSets ? `Supplemental: ${s.supplementalSets}\n` : ''}${s.accessories > 0 ? `Accessories: ${s.accessories} exercises\n` : ''}${rpe() ? `RPE: ${rpe()} (${RPE_LABELS[rpe()]})` : ''}\n#531workout`

    navigator.clipboard.writeText(text).then(() => {
      alert('Workout copied to clipboard!')
    })
  }

  const handleDiscard = async () => {
    haptic()
    stopTimer()
    await discardWorkout()
    clearAllProgress()
    resetAccessories()
    props.onClose()
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <div class="relative bg-bg border border-border rounded-none w-full max-w-sm overflow-hidden shadow-2xl">
          <div class="px-4 py-3 border-b border-border bg-bg-card">
            <h2 class="text-lg font-bold font-mono uppercase tracking-wide">Session Complete</h2>
          </div>

          <div class="p-4">
            <Show when={!saved()} fallback={
              <div class="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 mx-auto text-text mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div class="text-xl font-bold font-mono uppercase tracking-wider">Data Secured</div>
              </div>
            }>
              <Show when={summary()}>
                {(s) => (
                  <div class="space-y-3 bg-bg-hover/50 p-4 border border-border/50 mb-6">
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-text-muted font-mono uppercase text-xs">Lift</span>
                      <span class="font-bold font-mono uppercase">{s().liftName}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-text-muted font-mono uppercase text-xs">Week</span>
                      <span class="font-bold font-mono">{s().week}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-text-muted font-mono uppercase text-xs">Duration</span>
                      <span class="font-bold font-mono">{s().duration}</span>
                    </div>

                    <div class="border-t border-border pt-3 mt-3">
                      <div class="flex justify-between items-center text-sm">
                        <span class="text-text-muted font-mono uppercase text-xs">Main Sets</span>
                        <span class="font-bold font-mono">{s().mainSets}</span>
                      </div>
                      <Show when={s().supplementalSets}>
                        <div class="flex justify-between items-center mt-2 text-sm">
                          <span class="text-text-muted font-mono uppercase text-xs">Supplemental</span>
                          <span class="font-bold font-mono">{s().supplementalSets}</span>
                        </div>
                      </Show>
                      <Show when={s().accessories > 0}>
                        <div class="flex justify-between items-center mt-2 text-sm">
                          <span class="text-text-muted font-mono uppercase text-xs">Accessories</span>
                          <span class="font-bold font-mono">{s().accessories} items</span>
                        </div>
                      </Show>
                      <Show when={s().amrapReps}>
                        <div class="flex justify-between items-center mt-2 text-sm">
                          <span class="text-text-muted font-mono uppercase text-xs">AMRAP Result</span>
                          <span class="font-bold font-mono">{s().amrapReps} reps</span>
                        </div>
                      </Show>
                    </div>
                  </div>
                )}
              </Show>

              <button
                class="w-full py-2 mb-4 bg-bg border border-border text-text-muted hover:text-text text-[10px] font-bold uppercase font-mono flex items-center justify-center gap-2 transition-colors rounded-none"
                onClick={handleExport}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Summary to Clipboard
              </button>

              {/* RPE Selector */}
              <div class="mt-4 pt-4 border-t border-border">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs font-bold text-text-muted font-mono uppercase">Session RPE</span>
                  <Show when={rpe()}>
                    <span class="text-xs font-bold text-text font-mono uppercase">{RPE_LABELS[rpe()]}</span>
                  </Show>
                </div>
                <div class="grid grid-cols-10 gap-px bg-border p-px">
                  <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}>
                    {(value) => (
                      <button
                        class={`py-3 text-xs font-bold font-mono transition-colors ${rpe() === value
                            ? 'bg-text text-bg'
                            : 'bg-bg hover:bg-bg-hover text-text-muted hover:text-text'
                          }`}
                        onClick={() => { haptic(); setRpe(rpe() === value ? null : value) }}
                      >
                        {value}
                      </button>
                    )}
                  </For>
                </div>
                <div class="flex justify-between text-[10px] text-text-dim mt-2 px-0.5 font-mono uppercase tracking-wider">
                  <span>Easy</span>
                  <span>Hard</span>
                  <span>Max</span>
                </div>
              </div>

              <div class="flex gap-3 mt-8">
                <button
                  class="flex-1 py-3 text-text-muted hover:text-text font-mono uppercase text-xs font-bold border border-transparent hover:border-border transition-colors rounded-none"
                  onClick={handleDiscard}
                  disabled={saving()}
                >
                  Discard
                </button>
                <button
                  class="flex-1 py-3 bg-text text-bg hover:bg-white rounded-none font-bold font-mono uppercase text-xs disabled:opacity-50 transition-colors"
                  onClick={handleSave}
                  disabled={saving()}
                >
                  {saving() ? 'SAVING...' : 'CONFIRM SAVE'}
                </button>
              </div>

              <button
                class="w-full py-2 mt-2 text-text-dim hover:text-text-muted text-[10px] font-mono uppercase tracking-widest"
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
