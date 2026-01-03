/**
 * Main UI rendering
 */

import { getState, getAllLiftsForWeek, setCurrentWeek, LIFT_NAMES } from '../app.js'
import { roundWeight } from '../calculator.js'
import { startTimer, stopTimer, formatTime, isTimerRunning, getTimerSeconds } from '../timer.js'

// Session state for tracking completed supplemental sets (not persisted)
const completedSets = {}

/**
 * Get completed sets count for a lift
 */
function getCompletedCount(liftId) {
  const state = getState()
  const key = `${liftId}-${state.currentWeek}`
  return completedSets[key] || 0
}

/**
 * Mark a set as complete for a lift
 */
function markSetComplete(liftId) {
  const state = getState()
  const key = `${liftId}-${state.currentWeek}`
  completedSets[key] = (completedSets[key] || 0) + 1

  // Start rest timer
  startTimer((seconds) => {
    updateTimerDisplay(seconds)
  })
}

/**
 * Reset completed sets for a lift
 */
function resetCompletedSets(liftId) {
  const state = getState()
  const key = `${liftId}-${state.currentWeek}`
  completedSets[key] = 0
  stopTimer()
}

/**
 * Update timer display without full re-render
 */
function updateTimerDisplay(seconds) {
  const timerEl = document.getElementById('rest-timer')
  if (timerEl) {
    timerEl.textContent = formatTime(seconds)
  }
}

/**
 * Render the main app view
 * @param {HTMLElement} container - Container element
 */
export function renderApp(container) {
  const state = getState()

  container.innerHTML = `
    <div class="flex flex-col min-h-screen">
      ${renderHeader()}
      ${renderWeekTabs(state.currentWeek)}
      <main class="flex-1 px-4 pb-8 pt-4">
        ${renderLifts(state.currentWeek)}
      </main>
    </div>
  `

  // Attach event listeners
  attachTabListeners(container)
  attachSettingsListener(container)
  attachSupplementalListeners(container)
}

/**
 * Render header
 */
