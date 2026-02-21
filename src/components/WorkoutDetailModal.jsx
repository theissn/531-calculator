/**
 * WorkoutDetailModal Component - Read-only view of a historical workout
 */

import { Show, For } from 'solid-js'
import { workoutToView, setWorkoutToView, LIFT_NAMES } from '../store.js'

function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

function formatTime(isoString) {
    return new Date(isoString).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit'
    })
}

export default function WorkoutDetailModal() {
    const workout = () => workoutToView()

    const handleClose = () => {
        setWorkoutToView(null)
    }

    return (
        <Show when={workout()}>
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={handleClose}>
                <div class="bg-bg border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative" onClick={e => e.stopPropagation()}>

                    {/* Header */}
                    <div class="sticky top-0 bg-bg z-10 border-b border-border p-4 flex items-start justify-between">
                        <div>
                            <h2 class="text-xl font-bold uppercase tracking-tighter text-text font-mono">
                                {LIFT_NAMES[workout().liftId]}
                            </h2>
                            <div class="text-xs text-text-muted font-mono mt-1">
                                {formatDate(workout().completedAt)} • {formatTime(workout().completedAt)}
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            class="text-text-dim hover:text-text p-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="p-4 space-y-6">

                        {/* Stats Grid */}
                        <div class="grid grid-cols-2 gap-px bg-border border border-border">
                            <div class="bg-bg p-3">
                                <div class="text-[10px] uppercase text-text-dim font-mono mb-1">Duration</div>
                                <div class="text-lg font-bold font-mono text-text">
                                    {Math.floor(workout().duration / 60)}m {workout().duration % 60}s
                                </div>
                            </div>
                            <div class="bg-bg p-3">
                                <div class="text-[10px] uppercase text-text-dim font-mono mb-1">Wait / RPE</div>
                                <div class="text-lg font-bold font-mono text-text">
                                    {workout().rpe ? `RPE ${workout().rpe}` : '-'}
                                </div>
                            </div>
                            <div class="bg-bg p-3">
                                <div class="text-[10px] uppercase text-text-dim font-mono mb-1">Training Max</div>
                                <div class="text-lg font-bold font-mono text-text">
                                    {Math.round(workout().trainingMax)} {workout().unit}
                                </div>
                            </div>
                            <div class="bg-bg p-3">
                                <div class="text-[10px] uppercase text-text-dim font-mono mb-1">1RM Estimate</div>
                                <div class="text-lg font-bold font-mono text-text">
                                    {workout().oneRepMax} {workout().unit}
                                </div>
                            </div>
                        </div>

                        {/* Main Sets */}
                        <div>
                            <div class="flex items-center gap-4 mb-3">
                                <div class="h-px flex-1 bg-border"></div>
                                <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Main Sets</span>
                                <div class="h-px flex-1 bg-border"></div>
                            </div>
                            <div class="space-y-px bg-border border border-border">
                                <For each={workout().mainSets}>
                                    {(set) => (
                                        <div class="flex items-center justify-between p-3 bg-bg">
                                            <div class="flex items-baseline gap-3">
                                                <span class="text-sm font-bold text-text font-mono w-6 text-right">{set.setNumber}</span>
                                                <span class="text-sm font-bold text-text font-mono">
                                                    {set.weight} <span class="text-xs text-text-dim font-normal">{workout().unit}</span>
                                                </span>
                                                <span class="text-xs text-text-dim font-mono">x</span>
                                                <span class="text-sm font-bold text-text font-mono">
                                                    {String(set.targetReps).replace('+', '')}{set.isAmrap ? '+' : ''}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-3">
                                                <span class="text-xs text-text-dim font-mono">{set.percentage}%</span>
                                                <Show when={set.completed} fallback={
                                                    <span class="text-xs text-red-500 font-mono font-bold uppercase">Missed</span>
                                                }>
                                                    <Show when={set.isAmrap && set.actualReps} fallback={
                                                        <div class="w-6 h-6 flex items-center justify-center bg-text text-bg text-[10px] font-bold">OK</div>
                                                    }>
                                                        <div class="px-2 py-0.5 bg-hazard-stripe text-text font-bold text-xs border border-text/20">
                                                            {set.actualReps}
                                                        </div>
                                                    </Show>
                                                </Show>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </div>

                        {/* Joker Sets */}
                        <Show when={workout().jokerSets && workout().jokerSets.length > 0}>
                            <div>
                                <div class="flex items-center gap-4 mb-3">
                                    <div class="h-px flex-1 bg-border"></div>
                                    <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Joker Sets</span>
                                    <div class="h-px flex-1 bg-border"></div>
                                </div>
                                <div class="space-y-px bg-border border border-border">
                                    <For each={workout().jokerSets}>
                                        {(set) => (
                                            <div class="flex items-center justify-between p-3 bg-bg">
                                                <div class="flex items-baseline gap-3">
                                                    <span class="text-sm font-bold text-text font-mono w-6 text-right">{set.setNumber}</span>
                                                    <span class="text-sm font-bold text-text font-mono">
                                                        {set.weight} <span class="text-xs text-text-dim font-normal">{workout().unit}</span>
                                                    </span>
                                                    <span class="text-xs text-text-dim font-mono">x</span>
                                                    <span class="text-sm font-bold text-text font-mono">
                                                        {set.reps}
                                                    </span>
                                                </div>
                                                <div class="flex items-center gap-3">
                                                    <span class="text-xs text-text-dim font-mono">{set.percentage}%</span>
                                                    <Show when={set.completed} fallback={
                                                        <span class="text-xs text-red-500 font-mono font-bold uppercase">Missed</span>
                                                    }>
                                                        <div class="w-6 h-6 flex items-center justify-center bg-text text-bg text-[10px] font-bold">OK</div>
                                                    </Show>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>

                        {/* Supplemental */}
                        <Show when={workout().supplemental && workout().supplemental.targetSets > 0}>
                            <div>
                                <div class="flex items-center gap-4 mb-3">
                                    <div class="h-px flex-1 bg-border"></div>
                                    <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Supplemental</span>
                                    <div class="h-px flex-1 bg-border"></div>
                                </div>
                                <div class="border border-border p-3 bg-bg flex justify-between items-center">
                                    <span class="text-sm font-mono font-bold text-text">
                                        {workout().supplemental.weight} {workout().unit} x {workout().supplemental.reps}
                                    </span>
                                    <div class="text-xs font-mono">
                                        <span class="text-text font-bold">{workout().supplemental.completedSets}</span>
                                        <span class="text-text-dim"> / {workout().supplemental.targetSets} SETS</span>
                                    </div>
                                </div>
                            </div>
                        </Show>

                        {/* Accessories */}
                        <Show when={workout().accessories && workout().accessories.length > 0}>
                            <div>
                                <div class="flex items-center gap-4 mb-3">
                                    <div class="h-px flex-1 bg-border"></div>
                                    <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Assistance</span>
                                    <div class="h-px flex-1 bg-border"></div>
                                </div>

                                <Show when={typeof workout().accessories[0] === 'object'} fallback={
                                    <div class="text-sm text-text-muted font-mono italic text-center">
                                        Legacy data: {workout().accessories.length} exercises completed.
                                    </div>
                                }>
                                    <div class="space-y-2">
                                        <For each={workout().accessories}>
                                            {(accessory) => (
                                                <div class="border border-border p-3 bg-bg">
                                                    <div class="flex justify-between items-baseline mb-1">
                                                        <div class="text-sm font-bold text-text font-mono uppercase truncate pr-4">{accessory.name}</div>
                                                        <div class="text-xs font-mono whitespace-nowrap">
                                                            <span class="text-text font-bold">{accessory.completedSets}</span>
                                                            <span class="text-text-dim">/{accessory.sets}</span>
                                                        </div>
                                                    </div>
                                                    <div class="text-xs text-text-muted font-mono">
                                                        {accessory.reps} REPS
                                                        <Show when={accessory.weight}>
                                                            <span class="text-text-dim mx-1">@</span>
                                                            <span class="text-text font-bold">{accessory.weight} LBS</span>
                                                        </Show>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>
                        </Show>

                        {/* Notes */}
                        <Show when={workout().note}>
                            <div>
                                <div class="flex items-center gap-4 mb-3">
                                    <div class="h-px flex-1 bg-border"></div>
                                    <span class="text-xs font-bold text-text-dim uppercase tracking-widest font-mono">Note</span>
                                    <div class="h-px flex-1 bg-border"></div>
                                </div>
                                <div class="bg-bg-card p-4 border border-border text-sm font-mono text-text whitespace-pre-wrap">
                                    {workout().note}
                                </div>
                            </div>
                        </Show>

                    </div>

                    {/* Footer */}
                    <div class="p-4 border-t border-border bg-bg sticky bottom-0">
                        <button
                            onClick={handleClose}
                            class="w-full py-3 bg-text text-bg font-bold uppercase font-mono tracking-wider hover:bg-text/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>

                </div>
            </div>
        </Show>
    )
}
