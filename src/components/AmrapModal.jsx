/**
 * AMRAP Modal Component - Record reps for AMRAP sets
 */

import { createSignal, Show } from 'solid-js'
import { Portal } from 'solid-js/web'
import { amrapModal, setAmrapModal, recordPR, LIFT_NAMES } from '../store.js'
import { estimate1RM } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'

export default function AmrapModal() {
  const [reps, setReps] = createSignal('')
  const [saved, setSaved] = createSignal(false)
  
  const modal = () => amrapModal()
  const estimated = () => {
    const r = parseInt(reps(), 10)
    if (!r || r <= 0 || !modal()) return null
    return estimate1RM(modal().weight, r)
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
                    autofocus
                  />
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
