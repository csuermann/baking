const modules = import.meta.glob('../recipes/*.md', { eager: true })

export const recipes = Object.entries(modules).map(([path, mod]) => {
  const slug = path.replace('../recipes/', '').replace('.md', '')
  return { slug, lang: slug.split('-')[0], ...mod.default }
})

export function getRecipeBySlug(slug) {
  return recipes.find(r => r.slug === slug) ?? null
}