function renderHeader() {
  return `
    <header class="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[#262626]">
      <div class="flex items-center justify-between px-4 h-14">
        <h1 class="text-xl font-bold tracking-tight">531</h1>
        <div class="flex items-center gap-3">
          ${isTimerRunning() ? `
            <button id="timer-btn" class="flex items-center gap-2 text-[#a3a3a3] hover:text-[#fafafa] px-2 py-1 -my-1 rounded hover:bg-[#1a1a1a]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span id="rest-timer" class="font-mono text-sm">${formatTime(getTimerSeconds())}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ` : ''}
          <button id="settings-btn" class="p-2 -mr-2 text-[#a3a3a3] hover:text-[#fafafa]" aria-label="Settings">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  `
}

/**
 * Render week tabs
 * @param {number} currentWeek - Current week number
 */
function renderWeekTabs(currentWeek) {
  const weeks = [1, 2, 3, 4]
  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Deload']

  return `
    <nav class="sticky top-14 z-10 bg-[#0a0a0a] border-b border-[#262626]">
      <div class="flex">
        ${weeks.map((week, index) => `
          <button
            class="flex-1 py-3 text-sm font-medium text-center week-tab ${
              week === currentWeek
                ? 'text-[#fafafa] border-b-2 border-[#fafafa]'
                : 'text-[#525252] hover:text-[#a3a3a3]'
            }"
            data-week="${week}"
          >
            ${weekLabels[index]}
          </button>
        `).join('')}
      </div>
    </nav>
  `
}

/**
 * Render all lifts for a week
 * @param {number} week - Week number
 */
function renderLifts(week) {
  const liftsData = getAllLiftsForWeek(week)
  const state = getState()
  const isDeload = week === 4

  return `
    <div class="space-y-6">
      ${liftsData.map(lift => renderLiftCard(lift, state.settings.unit, isDeload)).join('')}
    </div>
  `
}

/**
 * Render a single lift card
 * @param {Object} liftData - Lift data object
 * @param {string} unit - Weight unit
 * @param {boolean} isDeload - Whether this is deload week
 */
function renderLiftCard(liftData, unit, isDeload) {
  const { liftId, trainingMax, mainSets, supplemental } = liftData
  const displayTM = roundWeight(trainingMax, 1)

  const warmupSets = isDeload ? [] : mainSets.filter(s => s.type === 'warmup')
  const workSets = mainSets.filter(s => s.type === 'work')

  return `
    <div class="bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-[#262626]">
        <div class="flex items-baseline justify-between">
          <h2 class="text-lg font-semibold">${LIFT_NAMES[liftId]}</h2>
          <span class="text-sm text-[#525252]">TM: ${displayTM} ${unit}</span>
        </div>
      </div>

      <div class="px-4 py-3">
        ${warmupSets.length > 0 ? `
          <div class="mb-4">
            <div class="text-xs text-[#525252] uppercase tracking-wider mb-2">Warm-up</div>
            <div class="space-y-1">
              ${warmupSets.map(set => renderSet(set, unit, true)).join('')}
            </div>
          </div>
        ` : ''}

        <div class="space-y-1">
          ${workSets.map(set => renderSet(set, unit, false)).join('')}
        </div>

        ${supplemental && !isDeload ? renderSupplementalSection(liftId, supplemental, unit) : ''}
      </div>
    </div>
  `
}

/**
 * Render supplemental section with individual sets
 */
function renderSupplementalSection(liftId, supplemental, unit) {
  const completedCount = getCompletedCount(liftId)
  const totalSets = supplemental.sets
  const allDone = completedCount >= totalSets

  return `
    <div class="mt-4 pt-3 border-t border-[#262626]">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-[#a3a3a3]">${supplemental.templateName}</span>
        <span class="text-xs text-[#525252]">${completedCount}/${totalSets} sets</span>
      </div>

      <div class="flex items-center justify-between mb-3">
        <span class="font-medium">${supplemental.reps} reps @ ${supplemental.weight} ${unit}</span>
      </div>

      <div class="flex gap-2">
        ${Array.from({ length: totalSets }, (_, i) => {
          const isDone = i < completedCount
          return `
            <button
              class="set-indicator flex-1 h-2 rounded-full ${isDone ? 'bg-[#fafafa]' : 'bg-[#262626]'}"
              data-lift="${liftId}"
              data-set="${i}"
              ${isDone ? 'disabled' : ''}
            ></button>
          `
        }).join('')}
      </div>

      <div class="flex gap-2 mt-3">
        ${!allDone ? `
          <button
            class="set-done-btn flex-1 py-2 px-4 bg-[#262626] hover:bg-[#333] text-sm font-medium rounded-lg flex items-center justify-center gap-2"
            data-lift="${liftId}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Set Done
          </button>
        ` : `
          <button
            class="set-reset-btn flex-1 py-2 px-4 bg-[#1a1a1a] text-[#525252] hover:text-[#a3a3a3] text-sm font-medium rounded-lg"
            data-lift="${liftId}"
          >
            Reset
          </button>
        `}
      </div>
    </div>
  `
}

/**
 * Render a single set
 * @param {Object} set - Set object
 * @param {string} unit - Weight unit
 * @param {boolean} isWarmup - Whether this is a warmup set
 */
function renderSet(set, unit, isWarmup) {
  const textColor = isWarmup ? 'text-[#525252]' : 'text-[#fafafa]'
  const repDisplay = set.isAmrap
    ? `<span class="text-[#a3a3a3]">${set.reps}</span>`
    : set.reps

  return `
    <div class="flex items-center justify-between py-1 ${textColor}">
      <span class="w-16 text-sm text-[#525252]">${set.percentage}%</span>
      <span class="flex-1 font-medium">${set.weight} ${unit}</span>
      <span class="w-12 text-right">×${repDisplay}</span>
    </div>
  `
}

/**
 * Attach tab click listeners
 * @param {HTMLElement} container - Container element
 */
function attachTabListeners(container) {
  const tabs = container.querySelectorAll('.week-tab')
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const week = parseInt(tab.dataset.week, 10)
      stopTimer()
      setCurrentWeek(week)
    })
  })
}

/**
 * Attach settings button listener
 * @param {HTMLElement} container - Container element
 */
function attachSettingsListener(container) {
  const btn = container.querySelector('#settings-btn')
  if (btn) {
    btn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-settings'))
    })
  }

  // Timer dismiss button
  const timerBtn = container.querySelector('#timer-btn')
  if (timerBtn) {
    timerBtn.addEventListener('click', () => {
      stopTimer()
      renderApp(document.getElementById('app'))
    })
  }
}

/**
 * Attach supplemental set listeners
 * @param {HTMLElement} container - Container element
 */
function attachSupplementalListeners(container) {
  // Set done buttons
  container.querySelectorAll('.set-done-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const liftId = btn.dataset.lift
      markSetComplete(liftId)
      // Re-render to update UI
      renderApp(document.getElementById('app'))
    })
  })

  // Reset buttons
  container.querySelectorAll('.set-reset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const liftId = btn.dataset.lift
      resetCompletedSets(liftId)
      renderApp(document.getElementById('app'))
    })
  })
}
