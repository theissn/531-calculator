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
  TEMPLATES
} from '../store.js'
import { calculateTM, calculateWeight, WEEK_SCHEMES } from '../calculator.js'
import { haptic } from '../hooks/useMobile.js'

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

  return (
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <span class="font-medium">{LIFT_LABELS[props.liftId]}</span>
        <div class="flex items-center gap-2 text-sm">
          <button
            type="button"
            class="text-text-muted hover:text-text disabled:text-text-dim disabled:opacity-60"
            onClick={handleOneRepMaxCancel}
            disabled={!isOneRepMaxDirty()}
          >
            Cancel
          </button>
          <button
            type="button"
            class="px-2 py-1 bg-border hover:bg-border-hover rounded text-xs font-medium disabled:opacity-60"
            onClick={handleOneRepMaxSave}
            disabled={!isOneRepMaxDirty()}
          >
            Save
          </button>
        </div>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">1RM</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded border border-border text-text-dim hover:text-text hover:border-border-hover"
              onClick={() => handleOneRepMaxAdjust(-2.5)}
            >
              -
            </button>
            <input
              type="number"
              step="any"
              inputmode="decimal"
              class="w-20 bg-bg border border-border rounded px-3 py-1.5 text-right font-medium focus:outline-none focus:border-border-hover"
              value={draftOneRepMax()}
              onInput={handleOneRepMaxInput}
            />
            <button
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded border border-border text-text-dim hover:text-text hover:border-border-hover"
              onClick={() => handleOneRepMaxAdjust(2.5)}
            >
              +
            </button>
            <span class="text-text-dim w-8">{props.unit}</span>
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-text-muted">
          <span>Top set</span>
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
          <span class="text-sm text-text-muted">Template</span>
          <select
            class="bg-bg border border-border rounded px-3 py-1.5 text-sm"
            value={props.lift.template || 'classic'}
            onChange={handleTemplateChange}
          >
            <For each={Object.values(TEMPLATES)}>
              {(t) => <option value={t.id}>{t.name}</option>}
            </For>
          </select>
        </div>

        <Show when={showSupplPct()}>
          <div class="flex items-center justify-between">
            <span class="text-sm text-text-muted">Suppl. %</span>
            <div class="flex items-center gap-1">
              <input
                type="number"
                inputmode="decimal"
                class="w-16 bg-bg border border-border rounded px-2 py-1.5 text-right text-sm focus:outline-none focus:border-border-hover"
                value={props.lift.supplementalPercentage || 50}
                min="40"
                max="70"
                onChange={handleSupplPctChange}
              />
              <span class="text-text-dim text-sm">%</span>
            </div>
          </div>
        </Show>

        <Show when={hasSupplemental()}>
          <div class="flex items-center justify-between">
            <span class="text-sm text-text-muted">Suppl. Lift</span>
            <select
              class="bg-bg border border-border rounded px-3 py-1.5 text-sm"
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
            <span class="text-sm text-text-muted">Accessories</span>
            <select
              class="bg-bg border border-border rounded px-3 py-1.5 text-sm"
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
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <Show when={templates().length === 0 && !isAdding()}>
        <div class="p-4 text-center text-text-dim text-sm">
          No accessory templates yet
        </div>
      </Show>

      <div class="divide-y divide-border">
        <For each={templates()}>
          {(template) => (
            <Show when={editingId() === template.id} fallback={
              <div class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium">{template.name}</span>
                  <div class="flex items-center gap-2">
                    <button
                      class="p-1 text-text-dim hover:text-text"
                      onClick={() => handleEdit(template)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      class="p-1 text-text-dim hover:text-red-500"
                      onClick={() => handleDelete(template.id)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div class="text-sm text-text-dim space-y-0.5">
                  <For each={template.exercises}>
                    {(ex) => <div>{formatExercise(ex)}</div>}
                  </For>
                </div>
              </div>
            }>
              {/* Edit mode */}
              <div class="p-4 space-y-3">
                <input
                  type="text"
                  class="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-border-hover"
                  placeholder="Template name"
                  value={newName()}
                  onInput={(e) => setNewName(e.target.value)}
                />
                <textarea
                  class="w-full bg-bg border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-border-hover"
                  rows="4"
                  placeholder="One per line, e.g.:&#10;Face Pulls 3x15&#10;Dips 3x10"
                  value={newExercises()}
                  onInput={(e) => setNewExercises(e.target.value)}
                />
                <div class="flex gap-2">
                  <button
                    class="flex-1 py-2 text-sm text-text-muted hover:text-text"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    class="flex-1 py-2 bg-border hover:bg-border-hover rounded text-sm font-medium"
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
        <div class="p-4 space-y-3 border-t border-border">
          <input
            type="text"
            class="w-full bg-bg border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-border-hover"
            placeholder="Template name"
            value={newName()}
            onInput={(e) => setNewName(e.target.value)}
            autofocus
          />
          <textarea
            class="w-full bg-bg border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:border-border-hover"
            rows="4"
            placeholder="One per line, e.g.:&#10;Face Pulls 3x15&#10;Dips 3x10"
            value={newExercises()}
            onInput={(e) => setNewExercises(e.target.value)}
          />
          <div class="flex gap-2">
            <button
              class="flex-1 py-2 text-sm text-text-muted hover:text-text"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              class="flex-1 py-2 bg-border hover:bg-border-hover rounded text-sm font-medium"
              onClick={handleAdd}
            >
              Add
            </button>
          </div>
        </div>
      </Show>

      <Show when={!isAdding() && !editingId()}>
        <button
          class="w-full p-4 text-sm text-text-muted hover:text-text hover:bg-bg-hover border-t border-border flex items-center justify-center gap-2"
          onClick={() => setIsAdding(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
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

  return (
    <Portal>
      <div class="fixed inset-0 z-50" onClick={handleBackdropClick}>
        <div class="absolute inset-0 bg-black/50" />
        <div class="absolute inset-y-0 right-0 w-full max-w-md bg-bg border-l border-border overflow-y-auto">
          <div class="sticky top-0 z-10 bg-bg border-b border-border">
            <div class="flex items-center justify-between px-4 h-14">
              <h2 class="text-lg font-semibold">Settings</h2>
              <button class="p-2 -mr-2 text-text-muted hover:text-text" onClick={handleClose}>
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div class="p-4 space-y-8">
            {/* 1RM Quick View */}
            <section class="bg-bg-card border border-border rounded-lg p-3">
              <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 12h1m3 0H5m0 0V8m0 4v4m14-4h1m-3 0h2m0 0V8m0 4v4M8 12h8M8 12V7a1 1 0 011-1h1a1 1 0 011 1v5m-3 0v5a1 1 0 001 1h1a1 1 0 001-1v-5m5 0V7a1 1 0 00-1-1h-1a1 1 0 00-1 1v5m3 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-5" />
                </svg>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span><span class="text-text-muted">S:</span> <span class="font-medium">{lifts().squat?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">B:</span> <span class="font-medium">{lifts().bench?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">D:</span> <span class="font-medium">{lifts().deadlift?.oneRepMax || '—'}</span></span>
                  <span><span class="text-text-muted">O:</span> <span class="font-medium">{lifts().ohp?.oneRepMax || '—'}</span></span>
                </div>
                <span class="text-text-dim text-sm ml-auto">{settings().unit}</span>
              </div>
            </section>

            {/* Lifts Section */}
            <section>
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Lifts</h3>
              <div class="space-y-4">
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
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Training Max</h3>
              <div class="bg-bg-card border border-border rounded-lg p-4">
                <label class="flex items-center justify-between">
                  <span>TM Percentage</span>
                  <div class="flex items-center gap-2">
                    <input
                      type="range"
                      min="80"
                      max="95"
                      step="5"
                      value={settings().tmPercentage}
                      onInput={handleTmChange}
                      class="w-24 accent-current"
                    />
                    <span class="w-12 text-right font-medium">{settings().tmPercentage}%</span>
                  </div>
                </label>
              </div>
            </section>

            {/* Units Section */}
            <section>
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Units</h3>
              <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
                <div class="flex border-b border-border">
                  <button
                    class={`flex-1 py-3 text-center ${settings().unit === 'lbs' ? 'bg-bg-hover font-medium' : 'text-text-dim'}`}
                    onClick={() => handleUnitChange('lbs')}
                  >
                    lbs
                  </button>
                  <button
                    class={`flex-1 py-3 text-center ${settings().unit === 'kg' ? 'bg-bg-hover font-medium' : 'text-text-dim'}`}
                    onClick={() => handleUnitChange('kg')}
                  >
                    kg
                  </button>
                </div>
                <div class="p-4">
                  <label class="flex items-center justify-between">
                    <span class="text-sm">Rounding increment</span>
                    <select
                      class="bg-bg border border-border rounded px-3 py-1.5 text-sm"
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
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Display</h3>
              <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
                <div class="p-4 border-b border-border">
                  <label class="flex items-center justify-between">
                    <span>Theme</span>
                    <div class="flex bg-bg border border-border rounded overflow-hidden">
                      <button
                        class={`px-3 py-1.5 text-sm ${settings().theme === 'system' ? 'bg-bg-hover font-medium' : 'text-text-dim'}`}
                        onClick={() => handleThemeChange('system')}
                      >
                        System
                      </button>
                      <button
                        class={`px-3 py-1.5 text-sm ${settings().theme === 'dark' ? 'bg-bg-hover font-medium' : 'text-text-dim'}`}
                        onClick={() => handleThemeChange('dark')}
                      >
                        Dark
                      </button>
                      <button
                        class={`px-3 py-1.5 text-sm ${settings().theme === 'light' ? 'bg-bg-hover font-medium' : 'text-text-dim'}`}
                        onClick={() => handleThemeChange('light')}
                      >
                        Light
                      </button>
                    </div>
                  </label>
                </div>
                <div class="p-4 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span>Show warm-up sets</span>
                    <input
                      type="checkbox"
                      checked={settings().showWarmups}
                      onChange={handleWarmupsChange}
                      class="w-5 h-5 accent-current"
                    />
                  </label>
                </div>
                <div class="p-4 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span>Highlight top set</span>
                    <input
                      type="checkbox"
                      checked={settings()?.showTopSetBadge ?? true}
                      onChange={handleTopSetBadgeChange}
                      class="w-5 h-5 accent-current"
                    />
                  </label>
                </div>
                <div class="p-4 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span>Show next set jump</span>
                    <input
                      type="checkbox"
                      checked={settings()?.showNextWeightJump ?? true}
                      onChange={handleNextWeightJumpChange}
                      class="w-5 h-5 accent-current"
                    />
                  </label>
                </div>
                <div class="p-4 border-b border-border">
                  <label class="flex items-center justify-between cursor-pointer">
                    <span>Show plate calculator</span>
                    <input
                      type="checkbox"
                      checked={settings().showPlates}
                      onChange={handlePlatesChange}
                      class="w-5 h-5 accent-current"
                    />
                  </label>
                </div>
                <Show when={settings().showPlates}>
                  <div class="p-4">
                    <label class="flex items-center justify-between">
                      <span class="text-sm">Bar weight</span>
                      <div class="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          inputmode="decimal"
                          class="w-20 bg-bg border border-border rounded px-3 py-1.5 text-right text-sm focus:outline-none focus:border-border-hover"
                          value={settings().barWeight || (settings().unit === 'kg' ? 20 : 45)}
                          onChange={handleBarWeightChange}
                        />
                        <span class="text-text-dim text-sm w-8">{settings().unit}</span>
                      </div>
                    </label>
                  </div>
                </Show>
              </div>
            </section>

            {/* Accessories Section */}
            <section>
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Accessories</h3>
              <AccessoriesManager />
            </section>

            {/* Data Section */}
            <section>
              <h3 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Data</h3>
              <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
                <button
                  class="w-full p-4 flex items-center justify-between hover:bg-bg-hover"
                  onClick={handleExport}
                >
                  <div class="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Export Backup</span>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <div class="border-t border-border">
                  <label class="w-full p-4 flex items-center justify-between hover:bg-bg-hover cursor-pointer">
                    <div class="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span>Import Backup</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
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
