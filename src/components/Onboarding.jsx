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
        <h1 class="text-3xl font-bold font-mono text-center mb-2 tracking-tighter uppercase">SYSTEM: 5/3/1</h1>
        <p class="text-text-dim text-center mb-8 font-mono text-xs uppercase tracking-widest">Initialize Training Max</p>

        <div class="flex justify-center mb-8">
          <div class="inline-flex bg-bg-card border border-border rounded-none p-px">
            <button
              type="button"
              class={`px-6 py-2 text-sm font-bold font-mono uppercase rounded-none transition-colors ${unit() === 'lbs' ? 'bg-text text-bg' : 'text-text-dim hover:text-text'}`}
              onClick={() => handleUnitChange('lbs')}
            >
              LBS
            </button>
            <button
              type="button"
              class={`px-6 py-2 text-sm font-bold font-mono uppercase rounded-none transition-colors ${unit() === 'kg' ? 'bg-text text-bg' : 'text-text-dim hover:text-text'}`}
              onClick={() => handleUnitChange('kg')}
            >
              KG
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label class="block text-[10px] font-bold text-text-muted mb-1.5 font-mono uppercase" for="squat">Squat</label>
            <div class="relative group">
              <input
                type="number"
                id="squat"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-none px-4 py-2 text-base font-bold font-mono placeholder-text-dim/50 focus:outline-none focus:border-text transition-colors"
                value={squat()}
                onInput={(e) => setSquat(e.target.value)}
                required
                autofocus
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-dim uppercase">{unit()}</span>
              <div class="absolute inset-0 border border-transparent group-hover:border-text/10 pointer-events-none transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-text-muted mb-1.5 font-mono uppercase" for="bench">Bench Press</label>
            <div class="relative group">
              <input
                type="number"
                id="bench"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-none px-4 py-2 text-base font-bold font-mono placeholder-text-dim/50 focus:outline-none focus:border-text transition-colors"
                value={bench()}
                onInput={(e) => setBench(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-dim uppercase">{unit()}</span>
              <div class="absolute inset-0 border border-transparent group-hover:border-text/10 pointer-events-none transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-text-muted mb-1.5 font-mono uppercase" for="deadlift">Deadlift</label>
            <div class="relative group">
              <input
                type="number"
                id="deadlift"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-none px-4 py-2 text-base font-bold font-mono placeholder-text-dim/50 focus:outline-none focus:border-text transition-colors"
                value={deadlift()}
                onInput={(e) => setDeadlift(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-dim uppercase">{unit()}</span>
              <div class="absolute inset-0 border border-transparent group-hover:border-text/10 pointer-events-none transition-colors" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] font-bold text-text-muted mb-1.5 font-mono uppercase" for="ohp">Overhead Press</label>
            <div class="relative group">
              <input
                type="number"
                id="ohp"
                step="any"
                inputmode="decimal"
                placeholder="0"
                class="w-full bg-bg-card border border-border rounded-none px-4 py-2 text-base font-bold font-mono placeholder-text-dim/50 focus:outline-none focus:border-text transition-colors"
                value={ohp()}
                onInput={(e) => setOhp(e.target.value)}
                required
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-text-dim uppercase">{unit()}</span>
              <div class="absolute inset-0 border border-transparent group-hover:border-white/10 pointer-events-none transition-colors" />
            </div>
          </div>

          <button
            type="submit"
            class="w-full bg-text text-bg font-bold font-mono uppercase tracking-wider py-3 rounded-none hover:bg-white transition-colors border border-transparent mt-6"
          >
            Initialize System
          </button>
        </form>
      </div>
    </div>
  )
}
