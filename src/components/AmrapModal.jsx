/**
 * AMRAP Modal Component - Record reps for AMRAP sets
 */

import { createSignal, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { amrapModal, setAmrapModal, recordPR, LIFT_NAMES, state, getPreviousAmrapPerformance } from '../store.js'
import { estimate1RM, estimateReps } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'
import { toggleMainSet, isMainSetComplete, setAmrapReps } from '../hooks/useCompletedSets.js'

export default function AmrapModal() {
  const [reps, setReps] = createSignal('')
  const [saved, setSaved] = createSignal(false)
  
  const modal = () => amrapModal()
  const estimated = () => {
    const r = parseInt(reps(), 10)
    if (!r || r <= 0 || !modal()) return null
    return estimate1RM(modal().weight, r)
  }

  // Expected reps based on user's stored 1RM
  const expectedReps = () => {
    const m = modal()
    if (!m) return null
    const oneRepMax = state.lifts[m.liftId]?.oneRepMax
    if (!oneRepMax) return null
    return estimateReps(m.weight, oneRepMax)
  }

  // Previous performance at similar weight
  const previousPerformance = () => {
    const m = modal()
    if (!m) return null
    return getPreviousAmrapPerformance(m.liftId, m.weight)
  }

  const formatPreviousDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const handleClose = () => {
    setAmrapModal(null)
    setReps('')
    setSaved(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleSave = async () => {
    const r = parseInt(reps(), 10)
    if (!r || r <= 0 || !modal()) return

    haptic()
    await recordPR(modal().liftId, modal().weight, r, modal().week)

    // Save AMRAP reps to current workout for history
    await setAmrapReps(modal().liftId, r)

    // Mark the set as complete if not already
    if (modal().setIndex !== undefined && !isMainSetComplete(modal().liftId, modal().setIndex)) {
      await toggleMainSet(modal().liftId, modal().setIndex)
    }

    setSaved(true)

    // Auto-close after showing result
    setTimeout(handleClose, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && estimated()) {
      handleSave()
    }
  }

  return (
    <Show when={modal()}>
      <Portal>
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
          <div class="absolute inset-0 bg-black/50" />
          <div class="relative bg-bg border border-border rounded-lg w-full max-w-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-border">
              <h2 class="text-lg font-semibold">{LIFT_NAMES[modal().liftId]} AMRAP</h2>
              <p class="text-sm text-text-muted">{modal().weight} × {modal().minReps}+</p>
            </div>
            
            <div class="p-4 space-y-4">
              <Show when={!saved()} fallback={
                <div class="text-center py-4">
                  <div class="text-2xl font-bold text-text">{estimated()}</div>
                  <div class="text-sm text-text-muted">Estimated 1RM recorded</div>
                </div>
              }>
                {/* Previous Performance Card */}
                <Show when={previousPerformance()}>
                  <div class="bg-bg-hover border border-border rounded-lg px-3 py-2">
                    <div class="text-xs text-text-dim mb-1">Last time at {previousPerformance().weight} {state.settings?.unit || 'lbs'}</div>
                    <div class="flex items-baseline justify-between">
                      <span class="text-lg font-bold">{previousPerformance().reps} reps</span>
                      <span class="text-xs text-text-dim">{formatPreviousDate(previousPerformance().date)}</span>
                    </div>
                  </div>
                </Show>

                <div>
                  <label class="block text-sm text-text-muted mb-2">Reps completed</label>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    class="w-full bg-bg border border-border rounded-lg px-4 py-3 text-2xl text-center font-bold focus:outline-none focus:border-border-hover"
                    value={reps()}
                    onInput={(e) => setReps(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={expectedReps() ? `~${expectedReps()}` : ''}
                    autofocus
                  />
                  <Show when={expectedReps()}>
                    <div class="text-center mt-2 text-sm text-text-dim">
                      Target: {expectedReps()} reps
                      <Show when={parseInt(reps(), 10) > 0}>
                        {(() => {
                          const r = parseInt(reps(), 10)
                          const expected = expectedReps()
                          if (r >= expected + 2) return <span class="text-green-500 ml-2">+{r - expected} above</span>
                          if (r >= expected) return <span class="text-text-muted ml-2">on track</span>
                          return <span class="text-amber-500 ml-2">{r - expected} below</span>
                        })()}
                      </Show>
                    </div>
                  </Show>
                </div>
                
                <Show when={estimated()}>
                  <div class="text-center py-2">
                    <div class="text-sm text-text-muted">Estimated 1RM</div>
                    <div class="text-3xl font-bold">{estimated()}</div>
                  </div>
                </Show>
                
                <div class="flex gap-2">
                  <button
                    class="flex-1 py-3 text-text-muted hover:text-text"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    class="flex-1 py-3 bg-border hover:bg-border-hover rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSave}
                    disabled={!estimated()}
                  >
                    Save PR
                  </button>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
