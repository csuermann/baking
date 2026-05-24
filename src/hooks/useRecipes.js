import { useState, useEffect } from 'react'
import { recipes as builtInRecipes } from '../utils/parseRecipes'
import { parseRecipeMarkdown } from '../utils/parseRecipeMarkdown'

function loadCustomRecipes() {
  try {
    const raw = localStorage.getItem('baking-custom-recipes')
    if (!raw) return []
    const map = JSON.parse(raw) // { [slug]: { markdown, createdAt, updatedAt } }
    return Object.entries(map).map(([slug, entry]) => {
      try {
        const recipe = parseRecipeMarkdown(entry.markdown)
        return { ...recipe, slug, lang: 'custom', isCustom: true }
      } catch {
        return null
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}

export function useRecipes() {
  const [customRecipes, setCustomRecipes] = useState(() => loadCustomRecipes())

  // Re-read when the sync layer hydrates localStorage
  useEffect(() => {
    const handler = () => setCustomRecipes(loadCustomRecipes())
    window.addEventListener('baking-hydrated', handler)
    window.addEventListener('baking-custom-recipes-changed', handler)
    return () => {
      window.removeEventListener('baking-hydrated', handler)
      window.removeEventListener('baking-custom-recipes-changed', handler)
    }
  }, [])

  const all = [...builtInRecipes, ...customRecipes]
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))

  return all
}

// ---------------------------------------------------------------------------
// Helpers for saving / deleting custom recipes (called from the editor)
// ---------------------------------------------------------------------------

export function saveCustomRecipe(slug, markdown) {
  try {
    const raw = localStorage.getItem('baking-custom-recipes')
    const map = raw ? JSON.parse(raw) : {}
    const existing = map[slug]
    map[slug] = {
      markdown,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
    localStorage.setItem('baking-custom-recipes', JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('baking-custom-recipes-changed'))
  } catch (e) {
    console.error('Failed to save custom recipe:', e)
    throw e
  }
}

export function deleteCustomRecipe(slug) {
  try {
    const raw = localStorage.getItem('baking-custom-recipes')
    if (!raw) return
    const map = JSON.parse(raw)
    delete map[slug]
    localStorage.setItem('baking-custom-recipes', JSON.stringify(map))
    window.dispatchEvent(new CustomEvent('baking-custom-recipes-changed'))
  } catch (e) {
    console.error('Failed to delete custom recipe:', e)
  }
}

export function generateCustomSlug() {
  // Simple collision-safe slug: custom- + 8 random alphanumeric chars
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length]).join('')
  return `custom-${rand}`
}
