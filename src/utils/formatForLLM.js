/**
 * LLM-friendly text formatters for copying workout data
 */

import { state, getAccessoryTemplates, LIFT_NAMES, TEMPLATES } from '../store.js'
import { calculateTM } from '../calculator.js'

const LIFT_IDS = ['squat', 'bench', 'deadlift', 'ohp']

/**
 * Format settings (1RM/TM configuration) for LLM
 */
export function formatSettingsForLLM() {
  const { settings, lifts } = state
  const accessoryTemplates = getAccessoryTemplates()

  const lines = [
    '531 Training Configuration',
    '==========================',
    `Training Max: ${settings.tmPercentage}% of 1RM`,
    `Unit: ${settings.unit}`,
    ''
  ]

  for (const liftId of LIFT_IDS) {
    const lift = lifts[liftId]
    const oneRepMax = lift?.oneRepMax
    const tm = oneRepMax ? Math.round(calculateTM(oneRepMax, settings.tmPercentage)) : null
    const templateId = lift?.template || 'classic'
    const template = TEMPLATES[templateId]

    lines.push(LIFT_NAMES[liftId])
    lines.push(`  1RM: ${oneRepMax || '—'} | TM: ${tm || '—'}`)

    // Template name with supplemental percentage for BBB
    let templateLine = `  Template: ${template?.name || 'Classic'}`
    if (templateId === 'bbb') {
      templateLine += ` @ ${lift.supplementalPercentage || 50}%`
    }
    if (!template?.hasSupplemental && templateId === 'classic') {
      templateLine += ' (no supplemental)'
    }
    lines.push(templateLine)

    // Supplemental lift override (if different from main lift)
    if (lift?.supplementalLiftId && lift.supplementalLiftId !== liftId && template?.hasSupplemental) {
      lines.push(`  Supplemental lift: ${LIFT_NAMES[lift.supplementalLiftId]}`)
    }

    // Accessory template
    if (lift?.accessoryTemplateId) {
      const accTemplate = accessoryTemplates.find(t => t.id === lift.accessoryTemplateId)
      if (accTemplate) {
        lines.push(`  Accessories: ${accTemplate.name}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n').trim()
}

/**
 * Format a single workout for LLM
 */
export function formatWorkoutForLLM(workout) {
  const date = new Date(workout.completedAt)
  const dateStr = date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })

  const durationMins = Math.round(workout.duration / 60)

  const lines = [
    `531 Workout - ${LIFT_NAMES[workout.liftId]} (Week ${workout.week})`,
    `Date: ${dateStr} at ${timeStr} | Duration: ${durationMins} min`,
    '',
    'Main Sets:'
  ]

  for (const set of workout.mainSets) {
    let setLine = `  ${set.weight} x ${set.targetReps}`
    if (set.isAmrap) {
      setLine += '+'
    }
    setLine += ` @ ${set.percentage}%`

    if (set.completed) {
      if (set.isAmrap && set.actualReps) {
        setLine += ` → ${set.actualReps} reps`
      } else {
        setLine += ' ✓'
      }
    } else {
      setLine += ' (skipped)'
    }

    lines.push(setLine)
  }

  // Joker Sets
  if (workout.jokerSets && workout.jokerSets.length > 0) {
    lines.push('')
    lines.push('Joker Sets:')
    for (const set of workout.jokerSets) {
      let setLine = `  ${set.weight} x ${set.reps} @ ${set.percentage}%`
      if (set.completed) {
        setLine += ' ✓'
      } else {
        setLine += ' (skipped)'
      }
      lines.push(setLine)
    }
  }

  // Supplemental
  if (workout.supplemental && workout.supplemental.targetSets > 0) {
    const suppl = workout.supplemental
    lines.push('')
    lines.push(
      `Supplemental: ${suppl.targetSets}x${suppl.reps} @ ${suppl.weight} ` +
      `(${suppl.completedSets}/${suppl.targetSets} sets)`
    )
  }

  // Accessories
  if (workout.accessories && workout.accessories.length > 0) {
    lines.push('')
    lines.push('Accessories:')
    for (const acc of workout.accessories) {
      let accLine = `  ${acc.name}: ${acc.completedSets}/${acc.sets}`
      if (acc.weight) {
        accLine += ` @ ${acc.weight} x ${acc.reps}`
      } else {
        accLine += ` x ${acc.reps}`
      }
      lines.push(accLine)
    }
  }

  // Note
  if (workout.note) {
    lines.push('')
    lines.push(`Note: ${workout.note}`)
  }

  lines.push(`1RM: ${workout.oneRepMax} | TM: ${Math.round(workout.trainingMax)}`)

  return lines.join('\n')
}

/**
 * Format workout history for LLM
 * @param {number|null} limit - Optional limit on number of workouts (most recent first)
 */
export function formatHistoryForLLM(limit = null) {
  const history = [...(state.workoutHistory || [])].sort(
    (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
  )
  
  const toFormat = limit ? history.slice(0, limit) : history
  
  if (toFormat.length === 0) {
    return 'No workout history found.'
  }

  const lines = [
    `531 Workout History${limit ? ` (Last ${limit})` : ''}`,
    '==========================',
    ''
  ]

  for (const workout of toFormat) {
    lines.push(formatWorkoutForLLM(workout))
    lines.push('\n---\n')
  }

  return lines.join('\n').trim()
}

/**
 * Format a training cycle (multiple workouts) for LLM
 */
export function formatCycleForLLM(workouts) {
  if (!workouts || workouts.length === 0) {
    return '531 Training Cycle\n\nNo workouts recorded.'
  }

  // Sort by date ascending for display
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.completedAt) - new Date(b.completedAt)
  )

  const firstDate = new Date(sorted[0].completedAt)
  const lastDate = new Date(sorted[sorted.length - 1].completedAt)

  const formatShortDate = (date) => date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })

  const lines = [
    '531 Training Cycle',
    `Period: ${formatShortDate(firstDate)} - ${formatShortDate(lastDate)} | ${workouts.length} workouts`,
    ''
  ]

  // Group by lift
  const byLift = {}
  for (const workout of sorted) {
    if (!byLift[workout.liftId]) {
      byLift[workout.liftId] = []
    }
    byLift[workout.liftId].push(workout)
  }

  // Output each lift's workouts
  for (const liftId of LIFT_IDS) {
    const liftWorkouts = byLift[liftId]
    if (!liftWorkouts || liftWorkouts.length === 0) continue

    lines.push(`${LIFT_NAMES[liftId].toUpperCase()}:`)

    for (const workout of liftWorkouts) {
      const amrapSet = workout.mainSets.find(s => s.isAmrap)
      const topSet = workout.mainSets[workout.mainSets.length - 1]

      const date = new Date(workout.completedAt)
      const dateStr = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })

      let repInfo
      if (amrapSet && amrapSet.actualReps) {
        repInfo = `${topSet.weight} x ${topSet.targetReps}+ (${amrapSet.actualReps} reps)`
      } else if (topSet) {
        repInfo = `${topSet.weight} x ${topSet.targetReps}${topSet.isAmrap ? '+' : ''}`
        if (topSet.isAmrap) {
          repInfo += ' (no reps)'
        }
      } else {
        repInfo = '—'
      }

      lines.push(`  W${workout.week}: ${repInfo} | ${dateStr}`)
    }

    lines.push('')
  }

  return lines.join('\n').trim()
}
