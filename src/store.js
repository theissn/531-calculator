/**
 * SolidJS Store - Application State Management
 */

import { createStore, reconcile } from 'solid-js/store'
import { createSignal, createEffect, createRoot } from 'solid-js'
import { getData, updateData, resetData } from './db.js'
import { calculateTM, generateWorkingSets, estimate1RM } from './calculator.js'
import { TEMPLATES, generateSupplementalSets, generate5x531Sets } from './templates.js'

// Create reactive store
const [state, setState] = createStore({
  lifts: null,
  settings: null,
  currentWeek: 1,
  isOnboarded: false,
  isLoading: true
})

// Settings panel visibility
const [showSettings, setShowSettings] = createSignal(false)

// AMRAP modal state: { liftId, weight, week, minReps } or null
const [amrapModal, setAmrapModal] = createSignal(null)

// Progress view visibility
const [showProgress, setShowProgress] = createSignal(false)

// Calendar view visibility
const [showCalendar, setShowCalendar] = createSignal(false)

// Incomplete workout for resume prompt (set during init if exists)
const [incompleteWorkout, setIncompleteWorkout] = createSignal(null)

/**
 * Initialize store from IndexedDB
 */
export async function initStore() {
  const data = await getData()
  setState(reconcile({ ...data, isLoading: false }))
  initTheme()

  // Check for incomplete workout to prompt resume
  if (data.currentWorkout && data.currentWorkout.id) {
    setIncompleteWorkout(data.currentWorkout)
  }
}

/**
 * Update state and persist to IndexedDB
 */
async function update(updates) {
  const newState = await updateData(updates)
  setState(reconcile(newState))
}

/**
 * Apply theme to document
 */
export function applyTheme(theme) {
  const html = document.documentElement
  let isLight = false

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isLight = !prefersDark
  } else if (theme === 'light') {
    isLight = true
  }

  html.classList.toggle('light', isLight)

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.setAttribute('content', isLight ? '#f5f5f5' : '#0a0a0a')
  }
}

/**
 * Initialize theme and listen for system preference changes
 */
function initTheme() {
  const theme = state.settings?.theme || 'system'
  applyTheme(theme)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = state.settings?.theme || 'system'
    if (currentTheme === 'system') {
      applyTheme('system')
    }
  })
}

/**
 * Complete onboarding with initial 1RMs
 */
export async function completeOnboarding(lifts) {
  await update({
    lifts: {
      squat: { ...state.lifts.squat, oneRepMax: lifts.squat },
      bench: { ...state.lifts.bench, oneRepMax: lifts.bench },
      deadlift: { ...state.lifts.deadlift, oneRepMax: lifts.deadlift },
      ohp: { ...state.lifts.ohp, oneRepMax: lifts.ohp }
    },
    isOnboarded: true
  })
}

/**
 * Update settings
 */
export async function updateSettings(settings) {
  await update({ settings: { ...state.settings, ...settings } })
  if (settings.theme !== undefined) {
    applyTheme(settings.theme)
  }
}

/**
 * Update a lift's 1RM and log TM history
 */
export async function updateLift(liftId, oneRepMax) {
  const oldOneRepMax = state.lifts[liftId]?.oneRepMax || 0
  
  // Only log if actually changing and not initial setup (oneRepMax > 0)
  if (oneRepMax !== oldOneRepMax && oldOneRepMax > 0) {
    const trainingMax = calculateTM(oneRepMax, state.settings.tmPercentage)
    const tmRecord = {
      liftId,
      date: new Date().toISOString(),
      oneRepMax,
      trainingMax: Math.round(trainingMax)
    }
    // Clone existing history to plain objects (SolidJS proxies can't be stored in IndexedDB)
    const existingHistory = JSON.parse(JSON.stringify(state.tmHistory || []))
    const tmHistory = [...existingHistory, tmRecord]
    
    await update({
      lifts: {
        ...state.lifts,
        [liftId]: { ...state.lifts[liftId], oneRepMax }
      },
      tmHistory
    })
  } else {
    await update({
      lifts: {
        ...state.lifts,
        [liftId]: { ...state.lifts[liftId], oneRepMax }
      }
    })
  }
}

/**
 * Update a lift's settings (template, supplemental percentage)
 */
export async function updateLiftSettings(liftId, liftSettings) {
  await update({
    lifts: {
      ...state.lifts,
      [liftId]: { ...state.lifts[liftId], ...liftSettings }
    }
  })
}

