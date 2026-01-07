/**
 * AccessoryChecklist Component - Display and track accessories
 */

import { Show, For } from 'solid-js'
import { getActiveTemplate } from '../store.js'
import { 
  isAccessoryComplete, 
  toggleAccessory, 
  getCompletedAccessoryCount,
  resetAccessories 
} from '../hooks/useAccessoryTracking.js'
import { haptic } from '../hooks/useMobile.js'

export default function AccessoryChecklist() {
  const template = () => getActiveTemplate()
  const exercises = () => template()?.exercises || []
  const completedCount = () => getCompletedAccessoryCount()
  const allDone = () => exercises().length > 0 && completedCount() >= exercises().length

  const handleToggle = (index) => {
    haptic()
    toggleAccessory(index)
  }

  const handleReset = () => {
    haptic()
    resetAccessories()
  }

  return (
    <Show when={template() && exercises().length > 0}>
      <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
        <div class="px-4 py-3 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{template().name}</h3>
            <span class="text-xs text-text-dim">{completedCount()}/{exercises().length}</span>
          </div>
        </div>

        <div class="divide-y divide-border">
          <For each={exercises()}>
            {(exercise, index) => {
              const isComplete = () => isAccessoryComplete(index())
              return (
                <button
                  class="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-bg-hover"
                  onClick={() => handleToggle(index())}
                >
                  <div class={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isComplete() ? 'bg-text border-text' : 'border-border-hover'
                  }`}>
                    <Show when={isComplete()}>
                      <svg class="w-3 h-3 text-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </Show>
                  </div>
                  <span class={isComplete() ? 'text-text-dim line-through' : ''}>{exercise}</span>
                </button>
              )
            }}
          </For>
        </div>

        <Show when={allDone()}>
          <div class="px-4 py-3 border-t border-border">
            <button
              class="w-full py-2 text-sm text-text-muted hover:text-text"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </Show>
      </div>
    </Show>
  )
}
