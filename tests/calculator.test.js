import { describe, it, expect } from 'vitest'
import {
  calculateTM,
  roundWeight,
  estimate1RM,
  estimateReps,
  calculatePlates,
  calculateWeight,
  generateWorkingSets
} from '../src/calculator.js'

describe('calculator', () => {
  it('calculates training max and rounds weights', () => {
    expect(calculateTM(200, 85)).toBe(170)
    expect(roundWeight(183, 5)).toBe(185)
    expect(calculateWeight(200, 85, 5)).toBe(170)
  })

  it('estimates 1RM and reps with guardrails', () => {
    expect(estimate1RM(200, 0)).toBe(0)
    expect(estimate1RM(200, 1)).toBe(200)
    expect(estimate1RM(200, 5)).toBe(233)

    expect(estimateReps(0, 200)).toBe(0)
    expect(estimateReps(200, 200)).toBe(1)
    expect(estimateReps(150, 200)).toBe(9)
  })

  it('calculates plates and remainders per side', () => {
    expect(calculatePlates(45, 45, [45, 25, 10, 5, 2.5])).toEqual({
      plates: [],
      remainder: 0
    })

    expect(calculatePlates(225, 45, [10, 45, 25, 5, 2.5])).toEqual({
      plates: [{ weight: 45, count: 2 }],
      remainder: 0
    })
  })

  it('generates working sets with optional warmups', () => {
    const setsWithoutWarmups = generateWorkingSets(200, 1, 5, false)
    expect(setsWithoutWarmups).toHaveLength(3)
    expect(setsWithoutWarmups[2]).toMatchObject({
      weight: 170,
      reps: 5,
      isAmrap: true
    })

    const setsWithWarmups = generateWorkingSets(200, 1, 5, true)
    expect(setsWithWarmups).toHaveLength(6)
    expect(setsWithWarmups[0]).toMatchObject({
      type: 'warmup',
      weight: 80,
      reps: 5
    })
  })

  it('keeps deload week sets non-amrap', () => {
    const deloadSets = generateWorkingSets(200, 4, 5, false)
    expect(deloadSets).toHaveLength(3)
    deloadSets.forEach(set => {
      expect(set.isAmrap).toBe(false)
    })
  })
})