/**
 * Set current week
 */
export async function setCurrentWeek(week) {
  await update({ currentWeek: week })
}

/**
 * Set current lift filter
 */
export async function setCurrentLift(liftId) {
  await update({ currentLift: liftId })
}

/**
 * Reset all data
 */
export async function reset() {
  const data = await resetData()
  setState(reconcile(data))
}

/**
 * Export all data as JSON string
 */
export function exportData() {
  const data = JSON.parse(JSON.stringify(state))
  // Remove loading state
  delete data.isLoading
  return JSON.stringify(data, null, 2)
}

/**
 * Import data from JSON string
 */
export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields exist
    if (!data.lifts || !data.settings) {
      throw new Error('Invalid backup file: missing required data')
    }
    
    // Merge with defaults to ensure all fields exist
    const { DEFAULT_DATA } = await import('./db.js')
    const mergedData = {
      ...DEFAULT_DATA,
      ...data,
      isOnboarded: true // If they have data, they're onboarded
    }
    
    await update(mergedData)
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Record a PR from an AMRAP set
 */
export async function recordPR(liftId, weight, reps, week) {
  const estimated1RM = estimate1RM(weight, reps)
  const record = {
    liftId,
    date: new Date().toISOString(),
    weight,
    reps,
    estimated1RM,
    week
  }
  
  // Clone existing history to plain objects (SolidJS proxies can't be stored in IndexedDB)
  const existingHistory = JSON.parse(JSON.stringify(state.prHistory || []))
  const prHistory = [...existingHistory, record]
  await update({ prHistory })
  
  return record
}

/**
 * Get PR history for a lift
 */
export function getPRHistory(liftId) {
  return (state.prHistory || []).filter(pr => pr.liftId === liftId)
}

/**
 * Get best estimated 1RM for a lift
 */
export function getBestPR(liftId) {
  const history = getPRHistory(liftId)
  if (history.length === 0) return null
  return history.reduce((best, pr) => pr.estimated1RM > best.estimated1RM ? pr : best)
}

/**
 * Get previous AMRAP performance for a lift at a similar weight (±5 lbs/kg)
 * Returns the most recent match with weight, reps, and date
 */
export function getPreviousAmrapPerformance(liftId, targetWeight) {
  const history = getPRHistory(liftId)
  if (history.length === 0) return null

  // Find entries within ±5 of target weight
  const tolerance = 5
  const matches = history.filter(pr =>
    Math.abs(pr.weight - targetWeight) <= tolerance
  )

  if (matches.length === 0) return null

  // Return most recent match (history is chronological, so last match is most recent)
  const mostRecent = matches[matches.length - 1]
  return {
    weight: mostRecent.weight,
    reps: mostRecent.reps,
    date: mostRecent.date,
    estimated1RM: mostRecent.estimated1RM
  }
}

/**
 * Get TM history for a lift
 */
export function getTMHistory(liftId) {
  return (state.tmHistory || []).filter(tm => tm.liftId === liftId)
}

/**
 * Get all TM history
 */
export function getAllTMHistory() {
  return state.tmHistory || []
}

/**
 * Save a workout note
 */
export async function saveWorkoutNote(note, week) {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  // Clone existing notes to plain objects (SolidJS proxies can't be stored in IndexedDB)
  const workoutNotes = JSON.parse(JSON.stringify(state.workoutNotes || []))
  
  // Find existing note for today, or create new
  const existingIndex = workoutNotes.findIndex(n => n.date === today)
  
  let updatedNotes
  if (existingIndex >= 0) {
    updatedNotes = [...workoutNotes]
    updatedNotes[existingIndex] = { date: today, week, note }
  } else {
    updatedNotes = [...workoutNotes, { date: today, week, note }]
  }
  
  await update({ workoutNotes: updatedNotes })
}

/**
 * Get today's workout note
 */
export function getTodayNote() {
  const today = new Date().toISOString().split('T')[0]
  return (state.workoutNotes || []).find(n => n.date === today)
}

/**
 * Get all workout notes (sorted by date descending)
 */
export function getAllWorkoutNotes() {
  return [...(state.workoutNotes || [])].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Create a new accessory template
 */
export async function createAccessoryTemplate(name, exercises = []) {
  const id = Date.now().toString()
  const template = { id, name, exercises }
  
  const existingTemplates = JSON.parse(JSON.stringify(state.accessoryTemplates || []))
  const accessoryTemplates = [...existingTemplates, template]
  
  await update({ accessoryTemplates })
  return template
}

/**
 * Update an accessory template
 */
export async function updateAccessoryTemplate(id, updates) {
  const templates = JSON.parse(JSON.stringify(state.accessoryTemplates || []))
  const index = templates.findIndex(t => t.id === id)
  
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates }
    await update({ accessoryTemplates: templates })
  }
}

