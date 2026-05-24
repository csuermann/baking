import { HashRouter, Routes, Route, Link, useMatch } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'

const clerkDarkAppearance = {
  variables: {
    colorBackground: '#0c0a09',       // stone-950
    colorInputBackground: '#1c1917',  // stone-900
    colorText: '#e7e5e4',             // stone-200
    colorTextSecondary: '#a8a29e',    // stone-400
    colorPrimary: '#f59e0b',          // amber-500
    colorDanger: '#ef4444',
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'shadow-none border border-stone-800',
    headerTitle: 'text-stone-100',
    headerSubtitle: 'text-stone-400',
    socialButtonsBlockButton: 'border-stone-700 hover:bg-stone-800 text-stone-200',
    dividerLine: 'bg-stone-800',
    dividerText: 'text-stone-500',
    formFieldInput: 'border-stone-700 text-stone-100',
    footerActionLink: 'text-amber-400 hover:text-amber-300',
  },
}

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
        <div className="ml-auto">
          <UserButton appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
        </div>
      </div>
    </header>
  )
}

function AppShell() {
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

export default function App() {
  return (
    <>
      <SignedIn>
        <AppShell />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
          <SignIn appearance={clerkDarkAppearance} />
        </div>
      </SignedOut>
    </>
  )
}
