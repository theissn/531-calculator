/**
 * Completed Sets Hook - Session-only tracking (not persisted)
 */

import { createSignal } from 'solid-js'
import { state } from '../store.js'

const [completedSets, setCompletedSets] = createSignal({})

/**
 * Get completed count for a lift in current week
 */
export function getCompletedCount(liftId) {
  const key = `${liftId}-${state.currentWeek}`
  return completedSets()[key] || 0
}

/**
 * Mark a set as complete for a lift
 */
export function markSetComplete(liftId) {
  const key = `${liftId}-${state.currentWeek}`
  setCompletedSets(prev => ({
    ...prev,
    [key]: (prev[key] || 0) + 1
  }))
}

/**
 * Reset completed sets for a lift
 */
export function resetCompletedSets(liftId) {
  const key = `${liftId}-${state.currentWeek}`
  setCompletedSets(prev => ({
    ...prev,
    [key]: 0
  }))
}
