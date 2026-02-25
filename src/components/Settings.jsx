/**
 * Settings Component - Settings slide-in panel
 */

import { For, Show, createEffect, createSignal } from 'solid-js'
import { Portal } from 'solid-js/web'
import {
  state,
  setShowSettings,
  updateSettings,
  updateLift,
  updateLiftSettings,
  reset,
  exportData,
  importData,
  getAccessoryTemplates,
  createAccessoryTemplate,
  updateAccessoryTemplate,
  deleteAccessoryTemplate,
  addBodyWeight,
  getLatestBodyWeight,
  TEMPLATES,
  MOBILITY_PROTOCOLS,
  finishCycle
} from '../store.js'
import { calculateTM, calculateWeight, WEEK_SCHEMES } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'
import CopyButton from './CopyButton.jsx'
import { formatSettingsForLLM, formatHistoryForLLM } from '../utils/formatForLLM.js'
import { estimate1RM, estimateReps, repsToBeat } from '../calculator.js'

function CalculatorTools() {
  const [weight, setWeight] = createSignal('')
  const [reps, setReps] = createSignal('')
  const [target1RM, setTarget1RM] = createSignal('')

  const estimated1RM = () => {
    const w = parseFloat(weight())
    const r = parseInt(reps(), 10)
    if (!w || !r) return 0
    return estimate1RM(w, r)
  }

  const estimatedTM = () => {
    const e1rm = estimated1RM()
    if (!e1rm) return 0
    return Math.round(e1rm * (state.settings.tmPercentage / 100))
  }

  const repsNeeded = () => {
    const w = parseFloat(weight())
    const t = parseFloat(target1RM())
    if (!w || !t) return 0
    return repsToBeat(w, t)
  }

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <div class="p-3 space-y-4">
        {/* 1RM Estimator */}
        <div class="space-y-2">
          <div class="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest border-b border-border pb-1">1RM Estimator</div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <span class="text-[9px] text-text-dim font-mono uppercase">Weight</span>
              <input
                type="number"
                inputmode="decimal"
                class="w-full bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
                placeholder="0"
                value={weight()}
                onInput={(e) => setWeight(e.target.value)}
              />
            </div>
            <div class="space-y-1">
              <span class="text-[9px] text-text-dim font-mono uppercase">Reps</span>
              <input
                type="number"
                inputmode="numeric"
                class="w-full bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
                placeholder="0"
                value={reps()}
                onInput={(e) => setReps(e.target.value)}
              />
            </div>
          </div>
          <Show when={estimated1RM() > 0}>
            <div class="grid grid-cols-2 gap-px bg-border border border-border">
              <div class="bg-bg p-1.5 text-center">
                <div class="text-[9px] text-text-dim font-mono uppercase">Est. 1RM</div>
                <div class="text-base font-bold font-mono text-primary">{estimated1RM()}</div>
              </div>
              <div class="bg-bg p-1.5 text-center">
                <div class="text-[9px] text-text-dim font-mono uppercase">Est. TM ({state.settings.tmPercentage}%)</div>
                <div class="text-base font-bold font-mono text-text">{estimatedTM()}</div>
              </div>
            </div>
          </Show>
        </div>

        {/* Reps to Beat */}
        <div class="space-y-2">
          <div class="text-[10px] font-bold text-text-muted font-mono uppercase tracking-widest border-b border-border pb-1">Reps to Beat</div>
          <div class="space-y-1">
            <span class="text-[9px] text-text-dim font-mono uppercase">Target 1RM</span>
            <input
              type="number"
              inputmode="decimal"
              class="w-full bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
              placeholder="Enter target 1RM"
              value={target1RM()}
              onInput={(e) => setTarget1RM(e.target.value)}
            />
          </div>
          <Show when={repsNeeded() > 0 && weight()}>
            <div class="p-2 bg-bg border border-border text-center">
              <div class="text-[9px] text-text-dim font-mono uppercase mb-0.5">Reps needed @ {weight()}</div>
              <div class="text-lg font-bold font-mono text-primary">{repsNeeded()}</div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}

