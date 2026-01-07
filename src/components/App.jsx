/**
 * App Component - Root application component
 */

import { Show, For } from 'solid-js'
import { state, showSettings, getAllLiftsForWeek } from '../store.js'
import Header from './Header.jsx'
import WeekTabs from './WeekTabs.jsx'
import LiftCard from './LiftCard.jsx'
import Settings from './Settings.jsx'
import Onboarding from './Onboarding.jsx'
import AmrapModal from './AmrapModal.jsx'

export default function App() {
  const liftsData = () => getAllLiftsForWeek(state.currentWeek)
  const isDeload = () => state.currentWeek === 4

  return (
    <Show when={!state.isLoading} fallback={<div class="min-h-screen bg-bg" />}>
      <Show when={state.isOnboarded} fallback={<Onboarding />}>
        <div class="flex flex-col min-h-screen">
          <Header />
          <WeekTabs />
          <main class="flex-1 px-4 pb-8 pt-4">
            <div class="space-y-6">
              <For each={liftsData()}>
                {(lift) => <LiftCard lift={lift} isDeload={isDeload()} />}
              </For>
            </div>
          </main>
        </div>
        <Show when={showSettings()}>
          <Settings />
        </Show>
        <AmrapModal />
      </Show>
    </Show>
  )
}
