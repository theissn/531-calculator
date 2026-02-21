/**
 * Completed Sets Hook - Persisted to currentWorkout for crash recovery
 */

import { createSignal } from 'solid-js'
import { state, startWorkout, persistCurrentWorkout, getCurrentWorkout } from '../store.js'

const [completedSets, setCompletedSets] = createSignal({})

/**
 * Initialize from saved workout state (call on app load/resume)
 */
export function initFromWorkout(currentWorkout) {
  if (!currentWorkout) return

  const newState = {}

  // Restore main sets
  if (currentWorkout.mainSets?.completed) {
    const mainKey = `main-${currentWorkout.liftId}-${currentWorkout.week}`
    newState[mainKey] = currentWorkout.mainSets.completed
  }

  // Restore supplemental count
  if (currentWorkout.supplemental?.completedCount) {
    const supKey = `sup-${currentWorkout.liftId}-${currentWorkout.week}`
    newState[supKey] = currentWorkout.supplemental.completedCount
  }

  // Restore joker sets
  if (currentWorkout.jokerSets) {
    const jokerKey = `jokers-${currentWorkout.liftId}-${currentWorkout.week}`
    newState[jokerKey] = currentWorkout.jokerSets
  }

  setCompletedSets(newState)
}

/**
 * Get joker sets for a lift
 */
export function getJokerSets(liftId) {
  const key = `jokers-${liftId}-${state.currentWeek}`
  return completedSets()[key] || []
}

/**
 * Add a joker set (persists to IndexedDB)
 */
export async function addJokerSetToStore(liftId, jokerSet) {
  const key = `jokers-${liftId}-${state.currentWeek}`
  const newJokers = [...(completedSets()[key] || []), jokerSet]

  setCompletedSets(prev => ({
    ...prev,
    [key]: newJokers
  }))

  // Ensure workout exists and persist
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    jokerSets: newJokers
  })
}

/**
 * Toggle joker set completion (persists to IndexedDB)
 */
export async function toggleJokerSetInStore(liftId, index) {
  const key = `jokers-${liftId}-${state.currentWeek}`
  let newJokers

  setCompletedSets(prev => {
    const jokers = [...(prev[key] || [])]
    if (jokers[index]) {
      jokers[index] = { ...jokers[index], isComplete: !jokers[index].isComplete }
    }
    newJokers = jokers
    return { ...prev, [key]: newJokers }
  })

  // Ensure workout exists and persist
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    jokerSets: newJokers
  })
}

/**
 * Get completed count for supplemental sets
 */
export function getCompletedCount(liftId) {
  const key = `sup-${liftId}-${state.currentWeek}`
  return completedSets()[key] || 0
}

/**
 * Mark a supplemental set as complete (persists to IndexedDB)
 */
export async function markSetComplete(liftId, supplementalInfo = null) {
  const key = `sup-${liftId}-${state.currentWeek}`
  const newCount = (completedSets()[key] || 0) + 1

  setCompletedSets(prev => ({
    ...prev,
    [key]: newCount
  }))

  // Ensure workout exists and persist
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  // Persist supplemental progress
  await persistCurrentWorkout({
    supplemental: {
      completedCount: newCount,
      ...(supplementalInfo || {})
    }
  })
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
 * Toggle a main work set completion (persists to IndexedDB)
 */
export async function toggleMainSet(liftId, setIndex) {
  const key = `main-${liftId}-${state.currentWeek}`
  let newCompleted

  setCompletedSets(prev => {
    const completed = prev[key] || []
    if (completed.includes(setIndex)) {
      newCompleted = completed.filter(i => i !== setIndex)
    } else {
      newCompleted = [...completed, setIndex]
    }
    return { ...prev, [key]: newCompleted }
  })

  // Ensure workout exists and persist
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    mainSets: { completed: newCompleted }
  })
}

/**
 * Set AMRAP reps (persists to IndexedDB)
 */
export async function setAmrapReps(liftId, reps) {
  const current = getCurrentWorkout()
  if (!current || current.liftId !== liftId || current.week !== state.currentWeek) {
    await startWorkout(liftId, state.currentWeek)
  }

  await persistCurrentWorkout({
    mainSets: { amrapReps: reps }
  })
}

/**
 * Get count of completed main work sets
 */
export function getMainCompletedCount(liftId) {
  const key = `main-${liftId}-${state.currentWeek}`
  return (completedSets()[key] || []).length
}

/**
 * Get all workout progress for a lift (used when finishing workout)
 */
export function getWorkoutProgress(liftId, week) {
  const mainKey = `main-${liftId}-${week}`
  const supKey = `sup-${liftId}-${week}`

  return {
    mainCompleted: completedSets()[mainKey] || [],
    supplementalCount: completedSets()[supKey] || 0
  }
}

/**
 * Clear all progress (call after finishing/discarding workout)
 */
export function clearAllProgress() {
  setCompletedSets({})
}

/**
 * Check if there's any tracked progress for a lift
 */
export function hasProgress(liftId) {
  const mainKey = `main-${liftId}-${state.currentWeek}`
  const supKey = `sup-${liftId}-${state.currentWeek}`
  const mainCompleted = completedSets()[mainKey] || []
  const supCount = completedSets()[supKey] || 0
  return mainCompleted.length > 0 || supCount > 0
}
