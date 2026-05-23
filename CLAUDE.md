# Baking SPA

React 19 + Vite 6 + Tailwind CSS v4 sourdough baking assistant. Hosted on GitHub Pages via `gh-pages` branch.

## Commands

```bash
npm run dev      # dev server at localhost:5173
npm run build    # production build → dist/
npm run preview  # preview built output
```

## Key conventions

- **Routing**: HashRouter (`/#/recipe/:slug`) — required for GitHub Pages, no server config needed.
- **Recipes**: Markdown files in `src/recipes/*.md` with YAML frontmatter. Parsed at build time by a custom Vite plugin in `vite.config.js` (gray-matter runs in Node, not the browser). Slug = filename without extension.
- **Baker's %**: `weight = (percent / 100) × (flourBaseG × loaves)`. Grouped ingredients use `{ group: "Name" }` marker objects in the YAML `ingredients` array.
- **DDT formula**: `waterTemp = (targetDoughTemp × 3) − roomTemp − flourTemp − (risePerMin × kneadDurationMin)`.
- **Schedule**: Anchor is either a start or finish datetime. Completed steps use their real ACK timestamp; remaining steps project forward from the last known time.
- **State**: `baking-prefs` (room/flour temp, rise rate) and `baking-progress-{slug}` (loaves, anchor, completed steps, knead override) in localStorage.
- **Dark mode**: Tailwind `dark:` variant via `.dark` class on `<html>`, toggled by `useDarkMode` hook.

## Recipe markdown format

```markdown
---
title: My Bread
tags: [beginner, boule]
target_dough_temp: 25
flour_base_g: 500
knead_duration_min: 10
ingredients:
  - group: "Section name"   # optional group header
  - name: Bread flour
    percent: 80
---

Intro text.

## Steps

### Step title
duration: 30        # minutes; use 30-60 for a range

Step instructions in markdown.
```
