/**
 * IndexedDB wrapper for 5/3/1 app
 */

const DB_NAME = '531-calculator'
const DB_VERSION = 1
const STORE_NAME = 'settings'

let db = null

/**
 * Default data structure
 */
export const DEFAULT_DATA = {
  lifts: {
    squat: { oneRepMax: 0, template: 'classic', supplementalPercentage: 50, accessoryTemplateId: null, supplementalLiftId: null },
    bench: { oneRepMax: 0, template: 'classic', supplementalPercentage: 50, accessoryTemplateId: null, supplementalLiftId: null },
    deadlift: { oneRepMax: 0, template: 'classic', supplementalPercentage: 50, accessoryTemplateId: null, supplementalLiftId: null },
    ohp: { oneRepMax: 0, template: 'classic', supplementalPercentage: 50, accessoryTemplateId: null, supplementalLiftId: null }
  },
  settings: {
    tmPercentage: 85,
    unit: 'lbs',
    roundingIncrement: 5,
    showWarmups: false,
    showPlates: false,
    showTopSetBadge: true,
    showNextWeightJump: true,
    barWeight: 45,
    availablePlates: [45, 25, 10, 5, 2.5],
    theme: 'system' // 'system' | 'dark' | 'light'
  },
  // PR history: array of { liftId, date, weight, reps, estimated1RM, week }
  prHistory: [],
  // TM history: array of { liftId, date, oneRepMax, trainingMax }
  tmHistory: [],
  // Workout notes: array of { date, week, note }
  workoutNotes: [],
  // Accessory templates: array of { id, name, exercises: [{name, sets, reps}] }
  accessoryTemplates: [],
  currentWeek: 1,
  currentLift: 'squat', // 'squat' | 'bench' | 'deadlift' | 'ohp'
  isOnboarded: false
}

/**
 * Initialize the database
 * @returns {Promise} Resolves when DB is ready
 */
export function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open database'))
    }

    request.onsuccess = (event) => {
      db = event.target.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

/**
 * Get all data from the store
 * @returns {Promise<Object>} The stored data or defaults
 */
export async function getData() {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get('main')

    request.onsuccess = () => {
      if (request.result) {
        // Merge with defaults to ensure all fields exist
        resolve({ ...DEFAULT_DATA, ...request.result.data })
      } else {
        resolve({ ...DEFAULT_DATA })
      }
    }

    request.onerror = () => {
      reject(new Error('Failed to get data'))
    }
  })
}

/**
 * Save data to the store
 * @param {Object} data - Data to save
 * @returns {Promise} Resolves when saved
 */
export async function saveData(data) {
  await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put({ id: 'main', data })

    request.onsuccess = () => {
      resolve()
    }

    request.onerror = () => {
      reject(new Error('Failed to save data'))
    }
  })
}

/**
 * Update specific fields in the data
 * @param {Object} updates - Partial data to merge
 * @returns {Promise<Object>} The updated data
 */
export async function updateData(updates) {
  const current = await getData()
  const updated = deepMerge(current, updates)
  await saveData(updated)
  return updated
}

/**
 * Reset all data to defaults
 * @returns {Promise} Resolves when reset
 */
export async function resetData() {
  await saveData({ ...DEFAULT_DATA })
  return { ...DEFAULT_DATA }
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const result = { ...target }

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }

  return result
}
