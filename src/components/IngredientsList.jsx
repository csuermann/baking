export default function IngredientsList({ ingredients, loaves }) {
  let ingIdx = 0

  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-200 mb-3">
        Ingredients
        <span className="text-sm font-normal text-stone-400 dark:text-stone-500 ml-2">
          ({loaves} {loaves === 1 ? 'loaf' : 'loaves'})
        </span>
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
                  <td className="px-4 py-2.5 text-stone-700 dark:text-stone-300">{ing.name}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-stone-800 dark:text-stone-200">
                    {ing.weight}g
                  </td>
                  <td className="px-4 py-2.5 text-right text-stone-400 dark:text-stone-600 text-xs w-12">
                    {ing.percent}%
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
