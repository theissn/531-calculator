/**
 * CalendarView Component - Month calendar showing training days
 */

import { Show, For, createSignal, createMemo } from 'solid-js'
import { Portal } from 'solid-js/web'
import { setShowCalendar, getWorkoutsByMonth, LIFT_NAMES } from '../store.js'
import { haptic } from '../hooks/useMobile.js'

// Colors for each lift (matching Progress.jsx)
const LIFT_COLORS = {
  squat: '#ef4444',    // red
  bench: '#3b82f6',    // blue
  deadlift: '#22c55e', // green
  ohp: '#f59e0b'       // amber
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDuration(seconds) {
  if (seconds < 60) return '<1 min'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  return `${hours}h ${remainingMins}m`
}

export default function CalendarView() {
  const today = new Date()
  const [currentYear, setCurrentYear] = createSignal(today.getFullYear())
  const [currentMonth, setCurrentMonth] = createSignal(today.getMonth())
  const [selectedDay, setSelectedDay] = createSignal(null)

  const monthName = () => {
    return new Date(currentYear(), currentMonth(), 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    })
  }

  const workoutsByDay = createMemo(() => {
    return getWorkoutsByMonth(currentYear(), currentMonth())
  })

  const calendarDays = createMemo(() => {
    const firstDay = new Date(currentYear(), currentMonth(), 1)
    const lastDay = new Date(currentYear(), currentMonth() + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days = []

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push({ day: null, isToday: false })
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday =
        day === today.getDate() &&
        currentMonth() === today.getMonth() &&
        currentYear() === today.getFullYear()

      days.push({ day, isToday })
    }

    return days
  })

  const selectedDayWorkouts = createMemo(() => {
    if (selectedDay() === null) return []
    return workoutsByDay()[selectedDay()] || []
  })

  const handleClose = () => {
    haptic()
    setShowCalendar(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handlePrevMonth = () => {
    haptic()
    if (currentMonth() === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear() - 1)
    } else {
      setCurrentMonth(currentMonth() - 1)
    }
    setSelectedDay(null)
  }

  const handleNextMonth = () => {
    haptic()
    if (currentMonth() === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear() + 1)
    } else {
      setCurrentMonth(currentMonth() + 1)
    }
    setSelectedDay(null)
  }

  const handleDayClick = (day) => {
    if (day === null) return
    haptic()
    setSelectedDay(selectedDay() === day ? null : day)
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/50" />
        <div class="absolute inset-y-0 right-0 w-full max-w-md bg-bg border-l border-border overflow-y-auto">
          <div class="sticky top-0 z-10 bg-bg border-b border-border">
            <div class="flex items-center justify-between px-4 h-14">
              <h2 class="text-lg font-semibold">Calendar</h2>
              <button class="p-2 -mr-2 text-text-muted hover:text-text" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4 space-y-4">
            {/* Month Navigation */}
            <div class="flex items-center justify-between">
              <button
                class="p-2 text-text-muted hover:text-text rounded-lg hover:bg-bg-hover"
                onClick={handlePrevMonth}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 class="text-lg font-semibold">{monthName()}</h3>
              <button
                class="p-2 text-text-muted hover:text-text rounded-lg hover:bg-bg-hover"
                onClick={handleNextMonth}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
              {/* Day headers */}
              <div class="grid grid-cols-7 border-b border-border">
                <For each={DAYS_OF_WEEK}>
                  {(day) => (
                    <div class="py-2 text-center text-xs text-text-dim font-medium">
                      {day}
                    </div>
                  )}
                </For>
              </div>

              {/* Calendar days */}
              <div class="grid grid-cols-7">
                <For each={calendarDays()}>
                  {(item) => {
                    const dayWorkouts = () => item.day ? (workoutsByDay()[item.day] || []) : []
                    const hasWorkouts = () => dayWorkouts().length > 0
                    const isSelected = () => selectedDay() === item.day

                    return (
                      <button
                        class={`relative aspect-square flex flex-col items-center justify-center border-b border-r border-border last:border-r-0 transition-colors ${
                          item.day === null
                            ? 'bg-bg-card cursor-default'
                            : isSelected()
                              ? 'bg-bg-hover'
                              : 'hover:bg-bg-hover'
                        } ${item.isToday ? 'ring-1 ring-inset ring-text-muted' : ''}`}
                        onClick={() => handleDayClick(item.day)}
                        disabled={item.day === null}
                      >
                        <Show when={item.day !== null}>
                          <span class={`text-sm ${item.isToday ? 'font-bold' : ''} ${hasWorkouts() ? 'text-text' : 'text-text-dim'}`}>
                            {item.day}
                          </span>
                          <Show when={hasWorkouts()}>
                            <div class="flex gap-0.5 mt-1">
                              <For each={dayWorkouts().slice(0, 4)}>
                                {(workout) => (
                                  <div
                                    class="w-1.5 h-1.5 rounded-full"
                                    style={{ "background-color": LIFT_COLORS[workout.liftId] }}
                                  />
                                )}
                              </For>
                            </div>
                          </Show>
                        </Show>
                      </button>
                    )
                  }}
                </For>
              </div>
            </div>

            {/* Legend */}
            <div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <For each={Object.entries(LIFT_COLORS)}>
                {([liftId, color]) => (
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full" style={{ "background-color": color }} />
                    <span class="text-xs text-text-muted">{LIFT_NAMES[liftId].split(' ')[0]}</span>
                  </div>
                )}
              </For>
            </div>

            {/* Selected Day Details */}
            <Show when={selectedDay() !== null && selectedDayWorkouts().length > 0}>
              <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
                <div class="px-4 py-3 border-b border-border">
                  <h3 class="font-semibold">
                    {new Date(currentYear(), currentMonth(), selectedDay()).toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </h3>
                </div>
                <div class="divide-y divide-border">
                  <For each={selectedDayWorkouts()}>
                    {(workout) => (
                      <div class="px-4 py-3">
                        <div class="flex items-center gap-2 mb-1">
                          <div
                            class="w-2 h-2 rounded-full"
                            style={{ "background-color": LIFT_COLORS[workout.liftId] }}
                          />
                          <span class="font-medium">{LIFT_NAMES[workout.liftId]}</span>
                          <span class="text-xs text-text-dim bg-bg-hover px-1.5 py-0.5 rounded">
                            Week {workout.week}
                          </span>
                          <Show when={workout.rpe}>
                            <span class="text-xs text-text-dim bg-bg-hover px-1.5 py-0.5 rounded">
                              RPE {workout.rpe}
                            </span>
                          </Show>
                        </div>
                        <div class="flex items-center gap-4 text-sm text-text-muted">
                          <span>{workout.mainSets.filter(s => s.completed).length}/{workout.mainSets.length} sets</span>
                          <span>{formatDuration(workout.duration)}</span>
                          <Show when={workout.mainSets.find(s => s.isAmrap && s.actualReps)}>
                            {(amrap) => (
                              <span class="text-text">{amrap().actualReps} AMRAP</span>
                            )}
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <Show when={selectedDay() !== null && selectedDayWorkouts().length === 0}>
              <div class="text-center py-8 text-text-muted">
                <p>No workouts on this day</p>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Portal>
  )
}
