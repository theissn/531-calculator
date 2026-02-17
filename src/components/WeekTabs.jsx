/**
 * WeekTabs Component - Week navigation tabs
 */

import { For } from 'solid-js'
import { state, setCurrentWeek, finishCycle } from '../store.js'
import { stopTimer, haptic } from '../hooks/useTimer.js'

const weeks = [1, 2, 3, 4]
const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Deload']

export default function WeekTabs() {
  const handleWeekClick = (week) => {
    stopTimer()
    setCurrentWeek(week)
  }

  const handleFinishCycle = async () => {
    if (confirm('Finish this cycle? This will increase your Training Maxes and reset to Week 1.')) {
      haptic()
      await finishCycle()
    }
  }

  return (
    <nav class="sticky top-14 z-10 bg-bg border-b border-border">
      <div class="flex overflow-x-auto no-scrollbar">
        <div class="flex flex-1">
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
        
        <Show when={state.currentWeek >= 3}>
          <button
            class="px-4 py-3 text-sm font-bold font-mono text-center bg-primary text-primary-foreground uppercase tracking-tight hover:opacity-90 transition-opacity rounded-none border-l border-border"
            onClick={handleFinishCycle}
          >
            Finish Cycle
          </button>
        </Show>
      </div>
    </nav>
  )
}
