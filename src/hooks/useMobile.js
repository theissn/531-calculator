/**
 * Mobile Experience Utilities
 * - Haptic feedback
 * - Wake Lock (keep screen on)
 * - Orientation lock
 */

import { createSignal, onCleanup } from 'solid-js'

/**
 * Trigger haptic feedback (short vibration)
 * Safe to call on unsupported devices
 */
export function haptic(duration = 10) {
  if (navigator.vibrate) {
    navigator.vibrate(duration)
  }
}

// Wake Lock state
let wakeLock = null
const [isWakeLockActive, setIsWakeLockActive] = createSignal(false)

/**
 * Request wake lock to keep screen on
 */
export async function requestWakeLock() {
  if (!('wakeLock' in navigator)) return false
  
  try {
    wakeLock = await navigator.wakeLock.request('screen')
    setIsWakeLockActive(true)
    
    wakeLock.addEventListener('release', () => {
      setIsWakeLockActive(false)
    })
    
    return true
  } catch (err) {
    console.warn('Wake Lock request failed:', err)
    return false
  }
}

/**
 * Release wake lock
 */
export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release()
    wakeLock = null
    setIsWakeLockActive(false)
  }
}

/**
 * Re-acquire wake lock when page becomes visible again
 * (Wake lock is automatically released when tab is hidden)
 */
export function setupWakeLockVisibilityHandler() {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible' && isWakeLockActive()) {
      await requestWakeLock()
    }
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  
  onCleanup(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
}

/**
 * Lock screen to portrait orientation
 * Only works on supported mobile browsers
 */
export async function lockPortrait() {
  if (!screen.orientation?.lock) return false
  
  try {
    await screen.orientation.lock('portrait')
    return true
  } catch (err) {
    // Silently fail - not all browsers/contexts support this
    return false
  }
}

export { isWakeLockActive }