/**
 * Delete an accessory template
 */
export async function deleteAccessoryTemplate(id) {
  const templates = JSON.parse(JSON.stringify(state.accessoryTemplates || []))
  const accessoryTemplates = templates.filter(t => t.id !== id)
  
  // Clear from any lifts that had this template assigned
  const lifts = JSON.parse(JSON.stringify(state.lifts))
  for (const liftId of Object.keys(lifts)) {
    if (lifts[liftId].accessoryTemplateId === id) {
      lifts[liftId].accessoryTemplateId = null
    }
  }
  
  await update({ accessoryTemplates, lifts })
}

/**
 * Get all accessory templates
 */
export function getAccessoryTemplates() {
  return state.accessoryTemplates || []
}

/**
 * Get accessory template for a specific lift
 */
export function getTemplateForLift(liftId) {
  const templateId = state.lifts[liftId]?.accessoryTemplateId
  if (!templateId) return null
  return (state.accessoryTemplates || []).find(t => t.id === templateId)
}

/**
 * Get calculated data for a lift on a given week
 */
export function getLiftData(liftId, week) {
  const lift = state.lifts[liftId]
  const settings = state.settings
  const template = lift.template || 'classic'
  const supplementalPercentage = lift.supplementalPercentage || 50
  const tm = calculateTM(lift.oneRepMax, settings.tmPercentage)

  // Determine supplemental lift (defaults to same lift)
  const supplementalLiftId = lift.supplementalLiftId || liftId
  const supplementalLift = state.lifts[supplementalLiftId]
  const supplementalTM = calculateTM(supplementalLift.oneRepMax, settings.tmPercentage)

  let mainSets
  if (template === '5x531') {
    mainSets = generate5x531Sets(tm, week, settings.roundingIncrement)
  } else {
    mainSets = generateWorkingSets(tm, week, settings.roundingIncrement, settings.showWarmups)
  }

  const supplemental = generateSupplementalSets(
    template,
    supplementalTM,
    week,
    supplementalPercentage,
    settings.roundingIncrement
  )

  return {
    liftId,
    oneRepMax: lift.oneRepMax,
    trainingMax: tm,
    unit: settings.unit,
    template,
    mainSets,
    supplemental,
    supplementalLiftId,
    supplementalLiftName: LIFT_NAMES[supplementalLiftId]
  }
}

/**
 * Get all lifts data for a week
 */
export function getAllLiftsForWeek(week) {
  return ['squat', 'bench', 'deadlift', 'ohp'].map(liftId => getLiftData(liftId, week))
}

/**
 * Lift display names
 */
export const LIFT_NAMES = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press'
}

// ============================================
// Workout Persistence & History
// ============================================

/**
 * Start a new workout (or get existing for the lift/week)
 */
export async function startWorkout(liftId, week) {
  // If there's already a workout for this lift/week, return it
  const existing = state.currentWorkout
  if (existing && existing.liftId === liftId && existing.week === week) {
    return existing
  }

  const workout = {
    id: Date.now().toString(),
    liftId,
    week,
    startedAt: new Date().toISOString(),
    mainSets: {
      completed: [],
      amrapReps: null
    },
    supplemental: null,
    accessories: [],
    note: ''
  }

  await update({ currentWorkout: workout })
  setIncompleteWorkout(null) // Clear any resume prompt
  return workout
}

/**
 * Persist updates to the current workout
 */
export async function persistCurrentWorkout(updates) {
  if (!state.currentWorkout) return

  const current = JSON.parse(JSON.stringify(state.currentWorkout))
  const updated = { ...current, ...updates }

  // Deep merge for nested objects
  if (updates.mainSets) {
    updated.mainSets = { ...current.mainSets, ...updates.mainSets }
  }
  if (updates.supplemental && current.supplemental) {
    updated.supplemental = { ...current.supplemental, ...updates.supplemental }
  }

  await update({ currentWorkout: updated })
}

/**
 * Get current workout
 */
export function getCurrentWorkout() {
  return state.currentWorkout
}

/**
 * Finish workout - move to history and clear current
 * @param {number|null} rpe - Optional RPE rating (1-10)
 */
