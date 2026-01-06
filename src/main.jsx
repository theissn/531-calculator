/**
 * 5/3/1 Calculator - SolidJS Entry Point
 */

import { render } from 'solid-js/web'
import { initStore } from './store.js'
import App from './components/App.jsx'
import './style.css'

// Initialize store and render app
initStore().then(() => {
  render(() => <App />, document.getElementById('app'))
})

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, but app still works
    })
  })
}
