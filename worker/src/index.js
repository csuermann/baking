/**
 * Baking Assistant sync Worker
 *
 * Endpoints:
 *   GET  /sync          → return user blob  (Clerk JWT required)
 *   PUT  /sync          → replace user blob (Clerk JWT required)
 *   GET  /recipe/:id    → return shared recipe (public)
 *   PUT  /recipe/:id    → publish shared recipe (Clerk JWT required)
 *
 * KV keys:
 *   user:{clerkUserId}  → JSON blob
 *   recipe:{id}         → { markdown, authorId, createdAt }
 */

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

function getAllowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || ''
  const allowed = getAllowedOrigins(env)
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0] ?? '*'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extra },
  })
}

// ---------------------------------------------------------------------------
// Clerk JWT verification via JWKS
// ---------------------------------------------------------------------------

let jwksCache = null
let jwksCachedAt = 0
const JWKS_TTL_MS = 60 * 60 * 1000 // 1 hour

async function getJwks(publishableKey) {
  // Derive JWKS URL from publishable key: pk_live_xxx → xxx is base64(frontend-api-host)
  // Clerk JWKS URL: https://<frontend-api>/.well-known/jwks.json
  const now = Date.now()
  if (jwksCache && now - jwksCachedAt < JWKS_TTL_MS) return jwksCache

  // Extract the instance from the publishable key
  // pk_live_<base64url(frontend_api)> or pk_test_<base64url(frontend_api)>
  const parts = publishableKey.split('_')
  if (parts.length < 3) throw new Error('Invalid publishable key format')
  const encoded = parts[2]
  // base64url decode
  const decoded = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'))
  // decoded looks like "clerk.your-instance.clerk.accounts.dev$"
  const frontendApi = decoded.replace(/\$$/, '')

  const res = await fetch(`https://${frontendApi}/.well-known/jwks.json`)
  if (!res.ok) throw new Error('Failed to fetch JWKS')
  jwksCache = await res.json()
  jwksCachedAt = now
  return jwksCache
}

async function importJwkKey(jwk) {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
}

function base64urlDecode(str) {
  const padded = str + '=='.slice(0, (4 - (str.length % 4)) % 4)
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
}

async function verifyClerkJwt(token, env) {
  const [headerB64, payloadB64, sigB64] = token.split('.')
  if (!headerB64 || !payloadB64 || !sigB64) throw new Error('Malformed JWT')

  const header = JSON.parse(base64urlDecode(headerB64))
  const payload = JSON.parse(base64urlDecode(payloadB64))

  // Check expiry
  if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('JWT expired')

  // Find matching key in JWKS
  const jwks = await getJwks(env.CLERK_PUBLISHABLE_KEY)
  const jwk = jwks.keys.find(k => k.kid === header.kid)
  if (!jwk) throw new Error('No matching JWK found')

  const key = await importJwkKey(jwk)

  // Verify signature
  const encoder = new TextEncoder()
  const data = encoder.encode(`${headerB64}.${payloadB64}`)
  const sig = Uint8Array.from(base64urlDecode(sigB64), c => c.charCodeAt(0))
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig, data)
  if (!valid) throw new Error('Invalid JWT signature')

  return payload // { sub: clerkUserId, ... }
}

async function authenticate(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  try {
    return await verifyClerkJwt(token, env)
  } catch (e) {
    console.error('JWT verification failed:', e.message)
    return null
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async function handleGetSync(request, env, cors) {
  const payload = await authenticate(request, env)
  if (!payload) return json({ error: 'Unauthorized' }, 401, cors)

  const data = await env.KV.get(`user:${payload.sub}`)
  if (!data) return json(null, 404, cors)
  return new Response(data, { status: 200, headers: { 'Content-Type': 'application/json', ...cors } })
}

async function handlePutSync(request, env, cors) {
  const payload = await authenticate(request, env)
  if (!payload) return json({ error: 'Unauthorized' }, 401, cors)

  let body
  try {
    body = await request.text()
    JSON.parse(body) // validate it's valid JSON
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors)
  }

  await env.KV.put(`user:${payload.sub}`, body)
  return json({ ok: true }, 200, cors)
}

async function handlePutRecipe(request, id, env, cors) {
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(id)) return json({ error: 'Invalid ID' }, 400, cors)

  const payload = await authenticate(request, env)
  if (!payload) return json({ error: 'Unauthorized' }, 401, cors)

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400, cors)
  }

  // Check ownership: if the recipe already exists, only the original author can update it
  const existing = await env.KV.get(`recipe:${id}`)
  if (existing) {
    const parsed = JSON.parse(existing)
    if (parsed.authorId !== payload.sub) return json({ error: 'Forbidden' }, 403, cors)
  }

  const record = {
    markdown: body.markdown,
    authorId: payload.sub,
    createdAt: existing ? JSON.parse(existing).createdAt : Date.now(),
    updatedAt: Date.now(),
  }

  await env.KV.put(`recipe:${id}`, JSON.stringify(record))
  return json({ ok: true }, 200, cors)
}

// ---------------------------------------------------------------------------
// Main fetch handler
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env)

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // GET /sync
      if (path === '/sync' && request.method === 'GET') {
        return await handleGetSync(request, env, cors)
      }

      // PUT /sync
      if (path === '/sync' && request.method === 'PUT') {
        return await handlePutSync(request, env, cors)
      }

      // GET /recipe/:id
      const recipeMatch = path.match(/^\/recipe\/([^/]+)$/)
      if (recipeMatch) {
        const id = recipeMatch[1]
        if (request.method === 'GET') {
          if (!/^[a-zA-Z0-9_-]{1,32}$/.test(id)) return json({ error: 'Invalid ID' }, 400, cors)
          const data = await env.KV.get(`recipe:${id}`)
          if (!data) return json(null, 404, cors)
          return new Response(data, { status: 200, headers: { 'Content-Type': 'application/json', ...cors } })
        }
        if (request.method === 'PUT') {
          return await handlePutRecipe(request, id, env, cors)
        }
      }

      return json({ error: 'Not found' }, 404, cors)
    } catch (e) {
      console.error('Worker error:', e)
      return json({ error: 'Internal server error' }, 500, cors)
    }
  },
}
