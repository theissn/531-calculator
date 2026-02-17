/**
 * SetRow Component - Display a single set with optional completion tracking
 */

import { Show, For } from 'solid-js'
import { state, setAmrapModal } from '../store.js'
import { estimateReps } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'
import { startTimer } from '../hooks/useTimer.js'

/**
 * Format plates array for display
 * e.g., [{weight: 45, count: 2}, {weight: 10, count: 1}] -> "45 45 10"
 */
function formatPlates(platesData) {
  if (!platesData?.plates?.length) return null

  const parts = []
  for (const { weight, count } of platesData.plates) {
    for (let i = 0; i < count; i++) {
      // Format: remove unnecessary decimals (45.0 -> 45, 2.5 -> 2.5)
      parts.push(weight % 1 === 0 ? weight.toString() : weight.toFixed(1))
    }
  }
  return parts.join(' + ')
}

function formatWeight(value) {
  if (value === null || value === undefined) return null
  return value % 1 === 0 ? value.toString() : value.toFixed(1)
}

function BarbellVisualizer(props) {
  if (!props.plates?.plates?.length) return null

  // Flat array of all plates per side
  const allPlates = []
  props.plates.plates.forEach(p => {
    for (let i = 0; i < p.count; i++) allPlates.push(p.weight)
  })

  const getPlateColor = (weight) => {
    // Standard competition colors (or similar)
    if (weight >= 45 || weight >= 20) return 'bg-red-500'    // 45lb / 20kg
    if (weight >= 35 || weight >= 15) return 'bg-blue-500'   // 35lb / 15kg
    if (weight >= 25 || weight >= 10) return 'bg-yellow-500' // 25lb / 10kg
    if (weight >= 10 || weight >= 5) return 'bg-white'       // 10lb / 5kg
    if (weight >= 5 || weight >= 2.5) return 'bg-blue-400'    // 5lb / 2.5kg
    return 'bg-gray-400' // Microplates
  }

  const getPlateHeight = (weight) => {
    if (weight >= 45 || weight >= 20) return 'h-6'
    if (weight >= 25 || weight >= 10) return 'h-5'
    if (weight >= 10 || weight >= 5) return 'h-4'
    return 'h-3'
  }

  return (
    <div class="flex items-center gap-0.5 mt-1 h-6">
      {/* Barbell Sleeve */}
      <div class="w-2 h-1 bg-text-dim/30 rounded-l-sm" />
      <For each={allPlates}>
        {(weight) => (
          <div 
            class={`w-1.5 ${getPlateHeight(weight)} ${getPlateColor(weight)} border-x border-black/20 shadow-sm`}
            title={`${weight} ${props.unit}`}
          />
        )}
      </For>
      <div class="flex-1 h-px bg-text-dim/20 ml-1" />
    </div>
  )
}

export default function SetRow(props) {
  const isComplete = () => props.isComplete?.()

  const textColor = () => {
    if (props.isWarmup) return 'text-text-dim'
    if (isComplete()) return 'text-text-muted transition-colors duration-300'
    return 'text-text transition-colors duration-300'
  }

  const handleToggle = () => {
    haptic()
    const willBeComplete = !isComplete()
    
    if (props.set.isAmrap && props.liftId) {
      setAmrapModal({
        liftId: props.liftId,
        weight: props.set.weight,
        week: state.currentWeek,
        minReps: parseInt(props.set.reps, 10),
        setIndex: props.setIndex
      })
    } else {
      props.onToggle?.()
      if (willBeComplete) {
        startTimer()
      }
    }
  }

  const platesDisplay = () => formatPlates(props.plates)

  return (
    <div class={`group flex flex-col py-1.5 px-3 border border-border transition-colors ${isComplete() ? 'bg-bg-hover border-primary/20 bg-hazard-stripe' : 'bg-bg hover:bg-bg-hover'
      }`}>
      <div class={`flex items-center gap-4 ${textColor()}`}>
        {/* Industrial Checkbox */}
        <button
          class="flex items-center gap-3 shrink-0"
          onClick={handleToggle}
          disabled={!props.onToggle}
        >
          <div class={`w-5 h-5 border-2 flex items-center justify-center transition-all duration-0 ${isComplete()
            ? 'bg-primary border-primary'
            : 'border-text-dim group-hover:border-primary'
            }`}>
            <Show when={isComplete()}>
              <svg class="w-4 h-4 text-primary-content" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="square" stroke-linejoin="miter">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </Show>
          </div>
          <span class="text-xs font-mono font-bold tabular-nums opacity-60 w-12 text-left">{props.set.percentage}%</span>
        </button>

        {/* Weight & Reps - Monospace Data */}
        <div class="flex-1 flex items-baseline justify-between">
          <div class="flex flex-col">
            <span class={`text-base font-mono font-bold tracking-tight ${isComplete() ? 'text-text-muted' : 'text-text'
              }`}>
              {props.set.weight} <span class="text-xs font-bold text-text-dim">{props.unit}</span>
            </span>
            <Show when={props.plates}>
              <BarbellVisualizer plates={props.plates} unit={props.unit} />
              <span class="text-[9px] font-mono text-text-dim opacity-50 hidden group-hover:block">
                {platesDisplay()}
              </span>
            </Show>
          </div>

          <div class="flex flex-col items-end">
            <button
              class={`text-base font-mono font-bold tabular-nums flex items-center gap-1 ${props.set.isAmrap ? 'text-primary underline decoration-2 underline-offset-4' : ''
                }`}
              onClick={handleToggle}
            >
              {props.set.reps.toString().replace('+', '')}
              {props.set.isAmrap && <span class="text-xs font-bold no-underline">+</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
