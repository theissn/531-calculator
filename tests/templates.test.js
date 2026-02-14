import { describe, it, expect } from 'vitest'
import { generateSupplementalSets, generate5x531Sets } from '../src/templates.js'

describe('templates', () => {
  it('returns null when no supplemental template exists', () => {
    expect(generateSupplementalSets('classic', 200, 1, 50, 5)).toBe(null)
  })

  it('calculates BBB supplemental weights from user percentage', () => {
    const supplemental = generateSupplementalSets('bbb', 200, 1, 50, 5)
    expect(supplemental).toMatchObject({
      templateName: 'BBB',
      sets: 5,
      reps: 10,
      weight: 100,
      percentage: 50
    })
    expect(supplemental.display).toBe('5\u00d710 @ 100')
  })

  it('uses week percentages for FSL and SSL', () => {
    const fsl = generateSupplementalSets('fsl', 200, 1, 60, 5)
    expect(fsl).toMatchObject({
      weight: 130,
      percentage: 65
    })

    const ssl = generateSupplementalSets('ssl', 200, 1, 60, 5)
    expect(ssl).toMatchObject({
      weight: 150,
      percentage: 75
    })
  })

  it('generates 5x5/3/1 main sets at top percentage', () => {
    const sets = generate5x531Sets(200, 2, 5)
    expect(sets).toHaveLength(5)
    sets.forEach(set => {
      expect(set.weight).toBe(180)
    })
    expect(sets[0]).toMatchObject({ reps: 3, isAmrap: false })
    expect(sets[4]).toMatchObject({ reps: 3, isAmrap: true })
  })
})
