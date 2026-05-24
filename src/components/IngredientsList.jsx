export default function IngredientsList({ ingredients, loaves }) {
  let ingIdx = 0

  const totalWeight = Math.round(ingredients.filter(i => !i.group).reduce((sum, i) => sum + i.weight, 0))
  const perLoafWeight = Math.round(totalWeight / loaves)
  const fmt = n => n.toLocaleString()
  const weightLabel = loaves > 1
    ? `${loaves} × ${fmt(perLoafWeight)}g = ${fmt(totalWeight)}g`
    : `${fmt(totalWeight)}g`
  const hydration = Math.round(
    ingredients.filter(i => !i.group && i.is_water).reduce((sum, i) => sum + (+i.percent), 0)
  )

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-3 flex items-baseline justify-between">
        <span>
          Ingredients
          <span className="text-sm font-normal text-stone-400 dark:text-stone-500 ml-2">
            ({weightLabel})
          </span>
        </span>
        {hydration > 0 && (
          <span className="text-sm font-normal text-stone-400 dark:text-stone-500">
            {hydration}% hydration
          </span>
        )}
      </h2>
      <div className="border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {ingredients.map((ing, i) => {
              if (ing.group) {
                ingIdx = 0
                return (
                  <tr key={i} className="bg-stone-100 dark:bg-stone-800">
                    <td
                      colSpan={3}
                      className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
                    >
                      {ing.group}
                    </td>
                  </tr>
                )
              }
              const isEven = ingIdx++ % 2 === 0
              return (
                <tr
                  key={i}
                  className={isEven ? 'bg-white dark:bg-stone-900' : 'bg-stone-50 dark:bg-stone-800/50'}
                >
                  <td className="px-4 py-2.5 font-mono font-medium text-stone-800 dark:text-stone-200 w-16">
                    {ing.weight}g
                  </td>
                  <td className="px-4 py-2.5 text-stone-700 dark:text-stone-300">{ing.name}</td>
                  <td className="px-4 py-2.5 text-right text-stone-400 dark:text-stone-600 text-xs w-12">
                    {(+ing.percent).toFixed(1)}%
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
