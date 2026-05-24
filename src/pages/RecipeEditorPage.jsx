import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { parseRecipeMarkdown, serializeRecipeToMarkdown } from '../utils/parseRecipeMarkdown'
import { saveCustomRecipe, deleteCustomRecipe, generateCustomSlug } from '../hooks/useRecipes'
import { scheduleSync } from '../hooks/useSync'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyStep() {
  return { title: '', durationMin: 30, durationMax: 30, isVariable: false, body: '' }
}

function emptyIngredient() {
  return { name: '', percent: '', is_water: false }
}

function recipeToFormState(recipe) {
  return {
    title: recipe.title || '',
    description: recipe.description || '',
    targetDoughTemp: recipe.targetDoughTemp ?? 25,
    flourBaseG: recipe.flourBaseG ?? 500,
    kneadDurationMin: recipe.kneadDurationMin ?? 10,
    defaultQuantity: recipe.defaultQuantity ?? 1,
    intro: recipe.intro || '',
    ingredients: recipe.ingredients?.length
      ? recipe.ingredients.map(ing =>
          ing.group ? { group: ing.group } : { name: ing.name || '', percent: String(ing.percent ?? ''), is_water: !!ing.is_water }
        )
      : [emptyIngredient()],
    steps: recipe.steps?.length
      ? recipe.steps.map(s => ({ title: s.title || '', durationMin: s.durationMin ?? 0, durationMax: s.durationMax ?? s.durationMin ?? 0, isVariable: s.isVariable ?? false, body: s.body || '' }))
      : [emptyStep()],
  }
}

function formStateToRecipe(form) {
  return {
    title: form.title,
    description: form.description,
    targetDoughTemp: Number(form.targetDoughTemp),
    flourBaseG: Number(form.flourBaseG),
    kneadDurationMin: Number(form.kneadDurationMin),
    defaultQuantity: Number(form.defaultQuantity),
    intro: form.intro,
    ingredients: form.ingredients,
    steps: form.steps.map(s => ({
      ...s,
      durationMin: Number(s.durationMin),
      durationMax: s.isVariable ? Number(s.durationMax) : Number(s.durationMin),
    })),
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Label({ children }) {
  return <label className="block text-xs font-medium text-stone-400 mb-1">{children}</label>
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 ${className}`}
      {...props}
    />
  )
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono resize-y ${className}`}
      {...props}
    />
  )
}

