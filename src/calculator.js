/**
 * 5/3/1 Calculator - Core math functions
 */

/**
 * Calculate Training Max from 1RM
 * @param {number} oneRepMax - The one rep max
 * @param {number} tmPercentage - TM percentage (80-95)
 * @returns {number} Training Max
 */
export function calculateTM(oneRepMax, tmPercentage) {
  return oneRepMax * (tmPercentage / 100)
}

/**
 * Round weight to nearest increment
 * @param {number} weight - Weight to round
 * @param {number} increment - Rounding increment (e.g., 5, 2.5)
 * @returns {number} Rounded weight
 */
export function roundWeight(weight, increment) {
  return Math.round(weight / increment) * increment
}

/**
 * Calculate weight for a given percentage of TM
 * @param {number} trainingMax - The training max
 * @param {number} percentage - Percentage (e.g., 65, 75, 85)
 * @param {number} roundingIncrement - Rounding increment
 * @returns {number} Calculated and rounded weight
 */
export function calculateWeight(trainingMax, percentage, roundingIncrement) {
  const weight = trainingMax * (percentage / 100)
  return roundWeight(weight, roundingIncrement)
}

/**
 * Week percentages for main work sets
 * Each week has 3 sets with percentage and reps
 */
export const WEEK_SCHEMES = {
  1: [
    { percentage: 65, reps: 5 },
    { percentage: 75, reps: 5 },
    { percentage: 85, reps: '5+', isAmrap: true }
  ],
  2: [
    { percentage: 70, reps: 3 },
    { percentage: 80, reps: 3 },
    { percentage: 90, reps: '3+', isAmrap: true }
  ],
  3: [
    { percentage: 75, reps: 5 },
    { percentage: 85, reps: 3 },
    { percentage: 95, reps: '1+', isAmrap: true }
  ],
  4: [
    { percentage: 40, reps: 5 },
    { percentage: 50, reps: 5 },
    { percentage: 60, reps: 5 }
  ]
}

/**
 * Warm-up set percentages and reps
 */
export const WARMUP_SETS = [
  { percentage: 40, reps: 5 },
  { percentage: 50, reps: 5 },
  { percentage: 60, reps: 3 }
]

/**
 * Generate all sets for a lift on a given week
 * @param {number} trainingMax - Training max for the lift
 * @param {number} week - Week number (1-4)
 * @param {number} roundingIncrement - Rounding increment
 * @param {boolean} showWarmups - Whether to include warmup sets
 * @returns {Array} Array of set objects with weight, reps, type
 */
export function generateWorkingSets(trainingMax, week, roundingIncrement, showWarmups = false) {
  const sets = []

  // Add warmup sets if enabled
  if (showWarmups) {
    WARMUP_SETS.forEach((set, index) => {
      sets.push({
        type: 'warmup',
        setNumber: index + 1,
        weight: calculateWeight(trainingMax, set.percentage, roundingIncrement),
        reps: set.reps,
        percentage: set.percentage
      })
    })
  }

  // Add working sets for the week
  const weekScheme = WEEK_SCHEMES[week]
  weekScheme.forEach((set, index) => {
    sets.push({
      type: 'work',
      setNumber: index + 1,
      weight: calculateWeight(trainingMax, set.percentage, roundingIncrement),
      reps: set.reps,
      percentage: set.percentage,
      isAmrap: set.isAmrap || false
    })
  })

  return sets
}
