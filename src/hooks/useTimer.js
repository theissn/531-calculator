/**
 * Timer Hook - Reactive rest timer
 */

import { createSignal } from 'solid-js'
import { requestWakeLock, releaseWakeLock } from './useMobile.js'

const [seconds, setSeconds] = createSignal(0)
const [isRunning, setIsRunning] = createSignal(false)
let interval = null

/**
 * Start the rest timer
 */
export function startTimer() {
  stopTimer()
  setSeconds(0)
  setIsRunning(true)

  // Keep screen awake while timer is running
  requestWakeLock()

  interval = setInterval(() => {
    setSeconds(s => s + 1)
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
  setSeconds(0)
  
  // Allow screen to sleep again
  releaseWakeLock()
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
