/**
 * 5/3/1 Calculator - Core math functions
 */

/**
 * Default plate inventory (per side)
 */
export const DEFAULT_PLATES_LBS = [45, 25, 10, 5, 2.5]
export const DEFAULT_PLATES_KG = [20, 10, 5, 2.5, 1.25]
export const DEFAULT_BAR_WEIGHT = { lbs: 45, kg: 20 }

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
 * Estimate 1RM from weight and reps using Epley formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Reps completed
 * @returns {number} Estimated 1RM
 */
export function estimate1RM(weight, reps) {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  // Epley formula: weight × (1 + reps/30)
  return Math.round(weight * (1 + reps / 30))
}

/**
 * Estimate expected reps from weight and 1RM (inverse Epley)
 * @param {number} weight - Weight to lift
 * @param {number} oneRepMax - Known or estimated 1RM
 * @returns {number} Expected reps (floored)
 */
export function estimateReps(weight, oneRepMax) {
  if (weight <= 0 || oneRepMax <= 0) return 0
  if (weight >= oneRepMax) return 1
  // Inverse Epley: reps = 30 × ((1RM / weight) - 1)
  const reps = 30 * ((oneRepMax / weight) - 1)
  return Math.floor(reps)
}

/**
 * Calculate reps needed to beat a target 1RM using Epley formula
 * @param {number} weight - Weight being lifted
 * @param {number} target1RM - 1RM to beat
 * @returns {number} Required reps
 */
export function repsToBeat(weight, target1RM) {
  if (weight >= target1RM) return 1
  // weight * (1 + reps/30) > target1RM
  // 1 + reps/30 > target1RM / weight
  // reps/30 > (target1RM / weight) - 1
  // reps > 30 * ((target1RM / weight) - 1)
  return Math.ceil(30 * ((target1RM / weight) - 1) + 0.001) // Add small epsilon to ensure it beats
}

/**
 * Calculate DOTS score for relative strength
 * @param {number} bodyWeight - Body weight
 * @param {number} totalLifted - Total weight lifted (S+B+D) or 1RM
 * @param {string} unit - 'lbs' or 'kg'
 * @param {string} gender - 'male' (default) or 'female'
 * @returns {number} DOTS score
 */
export function calculateDOTS(bodyWeight, totalLifted, unit = 'lbs', gender = 'male') {
  let bw = bodyWeight
  let total = totalLifted

  // DOTS constants are for kg
  if (unit === 'lbs') {
    bw = bodyWeight * 0.45359237
    total = totalLifted * 0.45359237
  }

  const male = [
    -0.000001093,
    0.0007391293,
    -0.1918759221,
    24.9653911277,
    -1511.14028827,
    -0.0000000000
  ]

  // For simplicity we use male coefficients as default for now, 
  // but could expand if user wants female coefficients.
  const c = male

  const denom = 
    c[0] * Math.pow(bw, 4) + 
    c[1] * Math.pow(bw, 3) + 
    c[2] * Math.pow(bw, 2) + 
    c[3] * bw + 
    c[4]

  return (500 / denom) * total
}

/**
 * Calculate plates needed per side for a given weight
 * @param {number} totalWeight - Total weight including bar
 * @param {number} barWeight - Weight of the bar
 * @param {number[]} availablePlates - Available plate sizes (sorted desc)
 * @returns {Object} { plates: [{weight, count}], remainder: number }
 */
export function calculatePlates(totalWeight, barWeight, availablePlates) {
  let weightPerSide = (totalWeight - barWeight) / 2

  if (weightPerSide <= 0) {
    return { plates: [], remainder: 0 }
  }

  // Sort plates descending
  const sortedPlates = [...availablePlates].sort((a, b) => b - a)
  const plates = []

  for (const plateWeight of sortedPlates) {
    if (weightPerSide >= plateWeight) {
      const count = Math.floor(weightPerSide / plateWeight)
      plates.push({ weight: plateWeight, count })
      weightPerSide -= count * plateWeight
    }
  }

  // Round remainder to avoid floating point issues
  const remainder = Math.round(weightPerSide * 100) / 100

  return { plates, remainder }
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
    { percentage: 85, reps: 5, isAmrap: true }
  ],
  2: [
    { percentage: 70, reps: 3 },
    { percentage: 80, reps: 3 },
    { percentage: 90, reps: 3, isAmrap: true }
  ],
  3: [
    { percentage: 75, reps: 5 },
    { percentage: 85, reps: 3 },
    { percentage: 95, reps: 1, isAmrap: true }
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
