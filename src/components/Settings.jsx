/**
 * Settings Component - Settings slide-in panel
 */

import { For, Show, createSignal } from 'solid-js'
import { Portal } from 'solid-js/web'
import {
  state,
  setShowSettings,
  updateSettings,
  updateLift,
  updateLiftSettings,
  reset,
  getAccessoryTemplates,
  createAccessoryTemplate,
  updateAccessoryTemplate,
  deleteAccessoryTemplate,
  setActiveTemplate,
  TEMPLATES
} from '../store.js'
import { haptic } from '../hooks/useMobile.js'

const LIFT_LABELS = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
  ohp: 'Overhead Press'
}

function LiftSettingsCard(props) {
  const template = () => TEMPLATES[props.lift.template || 'classic']
  const showSupplPct = () => {
    const t = template()
    return t && t.hasSupplemental && !t.usesFirstSetPercentage && !t.usesSecondSetPercentage
  }

  const handleOneRepMaxChange = (e) => {
    const value = parseFloat(e.target.value) || 0
    updateLift(props.liftId, value)
  }

  const handleTemplateChange = (e) => {
    updateLiftSettings(props.liftId, { template: e.target.value })
  }

  const handleSupplPctChange = (e) => {
    const value = parseInt(e.target.value, 10) || 50
    updateLiftSettings(props.liftId, { supplementalPercentage: value })
  }

  return (
    <div class="bg-bg-card border border-border rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-border">
        <span class="font-medium">{LIFT_LABELS[props.liftId]}</span>
      </div>
      <div class="p-4 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-text-muted">1RM</span>
          <div class="flex items-center gap-2">
            <input
              type="number"
              step="any"
              inputmode="decimal"
              class="w-20 bg-bg border border-border rounded px-3 py-1.5 text-right font-medium focus:outline-none focus:border-border-hover"
              value={props.lift.oneRepMax || ''}
              onChange={handleOneRepMaxChange}
            />
            <span class="text-text-dim w-8">{props.unit}</span>
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
  const activeId = () => state.activeTemplateId

  const handleAdd = async () => {
    if (!newName().trim()) return
    haptic()
    
    const exercises = newExercises()
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0)
    
    await createAccessoryTemplate(newName().trim(), exercises)
    setNewName('')
    setNewExercises('')
    setIsAdding(false)
  }

  const handleEdit = (template) => {
    setEditingId(template.id)
    setNewName(template.name)
    setNewExercises(template.exercises.join('\n'))
  }

  const handleSaveEdit = async () => {
    if (!newName().trim()) return
    haptic()
    
    const exercises = newExercises()
      .split('\n')
      .map(e => e.trim())
      .filter(e => e.length > 0)
    
    await updateAccessoryTemplate(editingId(), { name: newName().trim(), exercises })
    setEditingId(null)
    setNewName('')
    setNewExercises('')
  }

  const handleDelete = async (id) => {
    haptic()
    await deleteAccessoryTemplate(id)
  }

  const handleSetActive = async (id) => {
    haptic()
    await setActiveTemplate(activeId() === id ? null : id)
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
                  <button
                    class="flex items-center gap-2"
                    onClick={() => handleSetActive(template.id)}
                  >
                    <div class={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      activeId() === template.id ? 'border-text' : 'border-border-hover'
                    }`}>
                      <Show when={activeId() === template.id}>
                        <div class="w-2 h-2 rounded-full bg-text" />
                      </Show>
                    </div>
                    <span class="font-medium">{template.name}</span>
                  </button>
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
                <div class="text-sm text-text-dim">
                  {template.exercises.length} exercises
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
                  placeholder="Exercises (one per line)"
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
            placeholder="Exercises (one per line)"
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

  const handleBarWeightChange = (e) => {
    updateSettings({ barWeight: parseFloat(e.target.value) || 45 })
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
