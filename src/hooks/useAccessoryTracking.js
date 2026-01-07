/**
 * Accessory Tracking Hook - Session-only tracking (not persisted)
 */

import { createSignal } from 'solid-js'

const [completedAccessories, setCompletedAccessories] = createSignal(new Set())

/**
 * Check if an accessory is completed
 */
export function isAccessoryComplete(exerciseIndex) {
  return completedAccessories().has(exerciseIndex)
}

/**
 * Toggle an accessory completion
 */
export function toggleAccessory(exerciseIndex) {
  setCompletedAccessories(prev => {
    const next = new Set(prev)
    if (next.has(exerciseIndex)) {
      next.delete(exerciseIndex)
    } else {
      next.add(exerciseIndex)
    }
    return next
  })
}

/**
 * Get count of completed accessories
 */
export function getCompletedAccessoryCount() {
  return completedAccessories().size
}

/**
 * Reset all completed accessories
 */
export function resetAccessories() {
  setCompletedAccessories(new Set())
}
