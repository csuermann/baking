export function scaleIngredients(ingredients, flourBaseG, loaves) {
  const flourTotal = flourBaseG * loaves
  return ingredients.map(ing => ({
    ...ing,
    weight: Math.round((ing.percent / 100) * flourTotal * 10) / 10,
  }))
}
