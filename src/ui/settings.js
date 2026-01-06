/**
 * Settings panel UI
 */

import { getState, updateSettings, updateLift, updateLiftSettings, reset, TEMPLATES } from '../app.js'

const LIFT_LABELS = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press'
}

let isOpen = false

/**
 * Initialize settings panel
 * @param {HTMLElement} container - App container
 */
export function initSettingsPanel(container) {
  // Create settings container
  const settingsContainer = document.createElement('div')
  settingsContainer.id = 'settings-panel'
  settingsContainer.className = 'fixed inset-0 z-50 hidden'
  document.body.appendChild(settingsContainer)

  // Listen for open event
  window.addEventListener('open-settings', () => openSettings())
}

/**
 * Open settings panel
 */
function openSettings() {
  const panel = document.getElementById('settings-panel')
  panel.classList.remove('hidden')
  isOpen = true
  renderSettingsPanel()
}

/**
 * Close settings panel
 */
function closeSettings() {
  const panel = document.getElementById('settings-panel')
  panel.classList.add('hidden')
  isOpen = false
}

/**
 * Render settings panel content
 */
function renderSettingsPanel() {
  const panel = document.getElementById('settings-panel')
  const state = getState()
  const { settings, lifts } = state

  panel.innerHTML = `
    <div class="absolute inset-0 bg-black/50" id="settings-backdrop"></div>
    <div class="absolute inset-y-0 right-0 w-full max-w-md bg-bg border-l border-border overflow-y-auto">
      <div class="sticky top-0 z-10 bg-bg border-b border-border">
        <div class="flex items-center justify-between px-4 h-14">
          <h2 class="text-lg font-semibold">Settings</h2>
          <button id="close-settings" class="p-2 -mr-2 text-text-muted hover:text-text">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="p-4 space-y-8">
        <!-- Lifts Section - 1RM + Template per lift -->
        <section>
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Lifts</h3>
          <div class="space-y-4">
            ${['squat', 'bench', 'deadlift', 'ohp'].map(liftId =>
              renderLiftCard(liftId, lifts[liftId], settings.unit)
            ).join('')}
          </div>
        </section>

        <!-- Training Max Section -->
        <section>
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Training Max</h3>
          <div class="bg-bg-card border border-border rounded-lg p-4">
            <label class="flex items-center justify-between">
              <span>TM Percentage</span>
              <div class="flex items-center gap-2">
                <input
                  type="range"
                  id="tm-percentage"
                  min="80"
                  max="95"
                  step="5"
                  value="${settings.tmPercentage}"
                  class="w-24 accent-current"
                />
                <span id="tm-value" class="w-12 text-right font-medium">${settings.tmPercentage}%</span>
              </div>
            </label>
          </div>
        </section>

        <!-- Units Section -->
        <section>
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Units</h3>
          <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
            <div class="flex border-b border-border">
              <button class="flex-1 py-3 text-center unit-btn ${settings.unit === 'lbs' ? 'bg-bg-hover font-medium' : 'text-text-dim'}" data-unit="lbs">
                lbs
              </button>
              <button class="flex-1 py-3 text-center unit-btn ${settings.unit === 'kg' ? 'bg-bg-hover font-medium' : 'text-text-dim'}" data-unit="kg">
                kg
              </button>
            </div>
            <div class="p-4">
              <label class="flex items-center justify-between">
                <span class="text-sm">Rounding increment</span>
                <select id="rounding-increment" class="bg-bg border border-border rounded px-3 py-1.5 text-sm">
                  <option value="5" ${settings.roundingIncrement === 5 ? 'selected' : ''}>5</option>
                  <option value="2.5" ${settings.roundingIncrement === 2.5 ? 'selected' : ''}>2.5</option>
                  <option value="1" ${settings.roundingIncrement === 1 ? 'selected' : ''}>1</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <!-- Display Section -->
        <section>
          <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Display</h3>
          <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
            <!-- Theme Toggle -->
            <div class="p-4 border-b border-border">
              <label class="flex items-center justify-between">
                <span>Theme</span>
                <div class="flex bg-bg border border-border rounded overflow-hidden">
                  <button class="theme-btn px-3 py-1.5 text-sm ${settings.theme === 'system' ? 'bg-bg-hover font-medium' : 'text-text-dim'}" data-theme="system">
                    System
                  </button>
                  <button class="theme-btn px-3 py-1.5 text-sm ${settings.theme === 'dark' ? 'bg-bg-hover font-medium' : 'text-text-dim'}" data-theme="dark">
                    Dark
                  </button>
                  <button class="theme-btn px-3 py-1.5 text-sm ${settings.theme === 'light' ? 'bg-bg-hover font-medium' : 'text-text-dim'}" data-theme="light">
                    Light
                  </button>
                </div>
              </label>
            </div>
            <!-- Warmups Toggle -->
            <div class="p-4">
              <label class="flex items-center justify-between cursor-pointer">
                <span>Show warm-up sets</span>
                <input
                  type="checkbox"
                  id="show-warmups"
                  ${settings.showWarmups ? 'checked' : ''}
                  class="w-5 h-5 accent-current"
                />
              </label>
            </div>
          </div>
        </section>

        <!-- Reset Section -->
        <section class="pt-4 border-t border-border">
          <button id="reset-btn" class="w-full py-3 text-center text-red-500 hover:text-red-400">
            Reset All Data
          </button>
        </section>
      </div>
    </div>
  `

  attachSettingsListeners()
}

