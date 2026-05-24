import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import DarkModeToggle from './components/DarkModeToggle'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 transition-colors">
        <header className="border-b border-stone-200 dark:border-stone-800 sticky top-0 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-sm z-10">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link to="/" className="text-stone-800 dark:text-stone-200 font-semibold text-lg tracking-tight">
              Baking Assistant
            </Link>
            <DarkModeToggle />
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/recipe/:slug" element={<RecipePage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}
