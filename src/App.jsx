import { HashRouter, Routes, Route, Link, useMatch } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'

function AppHeader() {
  const onRecipePage = useMatch('/recipe/:slug')
  return (
    <header className="border-b border-stone-800 sticky top-0 bg-stone-950/90 backdrop-blur-sm z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center relative">
        {onRecipePage && (
          <Link
            to="/"
            aria-label="Back to recipes"
            className="p-1.5 -ml-1.5 rounded-lg text-stone-500 hover:text-amber-400 transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        <Link to="/" className="absolute left-1/2 -translate-x-1/2 text-stone-200 font-semibold text-lg tracking-tight">
          Baking Assistant
        </Link>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen bg-stone-950">
        <AppHeader />
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
