import { recipes } from '../utils/parseRecipes'
import RecipeCard from '../components/RecipeCard'

export default function HomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2">Sourdough Recipes</h1>
        <p className="text-stone-500 dark:text-stone-400">Bake great bread, one loaf at a time.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.slug} recipe={recipe} />
        ))}
      </div>
      {recipes.length === 0 && (
        <p className="text-stone-400 dark:text-stone-600 text-center py-16">No recipes yet.</p>
      )}
    </div>
  )
}
