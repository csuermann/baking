import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import matter from 'gray-matter'

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

      if (lines.length > 1) {
        const m = lines[1].trim().match(/^duration:\s*(\d+)(?:-(\d+))?$/)
        if (m) {
          durationMin = parseInt(m[1], 10)
          durationMax = m[2] ? parseInt(m[2], 10) : durationMin
          isVariable = durationMin !== durationMax
          bodyStart = 2
        }
      }

      let bodyLines = lines.slice(bodyStart)
      while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift()

      return { title, durationMin, durationMax, isVariable, body: bodyLines.join('\n').trim() }
    })
}

function markdownRecipePlugin() {
  return {
    name: 'vite-plugin-markdown-recipe',
    transform(src, id) {
      if (!id.endsWith('.md')) return null

      const { data: fm, content } = matter(src)

      const stepsMarker = '\n## Steps\n'
      const stepsIdx = content.indexOf(stepsMarker)
      const intro = (stepsIdx >= 0 ? content.slice(0, stepsIdx) : content).trim()
      const stepsContent = stepsIdx >= 0 ? content.slice(stepsIdx + stepsMarker.length) : ''
      const steps = parseSteps(stepsContent)

      const recipe = {
        title: fm.title || '',
        description: fm.description || '',
        thumbnail: fm.thumbnail || null,
        tags: fm.tags || [],
        targetDoughTemp: fm.target_dough_temp || 25,
        flourBaseG: fm.flour_base_g || 500,
        defaultQuantity: fm.default_quantity ?? 1,
        kneadDurationMin: fm.knead_duration_min || 10,
        ingredients: fm.ingredients || [],
        intro,
        steps,
      }

      return `export default ${JSON.stringify(recipe)}`
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), markdownRecipePlugin()],
  base: '/baking/',
})
