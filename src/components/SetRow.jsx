/**
 * SetRow Component - Display a single set with optional completion tracking
 */

import { Show, For } from 'solid-js'
import { state, setAmrapModal } from '../store.js'
import { estimateReps } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'

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

export default function SetRow(props) {
  const textColor = () => {
    if (props.isWarmup) return 'text-text-dim'
    if (props.isComplete?.()) return 'text-text-dim line-through'
    return 'text-text'
  }

  const openAmrapModal = () => {
    // Extract min reps from "5+" format
    const minReps = parseInt(props.set.reps, 10)
    setAmrapModal({
      liftId: props.liftId,
      weight: props.set.weight,
      week: state.currentWeek,
      minReps,
      setIndex: props.setIndex
    })
  }

  const handleToggle = () => {
    haptic()
    // For AMRAP sets, open the modal instead of just toggling
    if (props.set.isAmrap && props.liftId) {
      openAmrapModal()
    } else {
      props.onToggle?.()
    }
  }

  const handleAmrapClick = () => {
    haptic()
    openAmrapModal()
  }

  const platesDisplay = () => formatPlates(props.plates)
  const topSetLabel = () => {
    if (!props.showTopSetBadge || !props.isTopSet) return null
    return props.set.isAmrap ? 'Top Set · AMRAP' : 'Top Set'
  }
  const isAmrapHighlight = () => props.showTopSetBadge && props.set.isAmrap
  const weightClass = () => `flex-1 flex items-center gap-2 ${props.showTopSetBadge && props.isTopSet ? 'font-semibold' : 'font-medium'}`
  const amrapClass = () => `text-right${isAmrapHighlight() ? ' font-semibold' : ''}`

  // Expected reps for AMRAP sets based on user's 1RM
  const expectedReps = () => {
    if (!props.set.isAmrap || !props.liftId) return null
    const oneRepMax = state.lifts[props.liftId]?.oneRepMax
    if (!oneRepMax) return null
    return estimateReps(props.set.weight, oneRepMax)
  }
  const nextJump = () => {
    if (!props.showNextJump || props.nextWeight == null) return null
    const diff = Math.round((props.nextWeight - props.set.weight) * 100) / 100
    if (diff === 0) return null
    const sign = diff > 0 ? '+' : '-'
    const value = formatWeight(Math.abs(diff))
    return `Next ${sign}${value} ${props.unit}`
  }

  return (
    <div class="py-1">
      <div class={`flex items-center justify-between ${textColor()}`}>
        <Show when={props.onToggle} fallback={
          <span class="w-16 text-sm text-text-dim">{props.set.percentage}%</span>
        }>
          <button
            class="w-16 flex items-center gap-2 text-sm text-text-dim hover:text-text"
            onClick={handleToggle}
          >
            <div class={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              props.isComplete?.() ? 'bg-text border-text' : 'border-border-hover'
            }`}>
              <Show when={props.isComplete?.()}>
                <svg class="w-3 h-3 text-bg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Show>
            </div>
            <span>{props.set.percentage}%</span>
          </button>
        </Show>
        <div class={weightClass()}>
          <span>{props.set.weight} {props.unit}</span>
          <Show when={topSetLabel()}>
            <span class="text-[10px] uppercase tracking-wider text-text-dim border border-border rounded px-1.5 py-0.5">
              {topSetLabel()}
            </span>
          </Show>
        </div>
        <Show when={props.set.isAmrap && props.liftId} fallback={
          <span class="w-12 text-right">×{props.set.reps}</span>
        }>
          <button
            class={`${amrapClass()} hover:text-text flex items-center gap-1.5`}
            onClick={handleAmrapClick}
          >
            <span>×{props.set.reps}</span>
            <Show when={expectedReps()}>
              <span class="text-text-dim text-sm">(~{expectedReps()})</span>
            </Show>
          </button>
        </Show>
      </div>
      <Show when={nextJump()}>
        <div class="text-xs text-text-dim ml-16 mt-0.5">{nextJump()}</div>
      </Show>
      <Show when={platesDisplay()}>
        <div class="text-xs text-text-dim ml-16 mt-0.5">{platesDisplay()}</div>
      </Show>
    </div>
  )
}
