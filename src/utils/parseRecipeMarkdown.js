/**
 * Client-side recipe markdown parser — mirrors the Vite plugin logic so
 * custom recipes stored in the cloud can be parsed at runtime.
 *
 * gray-matter is a build-time dep used by the Vite plugin. For the browser
 * we do a lightweight YAML frontmatter parse ourselves to avoid the Node.js dep.
 */

// ---------------------------------------------------------------------------
// Minimal YAML frontmatter parser (handles string, number, boolean, arrays)
// ---------------------------------------------------------------------------

function parseYamlValue(raw) {
  const s = raw.trim()
  if (s === 'true') return true
  if (s === 'false') return false
  if (s === 'null' || s === '~') return null
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  return s.replace(/^['"]|['"]$/g, '') // strip surrounding quotes
}

function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return { data: {}, content: src }

  const yamlBlock = match[1]
  const content = src.slice(match[0].length)
  const data = {}

  const lines = yamlBlock.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // Array item under a key
    const keyMatch = line.match(/^(\w[\w_]*):\s*(.*)$/)
    if (keyMatch) {
      const key = keyMatch[1]
      const rest = keyMatch[2].trim()
      if (rest === '' || rest === '[]') {
        // Possibly a multi-line array
        const items = []
        i++
        while (i < lines.length && lines[i].match(/^\s*-\s*/)) {
          const itemLine = lines[i].replace(/^\s*-\s*/, '').trim()
          if (itemLine.startsWith('{') || itemLine.startsWith('name:')) {
            // Inline object or mapping — collect subsequent indented lines
            const obj = {}
            const parts = itemLine.split(/\s*,\s*/)
            for (const part of parts) {
              const [k, v] = part.split(':').map(s => s.trim())
              if (k && v !== undefined) obj[k.replace(/[{}"]/g, '').trim()] = parseYamlValue(v.replace(/[}"]/g, ''))
            }
            items.push(obj)
          } else if (itemLine) {
            items.push(parseYamlValue(itemLine))
          }
          i++
        }
        data[key] = items
        continue
      } else {
        data[key] = parseYamlValue(rest)
      }
    } else if (line.match(/^\s*-\s+\w/)) {
      // Standalone mapping item (ingredients list style)
      const obj = {}
      const inner = line.replace(/^\s*-\s+/, '')
      const pairs = inner.match(/(\w[\w_]*):\s*("[^"]*"|'[^']*'|[^,\s{}]+)/g) || []
      for (const pair of pairs) {
        const colonIdx = pair.indexOf(':')
        const k = pair.slice(0, colonIdx).trim()
        const v = pair.slice(colonIdx + 1).trim()
        obj[k] = parseYamlValue(v)
      }
      // Attach to last array key
      const lastKey = Object.keys(data).at(-1)
      if (Array.isArray(data[lastKey])) data[lastKey].push(obj)
    }
    i++
  }

  return { data, content }
}

// ---------------------------------------------------------------------------
// Step parser (identical to Vite plugin)
// ---------------------------------------------------------------------------

function parseSteps(stepsMarkdown) {
  if (!stepsMarkdown.trim()) return []
  const rawParts = stepsMarkdown.split(/(?=\n### )/)
  return rawParts
    .map(part => part.replace(/^\n/, ''))
    .filter(p => p.startsWith('### '))
    .map(part => {
      const lines = part.replace(/^### /, '').split('\n')
      const title = lines[0].trim()
      let durationMin = 0
      let durationMax = 0
      let isVariable = false
      let bodyStart = 1

      const durationLineIdx = lines[1]?.trim() === '' ? 2 : 1
      if (lines.length > durationLineIdx) {
        const m = lines[durationLineIdx].trim().match(/^duration:\s*(\d+)(?:-(\d+))?$/)
        if (m) {
          durationMin = parseInt(m[1], 10)
          durationMax = m[2] ? parseInt(m[2], 10) : durationMin
          isVariable = durationMin !== durationMax
          bodyStart = durationLineIdx + 1
        }
      }

      let bodyLines = lines.slice(bodyStart)
      while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift()

      return { title, durationMin, durationMax, isVariable, body: bodyLines.join('\n').trim() }
    })
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function parseRecipeMarkdown(markdown) {
  const { data: fm, content } = parseFrontmatter(markdown)

  const stepsMarker = '\n## Steps\n'
  const stepsIdx = content.indexOf(stepsMarker)
  const intro = (stepsIdx >= 0 ? content.slice(0, stepsIdx) : content).trim()
  const stepsContent = stepsIdx >= 0 ? content.slice(stepsIdx + stepsMarker.length) : ''
  const steps = parseSteps(stepsContent)

  return {
    title: fm.title || '',
    description: fm.description || '',
    thumbnail: fm.thumbnail || null,
    targetDoughTemp: fm.target_dough_temp || 25,
    flourBaseG: fm.flour_base_g || 500,
    defaultQuantity: fm.default_quantity ?? 1,
    kneadDurationMin: fm.knead_duration_min || 10,
    ingredients: fm.ingredients || [],
    intro,
    steps,
  }
}

// ---------------------------------------------------------------------------
// Serialiser: recipe object → markdown string
// ---------------------------------------------------------------------------

export function serializeRecipeToMarkdown(recipe) {
  const ingredients = (recipe.ingredients || []).map(ing => {
    if (ing.group) return `  - group: "${ing.group}"`
    let line = `  - name: ${ing.name}\n    percent: ${ing.percent}`
    if (ing.is_water) line += '\n    is_water: true'
    return line
  }).join('\n')

  const steps = (recipe.steps || []).map(step => {
    const dur = step.durationMax && step.durationMax !== step.durationMin
      ? `${step.durationMin}-${step.durationMax}`
      : String(step.durationMin || 0)
    return `### ${step.title}\n\nduration: ${dur}\n\n${step.body || ''}`
  }).join('\n\n')

  return `---
title: ${recipe.title}
description: ${recipe.description || ''}
target_dough_temp: ${recipe.targetDoughTemp || 25}
flour_base_g: ${recipe.flourBaseG || 500}
knead_duration_min: ${recipe.kneadDurationMin || 10}
default_quantity: ${recipe.defaultQuantity || 1}

ingredients:
${ingredients}
---

${recipe.intro || ''}

## Steps

${steps}
`.trim() + '\n'
}
