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
 * Mobility Protocols
 */
export const MOBILITY_PROTOCOLS = {
  'agile-8': {
    id: 'agile-8',
    name: 'Agile 8',
    description: 'Jim Wendler\'s standard mobility warm-up',
    movements: [
      'Foam Roll: IT Band, Adductors, Quads, Glutes, Hamstrings',
      'Pelvic Tilts (10-20 reps)',
      'Cat/Camel (10-20 reps)',
      'Fire Hydrants (10 reps/side)',
      'Mountain Climbers (10 reps/side)',
      'Groiners (10 reps)',
      'Frog Stretches (10 reps)',
      'Cossack Squats (10 reps/side)'
    ]
  },
  'limber-11': {
    id: 'limber-11',
    name: 'Limber 11',
    description: 'Joe DeFranco\'s expanded mobility routine',
    movements: [
      'Foam Roll: IT Band (10-15 passes/side)',
      'Foam Roll: Adductors (10-15 passes/side)',
      'SMR: Glute (Lacrosse ball, 2 mins/side)',
      'Bent-knee Iron Cross (5-10 reps/side)',
      'Rollover into V-sit (10-15 reps)',
      'Rocking Frog Stretch (10 reps)',
      'Fire Hydrant Circles (10 forward, 10 back/side)',
      'Mountain Climbers (10-15 reps/side)',
      'Cossack Squats (5-10 reps/side)',
      'Seated Piriformis Stretch (30-60 secs/side)',
      'Rear-foot Elevated Hip Flexor Stretch (30 secs/side)'
    ]
  },
  'upper-body-warmup': {
    id: 'upper-body-warmup',
    name: 'Upper Body Prep',
    description: 'Shoulder and thoracic spine mobility',
    movements: [
      'Thoracic Extension (Foam Roll, 10-15 reps)',
      'Band Pull-aparts (20 reps)',
      'Face Pulls (20 reps)',
      'Scapular Push-ups (15 reps)',
      'Shoulder Dislocations (PVC/Band, 15 reps)',
      'Cat/Camel (10 reps)'
    ]
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
