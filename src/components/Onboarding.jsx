/**
 * Onboarding Component - First-run 1RM entry form
 */

import { createSignal } from 'solid-js'
import { state, completeOnboarding, updateSettings } from '../store.js'

export default function Onboarding() {
  const [squat, setSquat] = createSignal('')
  const [bench, setBench] = createSignal('')
  const [deadlift, setDeadlift] = createSignal('')
  const [ohp, setOhp] = createSignal('')

  const unit = () => state.settings?.unit || 'lbs'

  const handleUnitChange = async (newUnit) => {
    await updateSettings({ unit: newUnit })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await completeOnboarding({
      squat: parseFloat(squat()) || 0,
      bench: parseFloat(bench()) || 0,
      deadlift: parseFloat(deadlift()) || 0,
      ohp: parseFloat(ohp()) || 0
    })
  }

  return (
    <div class="min-h-screen flex flex-col px-4 py-8">
      <div class="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 class="text-3xl font-bold text-center mb-2">531</h1>
        <p class="text-text-dim text-center mb-6">Enter your 1RM for each lift</p>

        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-bg-card border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              class={`px-6 py-2 text-sm font-medium ${unit() === 'lbs' ? 'bg-border text-text' : 'text-text-dim'}`}
              onClick={() => handleUnitChange('lbs')}
            >
              lbs
            </button>
            <button
              type="button"
              class={`px-6 py-2 text-sm font-medium ${unit() === 'kg' ? 'bg-border text-text' : 'text-text-dim'}`}
              onClick={() => handleUnitChange('kg')}
            >
              kg
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label class="block text-sm text-text-muted mb-2" for="squat">Squat</label>
            <div class="relative">
              <input
                type="number"
                id="squat"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                value={squat()}
                onInput={(e) => setSquat(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">{unit()}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="bench">Bench Press</label>
            <div class="relative">
              <input
                type="number"
                id="bench"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                value={bench()}
                onInput={(e) => setBench(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">{unit()}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="deadlift">Deadlift</label>
            <div class="relative">
              <input
                type="number"
                id="deadlift"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                value={deadlift()}
                onInput={(e) => setDeadlift(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">{unit()}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm text-text-muted mb-2" for="ohp">Overhead Press</label>
            <div class="relative">
              <input
                type="number"
                id="ohp"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-lg font-medium placeholder-text-dim focus:outline-none focus:border-border-hover"
                value={ohp()}
                onInput={(e) => setOhp(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-text-dim">{unit()}</span>
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
  )
}
