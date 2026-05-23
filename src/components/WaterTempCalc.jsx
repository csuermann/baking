import { useState } from 'react'
import { computeWaterTemp } from '../utils/ddt'

const inputCls = 'w-full text-sm border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-1.5 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-400'
const labelCls = 'block text-xs text-stone-500 dark:text-stone-400 mb-1'

export default function WaterTempCalc({ targetDoughTemp, kneadDurationMin, onKneadDurationChange, prefs, onPrefsChange }) {
  const [open, setOpen] = useState(false)

  const waterTemp = computeWaterTemp({
    targetDoughTemp,
    roomTemp: prefs.roomTemp,
    flourTemp: prefs.flourTemp,
    risePerMin: prefs.risePerMin,
    kneadDurationMin,
  })
  const waterTempRounded = Math.round(waterTemp * 10) / 10
  const hasWarning = waterTemp < 0 || waterTemp > 40

  return (
    <div className="mb-6 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 dark:bg-stone-800/60 text-left"
      >
        <span className="font-medium text-stone-700 dark:text-stone-300">Water temperature (DDT)</span>
        <span className={`text-sm font-semibold ${hasWarning ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
          {waterTempRounded}°C {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-4 py-4 bg-white dark:bg-stone-900 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className={labelCls}>Room temp (°C)</span>
              <input
                type="number"
                className={inputCls}
                value={prefs.roomTemp}
                onChange={e => onPrefsChange({ roomTemp: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span className={labelCls}>Flour temp (°C)</span>
              <input
                type="number"
                className={inputCls}
                value={prefs.flourTemp}
                onChange={e => onPrefsChange({ flourTemp: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span className={labelCls}>Rise per min (°C/min)</span>
              <input
                type="number"
                step="0.1"
                className={inputCls}
                value={prefs.risePerMin}
                onChange={e => onPrefsChange({ risePerMin: parseFloat(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span className={labelCls}>Knead duration (min)</span>
              <input
                type="number"
                className={inputCls}
                value={kneadDurationMin}
                onChange={e => onKneadDurationChange(parseFloat(e.target.value) || 0)}
              />
            </label>
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500">
            Target dough temp: <strong className="text-stone-600 dark:text-stone-400">{targetDoughTemp}°C</strong> (from recipe)
          </p>

          <div className={`rounded-xl p-4 text-center ${hasWarning ? 'bg-red-50 dark:bg-red-950/40' : 'bg-amber-50 dark:bg-amber-950/40'}`}>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">Recommended water temperature</p>
            <p className={`text-3xl font-bold ${hasWarning ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`}>
              {waterTempRounded}°C
            </p>
            {hasWarning && (
              <p className="text-xs text-red-500 mt-1">
                {waterTemp < 0 ? 'Below 0°C — check your inputs.' : 'Above 40°C — check your inputs.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
