/**
 * 5/3/1 App - Main application state and logic
 */

import { getData, saveData, updateData, resetData } from './db.js'
import { calculateTM, generateWorkingSets, WEEK_SCHEMES } from './calculator.js'
import { TEMPLATES, generateSupplementalSets, generate5x531Sets } from './templates.js'

// Application state
let state = null
let listeners = []

/**
 * Initialize the app
 * @returns {Promise<Object>} Initial state
 */
export async function initApp() {
  state = await getData()
  notifyListeners()
  return state
}

/**
 * Get current state
 * @returns {Object} Current state
 */
export function getState() {
  return state
}

/**
 * Subscribe to state changes
 * @param {Function} listener - Callback function
 * @returns {Function} Unsubscribe function
 */
export function subscribe(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  listeners.forEach(listener => listener(state))
}

/**
 * Update state and persist
 * @param {Object} updates - Partial state updates
 */
export async function update(updates) {
  state = await updateData(updates)
  notifyListeners()
}

/**
 * Reset all data
 */
export async function reset() {
  state = await resetData()
  notifyListeners()
}

/**
 * Complete onboarding with initial 1RMs
 * @param {Object} lifts - Lift 1RMs { squat, bench, deadlift, ohp }
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
 * @param {Object} settings - Settings to update
 */
export async function updateSettings(settings) {
  await update({ settings: { ...state.settings, ...settings } })
  if (settings.theme !== undefined) {
    applyTheme(settings.theme)
  }
}

/**
 * Apply theme to document
 * @param {string} theme - 'system' | 'dark' | 'light'
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

  // Update theme-color meta tag for browser chrome
  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.setAttribute('content', isLight ? '#f5f5f5' : '#0a0a0a')
  }
}

/**
 * Initialize theme and listen for system preference changes
 */
export function initTheme() {
  const theme = state?.settings?.theme || 'system'
  applyTheme(theme)

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const currentTheme = state?.settings?.theme || 'system'
    if (currentTheme === 'system') {
      applyTheme('system')
    }
  })
}

/**
 * Update a lift's 1RM
 * @param {string} liftId - Lift ID (squat, bench, deadlift, ohp)
 * @param {number} oneRepMax - New 1RM
 */
export async function updateLift(liftId, oneRepMax) {
  await update({
    lifts: {
      ...state.lifts,
      [liftId]: { ...state.lifts[liftId], oneRepMax }
    }
  })
}

/**
 * Update a lift's settings (template, supplemental percentage)
 * @param {string} liftId - Lift ID (squat, bench, deadlift, ohp)
 * @param {Object} liftSettings - Settings to update
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
 * @param {number} week - Week number (1-4)
 */
export async function setCurrentWeek(week) {
  await update({ currentWeek: week })
}

/**
 * Get calculated data for a lift on a given week
 * @param {string} liftId - Lift ID
 * @param {number} week - Week number
 * @returns {Object} Calculated lift data
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
 * @param {number} week - Week number
 * @returns {Array} Array of lift data objects
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

export { TEMPLATES }
