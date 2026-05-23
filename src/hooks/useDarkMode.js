import { useEffect } from 'react'
import useLocalStorage from './useLocalStorage'

export default function useDarkMode() {
  const [dark, setDark] = useLocalStorage('dark-mode', false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return [dark, setDark]
}
