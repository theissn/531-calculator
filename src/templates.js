/**
 * 5/3/1 Templates - Supplemental work definitions
 */

import { calculateWeight, WEEK_SCHEMES } from './calculator.js'

/**
 * Template definitions
 */
export const TEMPLATES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Main sets only',
    hasSupplemental: false
  },
  bbb: {
    id: 'bbb',
    name: 'BBB',
    description: 'Boring But Big - 5×10',
    hasSupplemental: true,
    defaultPercentage: 50,
    sets: 5,
    reps: 10
  },
  fsl: {
    id: 'fsl',
    name: 'FSL',
    description: 'First Set Last - 5×5',
    hasSupplemental: true,
    usesFirstSetPercentage: true,
    sets: 5,
    reps: 5
  },
  ssl: {
    id: 'ssl',
    name: 'SSL',
    description: 'Second Set Last - 5×5',
    hasSupplemental: true,
    usesSecondSetPercentage: true,
    sets: 5,
    reps: 5
  },
  '5x531': {
    id: '5x531',
    name: '5×5/3/1',
    description: '5 work sets, last is PR',
    hasSupplemental: false,
    modifiesMainSets: true
  }
}

/**
 * Generate supplemental sets for a template
 * @param {string} templateId - Template ID
 * @param {number} trainingMax - Training max for the lift
 * @param {number} week - Week number (1-4)
 * @param {number} supplementalPercentage - User-configured supplemental percentage
 * @param {number} roundingIncrement - Rounding increment
 * @returns {Array|null} Array of supplemental sets or null if none
 */
export function generateSupplementalSets(templateId, trainingMax, week, supplementalPercentage, roundingIncrement) {
  const template = TEMPLATES[templateId]

  if (!template || !template.hasSupplemental) {
    return null
  }

  let percentage

  if (template.usesFirstSetPercentage) {
    // FSL uses first set percentage of the week
    percentage = WEEK_SCHEMES[week][0].percentage
  } else if (template.usesSecondSetPercentage) {
    // SSL uses second set percentage of the week
    percentage = WEEK_SCHEMES[week][1].percentage
  } else {
    // BBB uses user-configured percentage
    percentage = supplementalPercentage
  }

  const weight = calculateWeight(trainingMax, percentage, roundingIncrement)

  return {
    templateName: template.name,
    sets: template.sets,
    reps: template.reps,
    weight,
    percentage,
    display: `${template.sets}×${template.reps} @ ${weight}`
  }
}

/**
 * Generate main sets for 5×5/3/1 template (5 sets at top percentage)
 * @param {number} trainingMax - Training max for the lift
 * @param {number} week - Week number (1-4)
 * @param {number} roundingIncrement - Rounding increment
 * @returns {Array} Array of set objects
 */
export function generate5x531Sets(trainingMax, week, roundingIncrement) {
  const weekScheme = WEEK_SCHEMES[week]
  const topSet = weekScheme[weekScheme.length - 1]
  const weight = calculateWeight(trainingMax, topSet.percentage, roundingIncrement)

  const sets = []
  for (let i = 1; i <= 5; i++) {
    sets.push({
      type: 'work',
      setNumber: i,
      weight,
      reps: i === 5 ? topSet.reps : (week === 1 ? 5 : week === 2 ? 3 : week === 3 ? 1 : 5),
      percentage: topSet.percentage,
      isAmrap: i === 5 && topSet.isAmrap
    })
  }

  return sets
}
