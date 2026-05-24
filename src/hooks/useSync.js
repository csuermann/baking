import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

const WORKER_URL = import.meta.env.VITE_WORKER_URL

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

function safeJson(key) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : null
  } catch {
    return null
  }
}

function collectLocalStorage() {
  const progress = {}
  const history = {}

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('baking-progress-')) {
      progress[key.replace('baking-progress-', '')] = safeJson(key)
    } else if (key?.startsWith('baking-history-')) {
      history[key.replace('baking-history-', '')] = safeJson(key)
    }
  }

  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    prefs: safeJson('baking-prefs'),
    progress,
    history,
    customRecipes: safeJson('baking-custom-recipes') ?? {},
  }
}

function hydrateLocalStorage(data) {
  if (data.prefs) {
    localStorage.setItem('baking-prefs', JSON.stringify(data.prefs))
  }
  for (const [slug, p] of Object.entries(data.progress ?? {})) {
    if (p) localStorage.setItem(`baking-progress-${slug}`, JSON.stringify(p))
  }
  for (const [slug, h] of Object.entries(data.history ?? {})) {
    if (h) localStorage.setItem(`baking-history-${slug}`, JSON.stringify(h))
  }
  if (data.customRecipes) {
    localStorage.setItem('baking-custom-recipes', JSON.stringify(data.customRecipes))
  }
  // Notify all mounted useLocalStorage hooks to re-read their values
  window.dispatchEvent(new CustomEvent('baking-hydrated'))
}

// ---------------------------------------------------------------------------
// Module-level push scheduler
// Exported so any component can call scheduleSync() without prop drilling.
// ---------------------------------------------------------------------------

let _getToken = null
let _pushTimer = null

export function scheduleSync() {
  if (!_getToken) return
  clearTimeout(_pushTimer)
  _pushTimer = setTimeout(async () => {
    try {
      const token = await _getToken()
      await fetch(`${WORKER_URL}/sync`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectLocalStorage()),
      })
    } catch (e) {
      console.error('[sync] push failed:', e)
    }
  }, 2000)
}

// ---------------------------------------------------------------------------
// useSync — mount once in AppShell to pull on login and wire up getToken
// ---------------------------------------------------------------------------

export function useSync() {
  const { getToken, userId } = useAuth()

  // Register getToken so scheduleSync() can use it from anywhere
  useEffect(() => {
    _getToken = getToken
    return () => { _getToken = null }
  }, [getToken])

  // Pull remote state on sign-in and hydrate localStorage
  useEffect(() => {
    if (!userId || !WORKER_URL) return
    ;(async () => {
      try {
        const token = await getToken()
        const res = await fetch(`${WORKER_URL}/sync`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data) hydrateLocalStorage(data)
        }
      } catch (e) {
        console.error('[sync] pull failed:', e)
      }
    })()
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
}