function LLMExportDropdown() {
  const [isOpen, setIsOpen] = createSignal(false)
  
  const options = [
    { label: 'Copy Configuration', getText: formatSettingsForLLM },
    { label: 'Copy Recent History (10)', getText: () => formatHistoryForLLM(10) },
    { label: 'Copy Full History', getText: () => formatHistoryForLLM() }
  ]

  const handleCopy = async (option) => {
    haptic()
    const text = option.getText()
    try {
      await navigator.clipboard.writeText(text)
      setIsOpen(false)
      // Success is implied, but could add a toast or similar if needed
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen())
  }

  // Close when clicking outside
  const handleDocClick = () => setIsOpen(false)
  createEffect(() => {
    if (isOpen()) {
      document.addEventListener('click', handleDocClick)
    } else {
      document.removeEventListener('click', handleDocClick)
    }
  })

  return (
    <div class="relative inline-block">
      <button
        onClick={handleToggle}
        class="flex items-center gap-1 px-3 py-1.5 bg-border hover:bg-border-hover text-text-muted hover:text-text rounded-none text-xs font-bold font-mono transition-colors border border-transparent hover:border-text/30 uppercase tracking-widest"
      >
        <span>Copy for LLM</span>
        <svg xmlns="http://www.w3.org/2000/svg" class={`w-3 h-3 transition-transform ${isOpen() ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <Show when={isOpen()}>
        <div class="absolute right-0 top-full mt-1 z-50 bg-bg border border-border shadow-2xl min-w-[200px] divide-y divide-border/50">
          <For each={options}>
            {(option) => (
              <button
                class="w-full text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-text-muted hover:text-text hover:bg-bg-hover transition-colors"
                onClick={() => handleCopy(option)}
              >
                {option.label}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

const LIFT_LABELS = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press'
}

function LiftSettingsCard(props) {
  const [draftOneRepMax, setDraftOneRepMax] = createSignal(props.lift.oneRepMax || '')

  createEffect(() => {
    setDraftOneRepMax(props.lift.oneRepMax || '')
  })

  const normalizeDraftValue = (value) => Math.round(value * 100) / 100
  const formatDraftInput = (value) => (value === 0 ? '0' : value ? String(value) : '')
  const getDraftOneRepMax = () => {
    const parsed = parseFloat(draftOneRepMax())
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const isOneRepMaxDirty = () => getDraftOneRepMax() !== (props.lift.oneRepMax || 0)

  const handleOneRepMaxInput = (e) => {
    setDraftOneRepMax(e.target.value)
  }

  const handleOneRepMaxAdjust = (delta) => {
    const nextValue = normalizeDraftValue(getDraftOneRepMax() + delta)
    setDraftOneRepMax(formatDraftInput(Math.max(0, nextValue)))
  }

  const handleOneRepMaxSave = () => {
    updateLift(props.liftId, getDraftOneRepMax())
  }

  const handleOneRepMaxCancel = () => {
    setDraftOneRepMax(props.lift.oneRepMax || '')
  }

  const topSetPreview = () => {
    const oneRepMax = getDraftOneRepMax()
    if (!oneRepMax) {
      return [1, 2, 3].map((week) => ({ week, weight: null }))
    }

    const trainingMax = calculateTM(oneRepMax, props.tmPercentage)
    return [1, 2, 3].map((week) => {
      const scheme = WEEK_SCHEMES[week]
      const percentage = scheme[scheme.length - 1].percentage
      return {
        week,
        weight: calculateWeight(trainingMax, percentage, props.roundingIncrement)
      }
    })
  }

  const template = () => TEMPLATES[props.lift.template || 'classic']
  const showSupplPct = () => {
    const t = template()
    return t && t.hasSupplemental && !t.usesFirstSetPercentage && !t.usesSecondSetPercentage
  }
  const hasSupplemental = () => {
    const t = template()
    return t && t.hasSupplemental
  }
  const accessoryTemplates = () => getAccessoryTemplates()

  const handleTemplateChange = (e) => {
    updateLiftSettings(props.liftId, { template: e.target.value })
  }

  const handleSupplPctChange = (e) => {
    const value = parseInt(e.target.value, 10) || 50
    updateLiftSettings(props.liftId, { supplementalPercentage: value })
  }

  const handleSupplementalLiftChange = (e) => {
    const value = e.target.value || null
    updateLiftSettings(props.liftId, { supplementalLiftId: value })
  }

  const handleAccessoryTemplateChange = (e) => {
    const value = e.target.value || null
    updateLiftSettings(props.liftId, { accessoryTemplateId: value })
  }

  const handleMobilityChange = (e) => {
    const value = e.target.value || null
    updateLiftSettings(props.liftId, { mobilityProtocolId: value })
  }

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <div class="px-4 py-2 border-b border-border flex items-center justify-between gap-3">
        <span class="text-sm font-medium font-mono uppercase">{LIFT_LABELS[props.liftId]}</span>
        <div class="flex items-center gap-2 text-xs">
          <button
            type="button"
            class="text-text-muted hover:text-text disabled:text-text-dim disabled:opacity-60 font-mono"
            onClick={handleOneRepMaxCancel}
            disabled={!isOneRepMaxDirty()}
          >
            CANCEL
          </button>
          <button
            type="button"
            class="px-2 py-1 bg-border hover:bg-border-hover rounded-none font-bold font-mono disabled:opacity-60"
            onClick={handleOneRepMaxSave}
            disabled={!isOneRepMaxDirty()}
          >
            SAVE
          </button>
        </div>
      </div>
      <div class="p-3 space-y-2.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted font-mono uppercase">1RM</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-none border border-border text-text-dim hover:text-text hover:border-text"
              onClick={() => handleOneRepMaxAdjust(-2.5)}
            >
              -
            </button>
            <input
              type="number"
              step="any"
              inputmode="decimal"
              class="w-16 bg-bg border border-border rounded-none px-2 py-1 text-right text-sm font-medium font-mono focus:outline-none focus:border-text"
              value={draftOneRepMax()}
              onInput={handleOneRepMaxInput}
            />
            <button
              type="button"
              class="w-7 h-7 flex items-center justify-center rounded-none border border-border text-text-dim hover:text-text hover:border-text"
              onClick={() => handleOneRepMaxAdjust(2.5)}
            >
              +
            </button>
            <span class="text-text-dim w-6 text-xs font-mono">{props.unit}</span>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-text-muted font-mono">
          <span class="uppercase">Top set</span>
          <div class="flex items-center gap-3">
            <For each={topSetPreview()}>
              {(preview) => (
                <span class="text-text">
                  W{preview.week} {preview.weight ?? '—'}
                </span>
              )}
            </For>
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted font-mono uppercase">Template</span>
          <select
            class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
            value={props.lift.template || 'classic'}
            onChange={handleTemplateChange}
          >
            <For each={Object.values(TEMPLATES)}>
              {(t) => <option value={t.id}>{t.name}</option>}
            </For>
          </select>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-text-muted font-mono uppercase">Mobility</span>
          <select
            class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
            value={props.lift.mobilityProtocolId || ''}
            onChange={handleMobilityChange}
          >
            <option value="">None</option>
            <For each={Object.values(MOBILITY_PROTOCOLS)}>
              {(m) => <option value={m.id}>{m.name}</option>}
            </For>
          </select>
        </div>

        <Show when={showSupplPct()}>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted font-mono uppercase">Suppl. %</span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                inputmode="decimal"
                class="w-14 bg-bg border border-border rounded-none px-2 py-1 text-right text-xs font-mono focus:outline-none focus:border-text"
                value={props.lift.supplementalPercentage || 50}
                min="40"
                max="70"
                onChange={handleSupplPctChange}
              />
              <span class="text-text-dim text-xs">%</span>
            </div>
          </div>
        </Show>

        <Show when={hasSupplemental()}>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted font-mono uppercase">Suppl. Lift</span>
            <select
              class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
              value={props.lift.supplementalLiftId || ''}
              onChange={handleSupplementalLiftChange}
            >
              <option value="">Same lift</option>
              <For each={['squat', 'bench', 'deadlift', 'ohp'].filter(id => id !== props.liftId)}>
                {(id) => <option value={id}>{LIFT_LABELS[id]}</option>}
              </For>
            </select>
          </div>
        </Show>

        <Show when={accessoryTemplates().length > 0}>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-muted font-mono uppercase">Accessories</span>
            <select
              class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
              value={props.lift.accessoryTemplateId || ''}
              onChange={handleAccessoryTemplateChange}
            >
              <option value="">None</option>
              <For each={accessoryTemplates()}>
                {(t) => <option value={t.id}>{t.name}</option>}
              </For>
            </select>
          </div>
        </Show>
      </div>
    </div>
  )
}

/**
 * Parse exercise string "Name 3x10" into { name, sets, reps }
 */
function parseExercise(str) {
  const match = str.match(/^(.+?)\s+(\d+)\s*[x×]\s*(\d+)$/i)
  if (match) {
    return { name: match[1].trim(), sets: parseInt(match[2]), reps: parseInt(match[3]) }
  }
  // Default to 3x10 if no sets/reps specified
  return { name: str.trim(), sets: 3, reps: 10 }
}

/**
 * Format exercise object to string "Name 3x10"
 */
function formatExercise(exercise) {
  if (typeof exercise === 'string') return exercise
  return `${exercise.name} ${exercise.sets}x${exercise.reps}`
}

function BodyWeightInput() {
  const [weight, setWeight] = createSignal('')
  const [saved, setSaved] = createSignal(false)

  const latestWeight = () => getLatestBodyWeight()

  const handleSave = async () => {
    const value = parseFloat(weight())
    if (!value || value <= 0) return

    haptic()
    await addBodyWeight(value)
    setWeight('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <div class="p-3 space-y-2">
        <Show when={latestWeight()}>
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-text-muted uppercase">Current</span>
            <span>
              <span class="font-bold">{latestWeight().weight}</span>
              <span class="text-text-dim ml-1">{state.settings?.unit || 'lbs'}</span>
              <span class="text-text-dim text-[10px] ml-2">({formatDate(latestWeight().date)})</span>
            </span>
          </div>
        </Show>

        <div class="flex items-center gap-2">
          <input
            type="number"
            step="any"
            inputmode="decimal"
            class="flex-1 bg-bg border border-border rounded-none px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-text"
            placeholder={`Enter weight (${state.settings?.unit || 'lbs'})`}
            value={weight()}
            onInput={(e) => setWeight(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            class="px-3 py-1.5 bg-border hover:bg-border-hover rounded-none text-xs font-bold font-mono uppercase disabled:opacity-50"
            onClick={handleSave}
            disabled={!weight() || parseFloat(weight()) <= 0}
          >
            {saved() ? 'Saved!' : 'Log'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AccessoriesManager() {
  const [isAdding, setIsAdding] = createSignal(false)
  const [editingId, setEditingId] = createSignal(null)
  const [newName, setNewName] = createSignal('')
  const [newExercises, setNewExercises] = createSignal('')

  const templates = () => getAccessoryTemplates()

  const handleAdd = async () => {
    if (!newName().trim()) return
    haptic()

    const exercises = newExercises()
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .map(parseExercise)

    await createAccessoryTemplate(newName().trim(), exercises)
    setNewName('')
    setNewExercises('')
    setIsAdding(false)
  }

  const handleEdit = (template) => {
    setEditingId(template.id)
    setNewName(template.name)
    setNewExercises(template.exercises.map(formatExercise).join('\n'))
  }

  const handleSaveEdit = async () => {
    if (!newName().trim()) return
    haptic()

    const exercises = newExercises()
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .map(parseExercise)

    await updateAccessoryTemplate(editingId(), { name: newName().trim(), exercises })
    setEditingId(null)
    setNewName('')
    setNewExercises('')
  }

  const handleDelete = async (id) => {
    haptic()
    await deleteAccessoryTemplate(id)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setNewName('')
    setNewExercises('')
  }

  return (
    <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
      <Show when={templates().length === 0 && !isAdding()}>
        <div class="p-3 text-center text-text-dim text-xs font-mono">
          No accessory templates yet
        </div>
      </Show>

      <div class="divide-y divide-border">
        <For each={templates()}>
          {(template) => (
            <Show when={editingId() === template.id} fallback={
              <div class="p-3">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold font-mono uppercase">{template.name}</span>
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1 text-text-dim hover:text-text rounded-none"
                      onClick={() => handleEdit(template)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      class="p-1 text-text-dim hover:text-red-500 rounded-none"
                      onClick={() => handleDelete(template.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-[11px] text-text-dim space-y-0.5 font-mono">
                  <For each={template.exercises}>
                    {(ex) => <div>{formatExercise(ex)}</div>}
                  </For>
                </div>
              </div>
            }>
              {/* Edit mode */}
              <div class="p-3 space-y-2">
                <input
                  type="text"
                  class="w-full bg-bg border border-border rounded-none px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-text"
                  placeholder="Template name"
                  value={newName()}
                  onInput={(e) => setNewName(e.target.value)}
                />
                <textarea
                  class="w-full bg-bg border border-border rounded-none px-2 py-1.5 text-xs font-mono resize-none focus:outline-none focus:border-text"
                  rows="3"
                  placeholder="One per line, e.g.:&#10;Face Pulls 3x15&#10;Dips 3x10"
                  value={newExercises()}
                  onInput={(e) => setNewExercises(e.target.value)}
                />
                <div class="flex gap-2">
                  <button
                    class="flex-1 py-1.5 text-xs text-text-muted hover:text-text font-mono uppercase rounded-none border border-transparent hover:border-border"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    class="flex-1 py-1.5 bg-border hover:bg-border-hover rounded-none text-xs font-bold font-mono uppercase"
                    onClick={handleSaveEdit}
                  >
                    Save
                  </button>
                </div>
              </div>
            </Show>
          )}
        </For>
      </div>

      <Show when={isAdding()}>
        <div class="p-3 space-y-2 border-t border-border">
          <input
            type="text"
            class="w-full bg-bg border border-border rounded-none px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-text"
            placeholder="Template name"
            value={newName()}
            onInput={(e) => setNewName(e.target.value)}
            autofocus
          />
          <textarea
            class="w-full bg-bg border border-border rounded-none px-2 py-1.5 text-xs font-mono resize-none focus:outline-none focus:border-text"
            rows="3"
            placeholder="One per line, e.g.:&#10;Face Pulls 3x15&#10;Dips 3x10"
            value={newExercises()}
            onInput={(e) => setNewExercises(e.target.value)}
          />
          <div class="flex gap-2">
            <button
              class="flex-1 py-1.5 text-xs text-text-muted hover:text-text font-mono uppercase rounded-none border border-transparent hover:border-border"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              class="flex-1 py-1.5 bg-border hover:bg-border-hover rounded-none text-xs font-bold font-mono uppercase"
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isAdding() && !editingId()}>
        <button
          class="w-full p-3 text-xs text-text-muted hover:text-text hover:bg-bg-hover border-t border-border flex items-center justify-center gap-2 font-mono uppercase tracking-wider rounded-none transition-colors"
          onClick={() => setIsAdding(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Template
        </button>
      </Show>
    </div>
  )
}

export default function Settings() {
  const settings = () => state.settings
  const lifts = () => state.lifts

  const handleClose = () => {
    setShowSettings(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleTmChange = (e) => {
    updateSettings({ tmPercentage: parseInt(e.target.value, 10) })
  }

  const handleUnitChange = (unit) => {
    updateSettings({ unit })
  }

  const handleRoundingChange = (e) => {
    updateSettings({ roundingIncrement: parseFloat(e.target.value) })
  }

  const handleThemeChange = (theme) => {
    updateSettings({ theme })
  }

  const handleWarmupsChange = (e) => {
    updateSettings({ showWarmups: e.target.checked })
  }

  const handleWarmupPlatesChange = (e) => {
    updateSettings({ showWarmupPlates: e.target.checked })
  }

  const handlePlatesChange = (e) => {
    updateSettings({ showPlates: e.target.checked })
  }

  const handleTopSetBadgeChange = (e) => {
    updateSettings({ showTopSetBadge: e.target.checked })
  }

  const handleNextWeightJumpChange = (e) => {
    updateSettings({ showNextWeightJump: e.target.checked })
  }

  const handleBarWeightChange = (e) => {
    updateSettings({ barWeight: parseFloat(e.target.value) || 45 })
  }

  const handleDeloadSchemeChange = (e) => {
    updateSettings({ deloadScheme: e.target.value })
  }

  const handleJokerSetsToggle = (e) => {
    updateSettings({ jokerSetsEnabled: e.target.checked })
  }

  const handleExport = () => {
    haptic()
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `531-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    haptic()
    const text = await file.text()
    const result = await importData(text)

    if (result.success) {
      alert('Backup restored successfully!')
      handleClose()
    } else {
      alert(`Import failed: ${result.error}`)
    }

    // Reset the input so the same file can be selected again
    e.target.value = ''
  }

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      await reset()
      handleClose()
    }
  }

  const handleFinishCycle = async () => {
    if (confirm('Finish this cycle? This will increase your Training Maxes and reset to Week 1.')) {
      haptic()
      await finishCycle()
      handleClose()
    }
  }

  return (
    <Portal>
      <div class="fixed inset-0 z-50" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/50" />
        <div class="absolute inset-y-0 right-0 w-full max-w-md bg-bg border-l border-border overflow-y-auto">
          <div class="sticky top-0 z-10 bg-bg border-b border-border">
            <div class="flex items-center justify-between px-4 h-12">
              <h2 class="text-base font-bold font-mono uppercase tracking-wider">Settings</h2>
              <button class="p-2 -mr-2 text-text-muted hover:text-text rounded-none" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4 space-y-6">
            {/* Finish Cycle Action */}
            <Show when={state.currentWeek >= 3}>
              <button
                class="w-full py-3 bg-primary text-primary-content font-bold font-mono uppercase tracking-widest hover:opacity-90 transition-opacity border-b-4 border-black/20 active:border-b-0 active:translate-y-1"
                onClick={handleFinishCycle}
              >
                Finish Cycle & Increment TMs
              </button>
            </Show>

            {/* 1RM Quick View */}
            <section class="bg-bg-card border border-border rounded-none p-2.5 shadow-sm hover:border-text/30 transition-colors">
              <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h1m3 0H5m0 0V8m0 4v4m14-4h1m-3 0h2m0 0V8m0 4v4M8 12h8M8 12V7a1 1 0 011-1h1a1 1 0 011 1v5m-3 0v5a1 1 0 001 1h1a1 1 0 001-1v-5m5 0V7a1 1 0 00-1-1h-1a1 1 0 00-1 1v5m3 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-5" />
                </svg>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs font-mono">
                  <span><span class="text-text-muted">S:</span> <span class="font-bold">{lifts().squat?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">B:</span> <span class="font-bold">{lifts().bench?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">D:</span> <span class="font-bold">{lifts().deadlift?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">O:</span> <span class="font-bold">{lifts().ohp?.oneRepMax || '—'}</span></span>
                </div>
                <span class="text-text-dim text-[10px] ml-auto font-mono uppercase mr-2">{settings().unit}</span>
                <LLMExportDropdown />
              </div>
            </section>

            {/* Lifts Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Lifts</h3>
              <div class="space-y-3">
                <For each={['squat', 'bench', 'deadlift', 'ohp']}>
                  {(liftId) => (
                    <LiftSettingsCard
                      liftId={liftId}
                      lift={lifts()[liftId]}
                      tmPercentage={settings().tmPercentage}
                      roundingIncrement={settings().roundingIncrement}
                      unit={settings().unit}
                    />
                  )}
                </For>
              </div>
            </section>

            {/* Training Max Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Training Max</h3>
              <div class="bg-bg-card border border-border rounded-none p-3 hover:border-text/50 transition-colors">
                <label class="flex items-center justify-between">
                  <span class="font-mono uppercase text-xs">TM Percentage</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="range"
                      min="80"
                      max="95"
                      step="5"
                      value={settings().tmPercentage}
                      onInput={handleTmChange}
                      class="w-20 accent-current rounded-none"
                    />
                    <span class="w-10 text-right font-medium font-mono text-xs">{settings().tmPercentage}%</span>
                  </div>
                </label>
                <div class="mt-3 pt-3 border-t border-border">
                  <label class="flex items-center justify-between">
                    <span class="font-mono uppercase text-xs">Deload Protocol</span>
                    <select
                      class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
                      value={settings().deloadScheme}
                      onChange={handleDeloadSchemeChange}
                    >
                      <option value="standard">Standard</option>
                      <option value="high_intensity">7th Week</option>
                      <option value="volume_reduction">Volume Drop</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* Units Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Units</h3>
              <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
                <div class="flex border-b border-border">
                  <button
                    class={`flex-1 py-2 text-center font-mono uppercase text-xs ${settings().unit === 'lbs' ? 'bg-bg-hover font-bold text-text' : 'text-text-dim hover:text-text'}`}
                    onClick={() => handleUnitChange('lbs')}
                  >
                    lbs
                  </button>
                  <button
                    class={`flex-1 py-2 text-center font-mono uppercase text-xs ${settings().unit === 'kg' ? 'bg-bg-hover font-bold text-text' : 'text-text-dim hover:text-text'}`}
                    onClick={() => handleUnitChange('kg')}
                  >
                    kg
                  </button>
                </div>
                <div class="p-3">
                  <label class="flex items-center justify-between">
                    <span class="text-xs font-mono uppercase">Rounding</span>
                    <select
                      class="bg-bg border border-border rounded-none px-2 py-1 text-xs font-mono focus:outline-none focus:border-text"
                      value={settings().roundingIncrement}
                      onChange={handleRoundingChange}
                    >
                      <option value="5">5</option>
                      <option value="2.5">2.5</option>
                      <option value="1">1</option>
                    </select>
                  </label>
                </div>
              </div>
            </section>

            {/* Display Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Display</h3>
              <div class="bg-bg-card border border-border rounded-none overflow-hidden hover:border-text/50 transition-colors">
                <div class="p-3 border-b border-border">
                  <label class="flex items-center justify-between">
                    <span class="font-mono uppercase text-xs">Theme</span>
                    <div class="flex bg-bg border border-border rounded-none overflow-hidden">
                      <button
                        class={`px-2 py-1 text-[10px] font-mono uppercase ${settings().theme === 'system' ? 'bg-bg-hover font-bold' : 'text-text-dim hover:text-text'}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        Sys
                      </button>
                      <button
                        class={`px-2 py-1 text-[10px] font-mono uppercase ${settings().theme === 'dark' ? 'bg-bg-hover font-bold' : 'text-text-dim hover:text-text'}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        Dark
                      </button>
                      <button
                        class={`px-2 py-1 text-[10px] font-mono uppercase ${settings().theme === 'light' ? 'bg-bg-hover font-bold' : 'text-text-dim hover:text-text'}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        Light
                      </button>
                    </div>
                  </label>
                </div>
                <div class="p-3 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="font-mono uppercase text-xs group-hover:text-text transition-colors">Warm-ups</span>
                    <input
                      type="checkbox"
                      checked={settings().showWarmups}
                      onChange={handleWarmupsChange}
                      class="w-4 h-4 accent-current rounded-none cursor-pointer"
                    />
                  </label>
                </div>
                <Show when={settings().showWarmups}>
                  <div class="p-3 border-b border-border bg-bg-hover/30 ml-4">
                    <label class="flex items-center justify-between cursor-pointer group">
                      <span class="font-mono uppercase text-[10px] group-hover:text-text transition-colors">Warm-up plates</span>
                      <input
                        type="checkbox"
                        checked={settings()?.showWarmupPlates ?? true}
                        onChange={handleWarmupPlatesChange}
                        class="w-3.5 h-3.5 accent-current rounded-none cursor-pointer"
                      />
                    </label>
                  </div>
                </Show>
                <div class="p-3 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="font-mono uppercase text-xs group-hover:text-text transition-colors">Top set badge</span>
                    <input
                      type="checkbox"
                      checked={settings()?.showTopSetBadge ?? true}
                      onChange={handleTopSetBadgeChange}
                      class="w-4 h-4 accent-current rounded-none cursor-pointer"
                    />
                  </label>
                </div>
                <div class="p-3 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="font-mono uppercase text-xs group-hover:text-text transition-colors">Next jump</span>
                    <input
                      type="checkbox"
                      checked={settings()?.showNextWeightJump ?? true}
                      onChange={handleNextWeightJumpChange}
                      class="w-4 h-4 accent-current rounded-none cursor-pointer"
                    />
                  </label>
                </div>
                <div class="p-3 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <span class="font-mono uppercase text-xs group-hover:text-text transition-colors">Plate calc</span>
                    <input
                      type="checkbox"
                      checked={settings().showPlates}
                      onChange={handlePlatesChange}
                      class="w-4 h-4 accent-current rounded-none cursor-pointer"
                    />
                  </label>
                </div>
                <Show when={settings().showPlates}>
                  <div class="p-3 border-b border-border">
                    <label class="flex items-center justify-between">
                      <span class="text-xs font-mono uppercase">Bar weight</span>
                      <div class="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          inputmode="decimal"
                          class="w-16 bg-bg border border-border rounded-none px-2 py-1 text-right text-xs font-mono focus:outline-none focus:border-text"
                          value={settings().barWeight || (settings().unit === 'kg' ? 20 : 45)}
                          onChange={handleBarWeightChange}
                        />
                        <span class="text-text-dim text-xs w-6">{settings().unit}</span>
                      </div>
                    </label>
                  </div>
                </Show>
                <div class="p-3">
                  <label class="flex items-center justify-between cursor-pointer group">
                    <div class="flex flex-col">
                      <span class="font-mono uppercase text-xs group-hover:text-text transition-colors">Joker Sets</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings().jokerSetsEnabled}
                      onChange={handleJokerSetsToggle}
                      class="w-4 h-4 accent-current rounded-none cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Accessories Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Accessories</h3>
              <AccessoriesManager />
            </section>

            {/* Calculator Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Calculator Tools</h3>
              <CalculatorTools />
            </section>

            {/* Body Weight Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Body Weight</h3>
              <BodyWeightInput />
            </section>

            {/* Data Section */}
            <section>
              <h3 class="text-xs font-bold text-text-muted font-mono uppercase tracking-wider mb-3">Data</h3>
              <div class="bg-bg-card border border-border rounded-none overflow-hidden">
                <button
                  class="w-full p-3 flex items-center justify-between hover:bg-bg-hover"
                  onClick={handleExport}
                >
                  <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span class="text-sm">Export Backup</span>
                  </div>
                </button>
                <div class="border-t border-border">
                  <label class="w-full p-3 flex items-center justify-between hover:bg-bg-hover cursor-pointer">
                    <div class="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span class="text-sm">Import Backup</span>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      class="hidden"
                      onChange={handleImport}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Reset Section */}
            <section class="pt-4 border-t border-border">
              <button
                class="w-full py-3 text-center text-red-500 hover:text-red-400"
                onClick={handleReset}
              >
                Reset All Data
              </button>
            </section>
          </div>
        </div>
      </div>
    </Portal>
  )
}
