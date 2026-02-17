/**
 * AMRAP Modal Component - Record reps for AMRAP sets
 */

import { createSignal, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { amrapModal, setAmrapModal, recordPR, LIFT_NAMES, state, getPreviousAmrapPerformance, getBestPR } from '../store.js'
import { estimate1RM, estimateReps, repsToBeat } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'
import { toggleMainSet, isMainSetComplete, setAmrapReps } from '../hooks/useCompletedSets.js'
import confetti from 'canvas-confetti'

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

  // Reps needed to beat all-time best estimated 1RM
  const repsToBeatPR = () => {
    const m = modal()
    if (!m) return null
    const bestPR = getBestPR(m.liftId)
    if (!bestPR) return null
    return {
      reps: repsToBeat(m.weight, bestPR.estimated1RM),
      best1RM: bestPR.estimated1RM
    }
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

    const newEstimated = estimate1RM(modal().weight, r)
    const bestPR = getBestPR(modal().liftId)
    const isNewPR = !bestPR || newEstimated > bestPR.estimated1RM

    haptic()
    if (isNewPR) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff0000', '#ffffff', '#00ff00', '#0000ff', '#ffff00']
      })
    }

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
          <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div class="relative bg-bg border border-border rounded-none w-full max-w-sm overflow-hidden shadow-2xl">
            <div class="px-4 py-3 border-b border-border bg-bg-card">
              <h2 class="text-lg font-bold font-mono uppercase tracking-wide">{LIFT_NAMES[modal().liftId]} AMRAP</h2>
              <p class="text-xs text-text-dim font-mono uppercase">{modal().weight} × {modal().minReps}+</p>
            </div>

            <div class="p-4 space-y-4">
              <Show when={!saved()} fallback={
                <div class="text-center py-4">
                  <div class="text-2xl font-bold text-text font-mono">{estimated()}</div>
                  <div class="text-sm text-text-muted font-mono uppercase">Estimated 1RM recorded</div>
                </div>
              }>
                {/* Previous Performance Card */}
                <div class="grid grid-cols-2 gap-2">
                  <Show when={previousPerformance()}>
                    <div class="bg-bg-hover border border-border rounded-none px-3 py-2">
                      <div class="text-[10px] text-text-dim mb-1 font-mono uppercase leading-tight">Last time at {previousPerformance().weight}</div>
                      <div class="flex items-baseline justify-between">
                        <span class="text-lg font-bold font-mono">{previousPerformance().reps} REPS</span>
                      </div>
                      <div class="text-[9px] text-text-dim font-mono uppercase mt-1">{formatPreviousDate(previousPerformance().date)}</div>
                    </div>
                  </Show>
                  <Show when={repsToBeatPR()}>
                    <div class="bg-bg-hover border border-primary/30 rounded-none px-3 py-2">
                      <div class="text-[10px] text-primary mb-1 font-mono uppercase leading-tight">To beat all-time PR</div>
                      <div class="flex items-baseline justify-between">
                        <span class="text-lg font-bold font-mono text-primary">{repsToBeatPR().reps} REPS</span>
                      </div>
                      <div class="text-[9px] text-text-dim font-mono uppercase mt-1">Best E1RM: {repsToBeatPR().best1RM}</div>
                    </div>
                  </Show>
                </div>

                <div>
                  <label class="block text-xs font-bold text-text-muted mb-2 font-mono uppercase">Reps completed</label>
                  <input
                    type="number"
                    inputmode="numeric"
                    min="1"
                    class="w-full bg-bg border border-border rounded-none px-4 py-3 text-2xl text-center font-bold focus:outline-none focus:border-text font-mono"
                    value={reps()}
                    onInput={(e) => setReps(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={expectedReps() ? `~${expectedReps()}` : ''}
                    autofocus
                  />
                  <Show when={expectedReps()}>
                    <div class="text-center mt-2 text-[10px] text-text-dim font-mono uppercase">
                      Target: {expectedReps()} reps
                      <Show when={parseInt(reps(), 10) > 0}>
                        {(() => {
                          const r = parseInt(reps(), 10)
                          const expected = expectedReps()
                          if (r >= expected + 2) return <span class="text-text font-bold ml-2">+{r - expected} ABOVE</span>
                          if (r >= expected) return <span class="text-text-muted ml-2">ON TRACK</span>
                          return <span class="text-text-dim ml-2">{r - expected} BELOW</span>
                        })()}
                      </Show>
                    </div>
                  </Show>
                </div>

                <Show when={estimated()}>
                  <div class="text-center py-2">
                    <div class="text-xs text-text-muted font-mono uppercase">Estimated 1RM</div>
                    <div class="text-3xl font-bold font-mono">{estimated()}</div>
                  </div>
                </Show>

                <div class="flex gap-2">
                  <button
                    class="flex-1 py-3 text-text-muted hover:text-text font-mono uppercase text-xs font-bold border border-transparent hover:border-border transition-colors rounded-none"
                    onClick={handleClose}
                  >
                    Cancel
                  </button>
                  <button
                    class="flex-1 py-3 bg-text text-bg hover:bg-white rounded-none font-bold font-mono uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
