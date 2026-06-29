import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'

beforeEach(() => {
  // Reset the URL so BrowserRouter-based tests always start at the root.
  window.history.pushState({}, '', '/')
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

// jsdom lacks matchMedia; provide a stub that reports light (matches: false).
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
