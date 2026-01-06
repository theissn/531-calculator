/**
 * 5/3/1 Calculator App - Entry Point
 */

import './style.css'
import { initApp, subscribe, getState, initTheme } from './app.js'
import { renderApp } from './ui/render.js'
import { renderOnboarding } from './ui/onboarding.js'
import { initSettingsPanel } from './ui/settings.js'

const app = document.getElementById('app')

/**
 * Main render function
 */
function render() {
  const state = getState()

  if (!state) {
    // Show loading state
    app.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-text-dim">Loading...</div>
      </div>
    `
    return
  }

  if (!state.isOnboarded) {
    renderOnboarding(app)
  } else {
    renderApp(app)
  }
}

/**
 * Initialize the application
 */
async function init() {
  try {
    // Initialize app state from IndexedDB
    await initApp()

    // Initialize theme
    initTheme()

    // Initialize settings panel
    initSettingsPanel(app)

    // Subscribe to state changes
    subscribe(render)

    // Initial render
    render()

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Service worker registration failed, but app still works
        })
      })
    }
  } catch (error) {
    // Show error state
    app.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center p-4">
        <div class="text-red-500 mb-2">Failed to initialize app</div>
        <div class="text-text-dim text-sm text-center">${error.message}</div>
        <button
          onclick="location.reload()"
          class="mt-4 px-4 py-2 bg-bg-card border border-border rounded"
        >
          Retry
        </button>
      </div>
    `
  }
}

// Start the app
init()
