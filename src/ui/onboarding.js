/**
 * Onboarding flow UI
 */

import { completeOnboarding, getState, updateSettings } from '../app.js'

/**
 * Render onboarding view
 * @param {HTMLElement} container - Container element
 */
export function renderOnboarding(container) {
  const state = getState()
  const unit = state.settings.unit

  container.innerHTML = `
    <div class="min-h-screen flex flex-col px-4 py-8">
      <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 class="text-3xl font-bold text-center mb-2">531</h1>
        <p class="text-text-dim text-center mb-6">Enter your 1RM for each lift</p>

        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-bg-card border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              class="unit-toggle px-6 py-2 text-sm font-medium ${unit === 'lbs' ? 'bg-border text-text' : 'text-text-dim'}"
              data-unit="lbs"
            >
              lbs
            </button>
            <button
              type="button"
              class="unit-toggle px-6 py-2 text-sm font-medium ${unit === 'kg' ? 'bg-border text-text' : 'text-text-dim'}"
              data-unit="kg"
            >
              kg
            </button>
          </div>
        </div>

        <form id="onboarding-form" class="space-y-6">
          <div>
            <label class="block text-sm text-text-muted mb-2" for="squat">Squat</label>
            <div class="relative">
              <input
                type="number"
                id="squat"
                name="squat"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">${unit}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="bench">Bench Press</label>
            <div class="relative">
              <input
                type="number"
                id="bench"
                name="bench"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">${unit}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="deadlift">Deadlift</label>
            <div class="relative">
              <input
                type="number"
                id="deadlift"
                name="deadlift"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">${unit}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="ohp">Overhead Press</label>
            <div class="relative">
              <input
                type="number"
                id="ohp"
                name="ohp"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">${unit}</span>
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-text text-bg font-semibold py-3 rounded-lg hover:opacity-90 active:opacity-80"
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  `

  // Attach form submit handler
  const form = container.querySelector('#onboarding-form')
  form.addEventListener('submit', handleOnboardingSubmit)

  // Attach unit toggle handlers
  container.querySelectorAll('.unit-toggle').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newUnit = btn.dataset.unit
      await updateSettings({ unit: newUnit })
    })
  })
}

/**
 * Handle onboarding form submission
 * @param {Event} e - Submit event
 */
async function handleOnboardingSubmit(e) {
  e.preventDefault()

  const form = e.target
  const lifts = {
    squat: parseFloat(form.squat.value) || 0,
    bench: parseFloat(form.bench.value) || 0,
    deadlift: parseFloat(form.deadlift.value) || 0,
    ohp: parseFloat(form.ohp.value) || 0
  }

  await completeOnboarding(lifts)
}
