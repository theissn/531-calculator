/**
 * Rest Timer
 */

let timerInterval = null
let timerSeconds = 0
let timerCallback = null

/**
 * Start the rest timer
 * @param {Function} onTick - Callback called every second with remaining time
 */
export function startTimer(onTick) {
  stopTimer()
  timerSeconds = 0
  timerCallback = onTick

  timerInterval = setInterval(() => {
    timerSeconds++
    if (timerCallback) {
      timerCallback(timerSeconds)
    }
  }, 1000)
}

/**
 * Stop the timer
 */
export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  timerSeconds = 0
}

/**
 * Get current timer value
 * @returns {number} Seconds elapsed
 */
export function getTimerSeconds() {
  return timerSeconds
}

/**
 * Check if timer is running
 * @returns {boolean}
 */
export function isTimerRunning() {
  return timerInterval !== null
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