/**
 * Render a lift card with 1RM, template, and supplemental % settings
 */
function renderLiftCard(liftId, lift, unit) {
  const template = TEMPLATES[lift.template || 'classic']
  const showSupplPct = template && template.hasSupplemental &&
    !template.usesFirstSetPercentage && !template.usesSecondSetPercentage

  return `
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-border">
        <span class="font-medium">${LIFT_LABELS[liftId]}</span>
      </div>
      <div class="p-4 space-y-3">
        <!-- 1RM Input -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">1RM</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              step="any"
              inputmode="decimal"
              class="lift-input w-20 bg-bg border border-border rounded px-3 py-1.5 text-right font-medium focus:outline-none focus:border-border-hover"
              data-lift="${liftId}"
              value="${lift.oneRepMax || ''}"
            />
            <span class="text-text-dim w-8">${unit}</span>
          </div>
        </div>

        <!-- Template Select -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">Template</span>
          <select
            class="template-select bg-bg border border-border rounded px-3 py-1.5 text-sm"
            data-lift="${liftId}"
          >
            ${Object.values(TEMPLATES).map(t => `
              <option value="${t.id}" ${(lift.template || 'classic') === t.id ? 'selected' : ''}>
                ${t.name}
              </option>
            `).join('')}
          </select>
        </div>

        <!-- Supplemental Percentage (only for BBB) -->
        ${showSupplPct ? `
          <div class="flex items-center justify-between">
            <span class="text-sm text-text-muted">Suppl. %</span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                inputmode="decimal"
                class="suppl-input w-16 bg-bg border border-border rounded px-2 py-1.5 text-right text-sm focus:outline-none focus:border-border-hover"
                data-lift="${liftId}"
                value="${lift.supplementalPercentage || 50}"
                min="40"
                max="70"
              />
              <span class="text-text-dim text-sm">%</span>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `
}

/**
 * Attach all settings event listeners
 */
function attachSettingsListeners() {
  const panel = document.getElementById('settings-panel')

  // Close handlers
  panel.querySelector('#settings-backdrop').addEventListener('click', closeSettings)
  panel.querySelector('#close-settings').addEventListener('click', closeSettings)

  // TM percentage slider
  const tmSlider = panel.querySelector('#tm-percentage')
  const tmValue = panel.querySelector('#tm-value')
  tmSlider.addEventListener('input', (e) => {
    tmValue.textContent = `${e.target.value}%`
  })
  tmSlider.addEventListener('change', (e) => {
    updateSettings({ tmPercentage: parseInt(e.target.value, 10) })
  })

  // Unit buttons
  panel.querySelectorAll('.unit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const scrollContainer = panel.querySelector('.overflow-y-auto')
      const scrollTop = scrollContainer?.scrollTop || 0
      await updateSettings({ unit: btn.dataset.unit })
      renderSettingsPanel()
      const newScrollContainer = panel.querySelector('.overflow-y-auto')
      if (newScrollContainer) newScrollContainer.scrollTop = scrollTop
    })
  })

  // Rounding increment
  panel.querySelector('#rounding-increment').addEventListener('change', (e) => {
    updateSettings({ roundingIncrement: parseFloat(e.target.value) })
  })

  // Theme buttons
  panel.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const scrollContainer = panel.querySelector('.overflow-y-auto')
      const scrollTop = scrollContainer?.scrollTop || 0
      await updateSettings({ theme: btn.dataset.theme })
      renderSettingsPanel()
      const newScrollContainer = panel.querySelector('.overflow-y-auto')
      if (newScrollContainer) newScrollContainer.scrollTop = scrollTop
    })
  })

  // Warmups toggle
  panel.querySelector('#show-warmups').addEventListener('change', (e) => {
    updateSettings({ showWarmups: e.target.checked })
  })

  // Lift 1RM inputs
  panel.querySelectorAll('.lift-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const liftId = e.target.dataset.lift
      const value = parseFloat(e.target.value) || 0
      updateLift(liftId, value)
    })
  })

  // Template selects (per lift)
  panel.querySelectorAll('.template-select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const liftId = e.target.dataset.lift
      const scrollContainer = panel.querySelector('.overflow-y-auto')
      const scrollTop = scrollContainer?.scrollTop || 0
      await updateLiftSettings(liftId, { template: e.target.value })
      renderSettingsPanel() // Re-render to show/hide suppl % input
      // Restore scroll position
      const newScrollContainer = panel.querySelector('.overflow-y-auto')
      if (newScrollContainer) newScrollContainer.scrollTop = scrollTop
    })
  })

  // Supplemental percentage inputs (per lift)
  panel.querySelectorAll('.suppl-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const liftId = e.target.dataset.lift
      const value = parseInt(e.target.value, 10) || 50
      updateLiftSettings(liftId, { supplementalPercentage: value })
    })
  })

  // Reset button
  panel.querySelector('#reset-btn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await reset()
      closeSettings()
    }
  })
}
