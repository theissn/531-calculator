/**
 * Accessory Tracking Hook - Persisted to currentWorkout for crash recovery
 * Keys are "liftId-exerciseIndex-setIndex" strings
 */

import { createSignal } from 'solid-js'
import { state, getCurrentWorkout, persistCurrentWorkout, startWorkout } from '../store.js'

const [completedAccessories, setCompletedAccessories] = createSignal(new Set())

const [accessoryWeights, setAccessoryWeights] = createSignal({})

/**
 * Initialize from saved workout state (call on app load/resume)
 */
export function initAccessoriesFromWorkout(currentWorkout) {
  if (currentWorkout?.accessories) {
    // Handle legacy array format (just completed keys)
    if (Array.isArray(currentWorkout.accessories)) {
      setCompletedAccessories(new Set(currentWorkout.accessories))
      setAccessoryWeights({})
    }
    // Handle new object format { completed: [], weights: {} }
    else if (currentWorkout.accessories.completed) {
      setCompletedAccessories(new Set(currentWorkout.accessories.completed))
      setAccessoryWeights(currentWorkout.accessories.weights || {})
    }
  }
}

/**
 * Check if an accessory is completed by key
 */
export function isAccessoryComplete(key) {
  return completedAccessories().has(key)
}

/**
 * Get weight for an accessory by key (exerciseIndex)
 */
export function getAccessoryWeight(key) {
  return accessoryWeights()[key] || ''
}

/**
 * Update weight for an accessory (persists to IndexedDB)
 */
export async function updateAccessoryWeight(key, weight, liftId) {
  setAccessoryWeights(prev => ({ ...prev, [key]: weight }))
  await persistAccessories(liftId)
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

  await persistAccessories(liftId)
}

/**
 * Helper to persist current state to store
 */
async function persistAccessories(liftId) {
  // Ensure workout exists
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    accessories: {
      completed: Array.from(completedAccessories()),
      weights: accessoryWeights()
    }
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
 * Get all accessory weights
 */
export function getAllAccessoryWeights() {
  return accessoryWeights()
}

/**
 * Reset all completed accessories
 */
export function resetAccessories() {
  setCompletedAccessories(new Set())
  setAccessoryWeights({})
}

/**
 * Check if there are any completed accessories
 */
export function hasAccessoryProgress() {
  return completedAccessories().size > 0
}
