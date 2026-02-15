/**
 * LiftSelector Component - Filter lifts to display
 */

import { For } from 'solid-js'
import { state, setCurrentLift, LIFT_NAMES } from '../store.js'
import { haptic } from '../hooks/useMobile.js'

const LIFT_OPTIONS = [
  { id: 'squat', name: 'S' },
  { id: 'bench', name: 'B' },
  { id: 'deadlift', name: 'D' },
  { id: 'ohp', name: 'O' }
]

export default function LiftSelector() {
  const currentLift = () => state.currentLift || 'squat'

  const handleSelect = (liftId) => {
    haptic()
    setCurrentLift(liftId)
  }

  return (
    <div class="flex border-b border-border bg-bg overflow-x-auto no-scrollbar">
      <For each={LIFT_OPTIONS}>
        {(option) => (
          <button
            class={`flex-1 px-3 py-3 text-sm font-bold uppercase tracking-wider font-mono border-r border-border last:border-r-0 transition-colors whitespace-nowrap rounded-none ${currentLift() === option.id
              ? 'bg-text text-bg'
              : 'text-text-muted hover:text-text hover:bg-bg-hover'
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
