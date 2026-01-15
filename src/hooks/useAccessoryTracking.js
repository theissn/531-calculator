/**
 * Accessory Tracking Hook - Persisted to currentWorkout for crash recovery
 * Keys are "liftId-exerciseIndex-setIndex" strings
 */

import { createSignal } from 'solid-js'
import { state, getCurrentWorkout, persistCurrentWorkout, startWorkout } from '../store.js'

const [completedAccessories, setCompletedAccessories] = createSignal(new Set())

/**
 * Initialize from saved workout state (call on app load/resume)
 */
export function initAccessoriesFromWorkout(currentWorkout) {
  if (!currentWorkout?.accessories) return
  setCompletedAccessories(new Set(currentWorkout.accessories))
}

/**
 * Check if an accessory is completed by key
 */
export function isAccessoryComplete(key) {
  return completedAccessories().has(key)
}

/**
 * Toggle an accessory completion by key (persists to IndexedDB)
 */
export async function toggleAccessory(key, liftId) {
  let newSet
  setCompletedAccessories(prev => {
    newSet = new Set(prev)
    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    return newSet
  })

  // Ensure workout exists and persist
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    accessories: Array.from(newSet)
  })
}

/**
 * Get count of completed accessories
 */
export function getCompletedAccessoryCount() {
  return completedAccessories().size
}

/**
 * Get all completed accessory keys
 */
export function getCompletedAccessories() {
  return Array.from(completedAccessories())
}

/**
 * Reset all completed accessories
 */
export function resetAccessories() {
  setCompletedAccessories(new Set())
}

/**
 * Check if there are any completed accessories
 */
export function hasAccessoryProgress() {
  return completedAccessories().size > 0
}
