/**
 * Timer Hook - Reactive rest timer
 */

import { createSignal } from 'solid-js'
import { requestWakeLock, releaseWakeLock } from './useMobile.js'

const [seconds, setSeconds] = createSignal(0)
const [isRunning, setIsRunning] = createSignal(false)
const [startTime, setStartTime] = createSignal(null)
let interval = null

/**
 * Start the rest timer
 */
export function startTimer() {
  stopTimer()
  const now = Date.now()
  setStartTime(now)
  setSeconds(0)
  setIsRunning(true)

  // Keep screen awake while timer is running
  requestWakeLock('timer')

  interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime()) / 1000)
    setSeconds(elapsed)
  }, 1000)
}

/**
 * Stop the timer
 */
export function stopTimer() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
  setIsRunning(false)
  setStartTime(null)
  setSeconds(0)
  
  // Allow screen to sleep again
  releaseWakeLock('timer')
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(secs) {
  const mins = Math.floor(secs / 60)
  const s = secs % 60
  return `${mins}:${s.toString().padStart(2, '0')}`
}

export { seconds, isRunning }
