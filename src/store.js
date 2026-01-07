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

/**
 * Initialize store from IndexedDB
 */
export async function initStore() {
  const data = await getData()
  setState(reconcile({ ...data, isLoading: false }))
  initTheme()
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
 * Reset all data
 */
export async function reset() {
  const data = await resetData()
  setState(reconcile(data))
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
 * Get calculated data for a lift on a given week
 */
export function getLiftData(liftId, week) {
  const lift = state.lifts[liftId]
  const settings = state.settings
  const template = lift.template || 'classic'
  const supplementalPercentage = lift.supplementalPercentage || 50
  const tm = calculateTM(lift.oneRepMax, settings.tmPercentage)

  let mainSets
  if (template === '5x531') {
    mainSets = generate5x531Sets(tm, week, settings.roundingIncrement)
  } else {
    mainSets = generateWorkingSets(tm, week, settings.roundingIncrement, settings.showWarmups)
  }

  const supplemental = generateSupplementalSets(
    template,
    tm,
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
    supplemental
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

export { state, showSettings, setShowSettings, amrapModal, setAmrapModal, showProgress, setShowProgress, TEMPLATES }
