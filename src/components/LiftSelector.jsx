/**
 * LiftSelector Component - Filter lifts to display
 */

import { For } from 'solid-js'
import { state, setCurrentLift, LIFT_NAMES } from '../store.js'
import { haptic } from '../hooks/useMobile.js'

const LIFT_OPTIONS = [
  { id: 'all', name: 'All' },
  { id: 'squat', name: 'Squat' },
  { id: 'bench', name: 'Bench' },
  { id: 'deadlift', name: 'Deadlift' },
  { id: 'ohp', name: 'OHP' }
]

export default function LiftSelector() {
  const currentLift = () => state.currentLift || 'all'

  const handleSelect = (liftId) => {
    haptic()
    setCurrentLift(liftId)
  }

  return (
    <div class="flex border-b border-border bg-bg overflow-x-auto">
      <For each={LIFT_OPTIONS}>
        {(option) => (
          <button
            class={`flex-1 min-w-0 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              currentLift() === option.id
                ? 'text-text border-b-2 border-text'
                : 'text-text-dim hover:text-text-muted'
            }`}
            onClick={() => handleSelect(option.id)}
          >
            {option.name}
          </button>
        )}
      </For>
    </div>
  )
}
