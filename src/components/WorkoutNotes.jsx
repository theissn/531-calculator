/**
 * WorkoutNotes Component - Optional notes for the current session
 */

import { createSignal, createEffect, Show } from 'solid-js'
import { state, saveWorkoutNote, getTodayNote } from '../store.js'
import { haptic } from '../hooks/useMobile.js'

export default function WorkoutNotes() {
  const [note, setNote] = createSignal('')
  const [isExpanded, setIsExpanded] = createSignal(false)
  const [saved, setSaved] = createSignal(false)

  // Load today's note if exists
  createEffect(() => {
    const todayNote = getTodayNote()
    if (todayNote) {
      setNote(todayNote.note)
      setIsExpanded(true)
    }
  })

  const handleSave = async () => {
    haptic()
    await saveWorkoutNote(note(), state.currentWeek)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleToggle = () => {
    haptic()
    setIsExpanded(!isExpanded())
  }

  return (
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <button
        class="w-full px-4 py-3 flex items-center justify-between text-left"
        onClick={handleToggle}
      >
        <span class="text-sm text-text-muted">Workout Notes</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class={`w-4 h-4 text-text-dim transition-transform ${isExpanded() ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <Show when={isExpanded()}>
        <div class="px-4 pb-4 space-y-3">
          <textarea
            class="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-border-hover"
            rows="3"
            placeholder="How did the workout feel? Any issues or PRs to note..."
            value={note()}
            onInput={(e) => setNote(e.target.value)}
          />
          <div class="flex items-center justify-between">
            <Show when={saved()}>
              <span class="text-xs text-text-dim">Saved</span>
            </Show>
            <Show when={!saved()}>
              <span />
            </Show>
            <button
              class="px-4 py-1.5 bg-border hover:bg-border-hover rounded text-sm font-medium disabled:opacity-50"
              onClick={handleSave}
              disabled={!note().trim()}
            >
              Save
            </button>
          </div>
        </div>
      </Show>
    </div>
  )
}
