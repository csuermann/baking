---
description: Import a recipe from markdown, URL, image, or text into this baking app
---

Import a recipe into this baking app. The input may be a URL, a path to an image file, or pasted recipe text.

**Input:** $ARGUMENTS

---

## Your task

Convert the input into a recipe markdown file and save it to `src/recipes/`.

If the input looks like a URL, fetch it. If it looks like a file path, read it. Otherwise treat it as raw recipe text. Extract whatever information is available — partial input is fine, make reasonable assumptions for missing fields.

---

## Output format

Save the file as `src/recipes/[lang]-[slug].md` where:
- `[lang]` is the two-letter language code of the recipe text (`de`, `en`, `fr`, etc.)
- `[slug]` is a lowercase kebab-case version of the title (ASCII only, umlaut-transliterated: ä→ae, ö→oe, ü→ue, ß→ss)

Example: a German recipe titled "Dinkelvollkornbrot" → `de-dinkelvollkornbrot.md`

---

## Frontmatter fields

```yaml
---
title: <recipe title, keep original language>
description: <1–2 sentence summary of what makes this bread distinctive, keep original language>
target_dough_temp: <°C — use 24–26 if not stated>
flour_base_g: <total flour weight in grams for one standard batch — see below>
knead_duration_min: <minutes of active kneading for the main dough — use 10 if not stated>
default_quantity: <number of loaves/units in one standard batch — default 1>

ingredients:
  - group: "Section name"   # one per pre-ferment stage or dough stage
  - name: Ingredient name
    percent: 12.5           # baker's percentage — see below
    is_water: true          # only on liquid water additions
  ...
---
```

### flour_base_g

This is the **total flour weight (in grams) for one standard batch** (`default_quantity` units).

Include all flour sources: bread flour, whole wheat, rye, spelt, semolina — anything that contributes starch/gluten. Exclude water, salt, oil, seeds, nuts, and pre-ferments listed as a whole (e.g. "100g sourdough starter") unless the recipe breaks the starter down into its flour component.

### Baker's percentages

`percent = (ingredient weight / flour_base_g) × 100`

All percentages are relative to `flour_base_g`. Water typically runs 65–85%, salt 1.8–2.2%, preferments 10–30%. The flour ingredients themselves will sum to roughly 100%.

### Ingredient groups

Use `- group: "Name"` to separate stages. Typical groups: pre-ferments (Poolish, Levain, Vorteig, Biga…), soakers, scalds/tangzhong (Kochstück, Brühstück), autolyse, main dough. Only add a group header when there are genuinely separate mixing stages.

For multi-stage recipes (pre-ferment → main dough), list the **raw components** of each stage — not derived totals like "gesamter Vorteig 250g". The baker adds the whole pre-ferment; its weight is the sum of its listed components. Mention the expected total weight in the step instructions as a check ("ca. 250g").

Mark water additions with `is_water: true`. This feeds the water-temperature calculator. Don't mark starter, milk, eggs, or oil as water.

---

## Intro text

One short paragraph (2–5 sentences) below the `---` closing fence, before `## Steps`. Describe what makes this bread distinctive: technique, flavour, texture, origin. Keep the original language.

---

## Steps

### How many steps

Use **as few steps as possible, as many as needed**. Each step should represent a single coherent action the baker does (or waits through). Good reasons to split a step:

- A wait/fermentation period the baker needs to track (always its own step)
- A significant technique change (mix → shape → bake)
- Parallel prep that happens during a wait (e.g. making a soaker while the levain rises)

Merge micro-actions that happen in immediate sequence (e.g. "add salt, knead 2 more minutes" stays inside the main knead step). Skip steps with no practical value during baking.

### Step format

```markdown
### Step title

duration: 30

Step instructions in markdown.
```

- Always leave a **blank line** between the title and `duration:`
- `duration:` is in **minutes**
- Use a range (`duration: 120-180`) for fermentation steps where timing varies
- Use a fixed number for mixing, shaping, and baking steps
- Bold key temperatures, times, and visual cues: **28°C**, **Fenstertest**, **windowpane test**
- For fermentation steps, describe what "ready" looks like (volume increase, bubbles, poke test, etc.)

### Typical step skeleton for a sourdough recipe

1. Pre-ferment(s) ansetzen — fixed (5–15 min)
2. Pre-ferment(s) reifen — variable range (e.g. 480-720 for overnight)
3. Autolyse / soaker (if applicable) — fixed + short wait merged (e.g. 35 min = 5 mix + 30 rest)
4. Hauptteig kneten / Mix final dough — fixed (10–20 min)
5. Stockgare / Bulk fermentation — variable range (e.g. 120-180)
6. Formen / Shape — fixed (5–10 min)
7. Stückgare / Final proof — variable range (e.g. 60-90)
8. Backen / Bake — split into "with steam/lid" and "without" if applicable; fixed
9. Auskühlen / Cool — fixed (60 min)

Adapt freely — not every recipe has all these stages.

---

## After creating the file

Run `npm run build` to verify the recipe parses without errors. If it builds cleanly, commit the new file with a short message describing the recipe.