function SectionHeader({ children }) {
  return <h2 className="text-lg font-semibold text-stone-200 mb-4 mt-8 first:mt-0">{children}</h2>
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RecipeEditorPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isNew = !slug || slug === 'new'

  // Load existing recipe for edit mode
  const [form, setForm] = useState(() => {
    if (isNew) {
      return recipeToFormState({})
    }
    try {
      const raw = localStorage.getItem('baking-custom-recipes')
      if (!raw) return recipeToFormState({})
      const map = JSON.parse(raw)
      const entry = map[slug]
      if (!entry) return recipeToFormState({})
      return recipeToFormState(parseRecipeMarkdown(entry.markdown))
    } catch {
      return recipeToFormState({})
    }
  })

  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  const setField = (field, value) =>
    setForm(f => ({ ...f, [field]: value }))

  // Ingredients
  const setIngredient = (i, patch) =>
    setForm(f => {
      const ingredients = f.ingredients.map((ing, idx) => idx === i ? { ...ing, ...patch } : ing)
      return { ...f, ingredients }
    })
  const addIngredient = () =>
    setForm(f => ({ ...f, ingredients: [...f.ingredients, emptyIngredient()] }))
  const removeIngredient = i =>
    setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }))

  // Steps
  const setStep = (i, patch) =>
    setForm(f => {
      const steps = f.steps.map((s, idx) => idx === i ? { ...s, ...patch } : s)
      return { ...f, steps }
    })
  const addStep = () =>
    setForm(f => ({ ...f, steps: [...f.steps, emptyStep()] }))
  const removeStep = i =>
    setForm(f => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }))
  const moveStep = (i, dir) =>
    setForm(f => {
      const steps = [...f.steps]
      const j = i + dir
      if (j < 0 || j >= steps.length) return f;
      [steps[i], steps[j]] = [steps[j], steps[i]]
      return { ...f, steps }
    })

  // ---------------------------------------------------------------------------
  // Save / delete
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const targetSlug = isNew ? generateCustomSlug() : slug
      const markdown = serializeRecipeToMarkdown(formStateToRecipe(form))
      saveCustomRecipe(targetSlug, markdown)
      scheduleSync()
      navigate(`/recipe/${targetSlug}`)
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }, [form, isNew, slug, navigate])

  const handleDelete = useCallback(() => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    deleteCustomRecipe(slug)
    scheduleSync()
    navigate('/')
  }, [confirmDelete, slug, navigate])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-stone-100">
          {isNew ? 'New recipe' : 'Edit recipe'}
        </h1>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button
              onClick={handleDelete}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-stone-400 hover:text-red-400'
              }`}
            >
              {confirmDelete ? 'Confirm delete' : 'Delete'}
            </button>
          )}
          <Link to={isNew ? '/' : `/recipe/${slug}`} className="text-sm text-stone-400 hover:text-stone-200">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* ── Meta ── */}
      <SectionHeader>Details</SectionHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Title *</Label>
          <Input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="My sourdough" />
        </div>
        <div className="sm:col-span-2">
          <Label>Short description</Label>
          <Input value={form.description} onChange={e => setField('description', e.target.value)} placeholder="A crispy country loaf…" />
        </div>
        <div>
          <Label>Target dough temp (°C)</Label>
          <Input type="number" value={form.targetDoughTemp} onChange={e => setField('targetDoughTemp', e.target.value)} />
        </div>
        <div>
          <Label>Flour base (g)</Label>
          <Input type="number" value={form.flourBaseG} onChange={e => setField('flourBaseG', e.target.value)} />
        </div>
        <div>
          <Label>Knead duration (min)</Label>
          <Input type="number" value={form.kneadDurationMin} onChange={e => setField('kneadDurationMin', e.target.value)} />
        </div>
        <div>
          <Label>Default quantity (loaves)</Label>
          <Input type="number" min="1" value={form.defaultQuantity} onChange={e => setField('defaultQuantity', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label>Introduction (markdown)</Label>
          <Textarea rows={3} value={form.intro} onChange={e => setField('intro', e.target.value)} placeholder="Optional intro text shown above the recipe…" />
        </div>
      </div>

      {/* ── Ingredients ── */}
      <SectionHeader>Ingredients</SectionHeader>
      <p className="text-xs text-stone-500 mb-4">Amounts are expressed as baker's percentages relative to flour base.</p>
      <div className="space-y-2">
        {form.ingredients.map((ing, i) => (
          <div key={i}>
            {ing.group !== undefined ? (
              <div className="flex gap-2 items-center">
                <Input
                  value={ing.group}
                  onChange={e => setIngredient(i, { group: e.target.value })}
                  placeholder="Group name"
                  className="flex-1 text-amber-400 font-medium"
                />
                <button onClick={() => removeIngredient(i)} className="text-stone-500 hover:text-red-400 px-2">✕</button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Input value={ing.name} onChange={e => setIngredient(i, { name: e.target.value })} placeholder="Ingredient name" className="flex-1" />
                <Input type="number" step="0.01" value={ing.percent} onChange={e => setIngredient(i, { percent: e.target.value })} placeholder="%" className="w-20 text-center" />
                <label className="flex items-center gap-1 text-xs text-stone-400 whitespace-nowrap">
                  <input type="checkbox" checked={!!ing.is_water} onChange={e => setIngredient(i, { is_water: e.target.checked })} className="accent-amber-500" />
                  water
                </label>
                <button onClick={() => removeIngredient(i)} className="text-stone-500 hover:text-red-400 px-2">✕</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={addIngredient} className="text-xs text-stone-400 hover:text-amber-400 border border-stone-700 rounded-lg px-3 py-1.5 transition-colors">
          + Ingredient
        </button>
        <button onClick={() => setForm(f => ({ ...f, ingredients: [...f.ingredients, { group: '' }] }))} className="text-xs text-stone-400 hover:text-amber-400 border border-stone-700 rounded-lg px-3 py-1.5 transition-colors">
          + Group header
        </button>
      </div>

      {/* ── Steps ── */}
      <SectionHeader>Steps</SectionHeader>
      <div className="space-y-6">
        {form.steps.map((step, i) => (
          <div key={i} className="border border-stone-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-stone-500 font-medium w-5">{i + 1}</span>
              <Input value={step.title} onChange={e => setStep(i, { title: e.target.value })} placeholder="Step title" className="flex-1" />
              <div className="flex gap-1">
                <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="text-stone-500 hover:text-stone-200 disabled:opacity-20 px-1">↑</button>
                <button onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} className="text-stone-500 hover:text-stone-200 disabled:opacity-20 px-1">↓</button>
                <button onClick={() => removeStep(i)} className="text-stone-500 hover:text-red-400 px-1">✕</button>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 mb-3">
              <div>
                <Label>Duration (min)</Label>
                <Input type="number" min="0" value={step.durationMin} onChange={e => setStep(i, { durationMin: e.target.value, ...(!step.isVariable && { durationMax: e.target.value }) })} className="w-24" />
              </div>
              <label className="flex items-center gap-1 text-xs text-stone-400 mt-4">
                <input type="checkbox" checked={step.isVariable} onChange={e => setStep(i, { isVariable: e.target.checked })} className="accent-amber-500" />
                variable
              </label>
              {step.isVariable && (
                <div>
                  <Label>Max (min)</Label>
                  <Input type="number" min={step.durationMin} value={step.durationMax} onChange={e => setStep(i, { durationMax: e.target.value })} className="w-24" />
                </div>
              )}
            </div>

            <Label>Instructions (markdown)</Label>
            <Textarea rows={4} value={step.body} onChange={e => setStep(i, { body: e.target.value })} placeholder="Describe what to do…" />
          </div>
        ))}
      </div>
      <button onClick={addStep} className="mt-4 w-full py-2 border border-dashed border-stone-700 rounded-xl text-sm text-stone-400 hover:text-amber-400 hover:border-amber-500 transition-colors">
        + Add step
      </button>
    </div>
  )
}
