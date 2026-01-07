/**
 * Accessory Tracking Hook - Session-only tracking (not persisted)
 * Keys are "liftId-exerciseIndex" strings
 */

import { createSignal } from 'solid-js'

const [completedAccessories, setCompletedAccessories] = createSignal(new Set())

/**
 * Check if an accessory is completed by key
 */
export function isAccessoryComplete(key) {
  return completedAccessories().has(key)
}

/**
 * Toggle an accessory completion by key
 */
export function toggleAccessory(key) {
  setCompletedAccessories(prev => {
    const next = new Set(prev)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
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
