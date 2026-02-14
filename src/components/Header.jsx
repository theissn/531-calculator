/**
 * Header Component - App header with timer and settings
 */

import { Show } from 'solid-js'
import { setShowSettings, setShowProgress, setShowCalendar } from '../store.js'
import { seconds, isRunning, stopTimer, formatTime } from '../hooks/useTimer.js'
import { haptic } from '../hooks/useMobile.js'

export default function Header() {
  const handleTimerDismiss = () => {
    haptic()
    stopTimer()
  }

  const handleCalendarClick = () => {
    haptic()
    setShowCalendar(true)
  }

  const handleProgressClick = () => {
    haptic()
    setShowProgress(true)
  }

  const handleSettingsClick = () => {
    haptic()
    setShowSettings(true)
  }

  return (
    <>
      <header class="sticky top-0 z-10 bg-bg border-b border-border">
        <div class="flex items-center justify-between px-4 h-14 max-w-lg mx-auto w-full">
          <h1 class="text-xl font-bold tracking-tighter text-text font-mono upper">
            SYSTEM: 5/3/1
          </h1>
          <div class="flex items-center gap-4">
            <button
              class="w-10 h-10 flex items-center justify-center border border-border hover:bg-bg-hover text-text-muted hover:text-text transition-colors rounded-none"
              aria-label="Calendar"
              onClick={handleCalendarClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              class="w-10 h-10 flex items-center justify-center border border-border hover:bg-bg-hover text-text-muted hover:text-text transition-colors rounded-none"
              aria-label="Progress"
              onClick={handleProgressClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </button>
            <button
              class="w-10 h-10 flex items-center justify-center border border-border hover:bg-bg-hover text-text-muted hover:text-text transition-colors rounded-none -mr-2"
              aria-label="Settings"
              onClick={handleSettingsClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Fixed Bottom Rest Timer */}
      <Show when={isRunning()}>
        <div class="fixed bottom-0 left-0 right-0 z-50">
          <button
            class="w-full px-4 py-4 bg-bg-card border-t border-border flex items-center justify-center gap-3 active:bg-bg-hover"
            onClick={handleTimerDismiss}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span class="font-mono text-3xl font-bold">{formatTime(seconds())}</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </Show>
    </>
  )
}
