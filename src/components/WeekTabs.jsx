/**
 * WeekTabs Component - Week navigation tabs
 */

import { For } from 'solid-js'
import { state, setCurrentWeek } from '../store.js'
import { stopTimer } from '../hooks/useTimer.js'

const weeks = [1, 2, 3, 4]
const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Deload']

export default function WeekTabs() {
  const handleWeekClick = (week) => {
    stopTimer()
    setCurrentWeek(week)
  }

  return (
    <nav class="sticky top-14 z-10 bg-bg border-b border-border overflow-x-auto no-scrollbar">
      <div class="flex">
        <For each={weeks}>
          {(week, index) => (
            <button
              class={`flex-1 py-3 text-sm font-bold font-mono text-center border-r border-border last:border-r-0 uppercase tracking-tight transition-colors rounded-none ${week === state.currentWeek
                ? 'bg-text text-bg'
                : 'text-text-muted hover:text-text hover:bg-bg-hover'
                }`}
              onClick={() => handleWeekClick(week)}
            >
              {weekLabels[index()]}
            </button>
          )}
        </For>
      </div>
    </nav>
  )
}