export async function finishWorkout(rpe = null) {
  const current = state.currentWorkout
  if (!current) return null

  const lift = state.lifts[current.liftId]
  const settings = state.settings
  const liftData = getLiftData(current.liftId, current.week)

  // Build complete workout record
  const completedAt = new Date().toISOString()
  const startTime = new Date(current.startedAt).getTime()
  const duration = Math.round((Date.now() - startTime) / 1000)

  // Filter out warmup sets - only include work sets in history
  const workSets = liftData.mainSets.filter(set => set.type !== 'warmup')

  const workoutRecord = {
    id: current.id,
    liftId: current.liftId,
    week: current.week,
    startedAt: current.startedAt,
    completedAt,
    duration,
    oneRepMax: lift.oneRepMax,
    trainingMax: liftData.trainingMax,
    template: lift.template || 'classic',
    unit: settings.unit,
    mainSets: workSets.map((set, idx) => ({
      setNumber: idx + 1,
      weight: set.weight,
      targetReps: set.reps,
      actualReps: set.isAmrap ? current.mainSets.amrapReps : null,
      percentage: set.percentage,
      completed: current.mainSets.completed.includes(idx),
      isAmrap: set.isAmrap || false
    })),
    supplemental: current.supplemental ? {
      templateName: lift.template || 'classic',
      targetSets: current.supplemental.targetSets || 0,
      completedSets: current.supplemental.completedCount || 0,
      weight: current.supplemental.weight || 0,
      reps: current.supplemental.reps || 0
    } : null,
    accessories: current.accessories || [],
    note: current.note || '',
    rpe: rpe
  }

  // Append to history
  const existingHistory = JSON.parse(JSON.stringify(state.workoutHistory || []))
  const workoutHistory = [...existingHistory, workoutRecord]

  // Clear current workout and save history
  await update({ currentWorkout: null, workoutHistory })

  return workoutRecord
}

/**
 * Discard current workout without saving
 */
export async function discardWorkout() {
  await update({ currentWorkout: null })
  setIncompleteWorkout(null)
}

/**
 * Resume an incomplete workout (dismiss the prompt, navigate to lift/week)
 */
export function dismissIncompleteWorkout() {
  setIncompleteWorkout(null)
}

/**
 * Get workout history, optionally filtered by lift
 */
export function getWorkoutHistory(liftId = null) {
  const history = state.workoutHistory || []
  if (liftId) {
    return history.filter(w => w.liftId === liftId)
  }
  return history
}

/**
 * Get workouts for a specific month
 * @param {number} year - Full year (e.g., 2024)
 * @param {number} month - Month (0-11)
 * @returns {Object} Map of day number to array of workouts
 */
export function getWorkoutsByMonth(year, month) {
  const history = state.workoutHistory || []
  const workoutsByDay = {}

  for (const workout of history) {
    const date = new Date(workout.completedAt)
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate()
      if (!workoutsByDay[day]) {
        workoutsByDay[day] = []
      }
      workoutsByDay[day].push(workout)
    }
  }

  return workoutsByDay
}

/**
 * Delete a workout from history
 */
export async function deleteWorkoutFromHistory(workoutId) {
  const history = JSON.parse(JSON.stringify(state.workoutHistory || []))
  const workoutHistory = history.filter(w => w.id !== workoutId)
  await update({ workoutHistory })
}

// ============================================
// Body Weight Tracking
// ============================================

/**
 * Add a body weight entry
 */
export async function addBodyWeight(weight) {
  const entry = {
    date: new Date().toISOString(),
    weight
  }

  const existingHistory = JSON.parse(JSON.stringify(state.bodyWeightHistory || []))
  const bodyWeightHistory = [...existingHistory, entry]

  await update({ bodyWeightHistory })
  return entry
}

/**
 * Get body weight history (sorted by date)
 */
export function getBodyWeightHistory() {
  return [...(state.bodyWeightHistory || [])].sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  )
}

/**
 * Get latest body weight entry
 */
export function getLatestBodyWeight() {
  const history = state.bodyWeightHistory || []
  if (history.length === 0) return null

  // Find the most recent entry
  return history.reduce((latest, entry) =>
    new Date(entry.date) > new Date(latest.date) ? entry : latest
  )
}

export { state, showSettings, setShowSettings, amrapModal, setAmrapModal, showProgress, setShowProgress, showCalendar, setShowCalendar, incompleteWorkout, setIncompleteWorkout, TEMPLATES }
