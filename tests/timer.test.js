import { describe, it, expect } from 'vitest'
import { formatTime } from '../src/hooks/useTimer.js'

describe('timer', () => {
  it('formats seconds as minutes and seconds', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
  })
})
