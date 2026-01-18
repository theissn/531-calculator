/**
 * App Component - Root application component
 */

import { Show, For, onMount, onCleanup } from 'solid-js'
import { state, showSettings, showProgress, getAllLiftsForWeek, incompleteWorkout } from '../store.js'
import { isRunning } from '../hooks/useTimer.js'
import { requestWakeLock, setupWakeLockVisibilityHandler } from '../hooks/useMobile.js'
import Header from './Header.jsx'
import WeekTabs from './WeekTabs.jsx'
import LiftSelector from './LiftSelector.jsx'
import LiftCard from './LiftCard.jsx'
import Settings from './Settings.jsx'
import Onboarding from './Onboarding.jsx'
import AmrapModal from './AmrapModal.jsx'
import Progress from './Progress.jsx'
import WorkoutNotes from './WorkoutNotes.jsx'
import FinishWorkoutButton from './FinishWorkoutButton.jsx'
import ResumeWorkoutModal from './ResumeWorkoutModal.jsx'

export default function App() {
  const allLiftsData = () => getAllLiftsForWeek(state.currentWeek)
  const currentLift = () => state.currentLift || 'squat'
  const liftsData = () => allLiftsData().filter(lift => lift.liftId === currentLift())
  const isDeload = () => state.currentWeek === 4

  onMount(() => {
    requestWakeLock('app')
    setupWakeLockVisibilityHandler()
  })

  return (
    <Show when={!state.isLoading} fallback={<div class="min-h-screen bg-bg" />}>
      <Show when={state.isOnboarded} fallback={<Onboarding />}>
        <div class="flex flex-col min-h-screen">
          <Header />
          <WeekTabs />
          <LiftSelector />
          <main class={`flex-1 px-4 pt-4 ${isRunning() ? 'pb-24' : 'pb-8'}`}>
            <div class="space-y-6">
              <For each={liftsData()}>
                {(lift) => <LiftCard lift={lift} isDeload={isDeload()} />}
              </For>
              <WorkoutNotes />
              <FinishWorkoutButton />
            </div>
          </main>
        </div>
        <Show when={showSettings()}>
          <Settings />
        </Show>
        <Show when={showProgress()}>
          <Progress />
        </Show>
        <AmrapModal />
        <Show when={incompleteWorkout()}>
          <ResumeWorkoutModal />
        </Show>
      </Show>
    </Show>
  )
}
