export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'api-correct-theme'

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore quota / privacy mode */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light'
  }
  return 'dark'
}

export function writeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.theme = theme
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}
