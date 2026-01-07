/**
 * Completed Sets Hook - Session-only tracking (not persisted)
 */

import { createSignal } from 'solid-js'
import { state } from '../store.js'

const [completedSets, setCompletedSets] = createSignal({})

/**
 * Get completed count for supplemental sets
 */
export function getCompletedCount(liftId) {
  const key = `sup-${liftId}-${state.currentWeek}`
  return completedSets()[key] || 0
}

/**
 * Mark a supplemental set as complete
 */
export function markSetComplete(liftId) {
  const key = `sup-${liftId}-${state.currentWeek}`
  setCompletedSets(prev => ({
    ...prev,
    [key]: (prev[key] || 0) + 1
  }))
}

/**
 * Reset supplemental completed sets for a lift
 */
export function resetCompletedSets(liftId) {
  const key = `sup-${liftId}-${state.currentWeek}`
  setCompletedSets(prev => ({
    ...prev,
    [key]: 0
  }))
}

/**
 * Check if a main work set is completed
 */
export function isMainSetComplete(liftId, setIndex) {
  const key = `main-${liftId}-${state.currentWeek}`
  const completed = completedSets()[key] || []
  return completed.includes(setIndex)
}

/**
 * Toggle a main work set completion
 */
export function toggleMainSet(liftId, setIndex) {
  const key = `main-${liftId}-${state.currentWeek}`
  setCompletedSets(prev => {
    const completed = prev[key] || []
    if (completed.includes(setIndex)) {
      return { ...prev, [key]: completed.filter(i => i !== setIndex) }
    } else {
      return { ...prev, [key]: [...completed, setIndex] }
    }
  })
}

/**
 * Get count of completed main work sets
 */
export function getMainCompletedCount(liftId) {
  const key = `main-${liftId}-${state.currentWeek}`
  return (completedSets()[key] || []).length
}
