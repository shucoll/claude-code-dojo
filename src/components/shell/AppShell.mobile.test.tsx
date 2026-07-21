import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, test } from 'vitest'
import { LanguageProvider } from '../../context/LanguageContext'
import { ProgressProvider } from '../../context/ProgressContext'
import { ThemeProvider } from '../../context/ThemeContext'
import { AppShell } from './AppShell'

// Force a mobile viewport: min-width (desktop) queries do not match.
function mockMobileViewport() {
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

let originalMatchMedia: typeof window.matchMedia

beforeEach(() => {
  originalMatchMedia = window.matchMedia
  mockMobileViewport()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function wrap() {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <MemoryRouter initialEntries={['/learn/beginner/basics/first-edit']}>
            <AppShell>
              <p>lesson body</p>
            </AppShell>
          </MemoryRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>,
  )
}

test('the sidebar starts closed on mobile', () => {
  wrap()
  expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument()
})

test('clicking the backdrop closes the mobile drawer', async () => {
  const user = userEvent.setup()
  const { container } = wrap()

  await user.click(screen.getByRole('button', { name: /expand sidebar/i }))
  expect(await screen.findByRole('navigation', { name: /lessons/i })).toBeInTheDocument()

  const backdrop = container.querySelector('.backdrop-blur-sm')
  expect(backdrop).not.toBeNull()
  await user.click(backdrop as HTMLElement)

  await waitFor(() =>
    expect(screen.queryByRole('navigation', { name: /lessons/i })).not.toBeInTheDocument(),
  )
})
