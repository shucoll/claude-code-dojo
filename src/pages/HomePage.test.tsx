import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LevelProvider } from '../context/LevelContext'
import { ThemeProvider } from '../context/ThemeContext'
import { HomePage } from './HomePage'

vi.mock('../content/curriculum', async () => await import('../test/curriculumFixture'))

function renderHome() {
  return render(
    <ThemeProvider>
      <LevelProvider>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </LevelProvider>
    </ThemeProvider>,
  )
}

test('renders each landing section heading', () => {
  renderHome()
  expect(screen.getByRole('heading', { level: 1, name: /master claude code/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /what's inside/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /verified and open source/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /three pathways/i })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
})

test("a fresh visitor's CTAs point into onboarding", () => {
  renderHome()
  const ctas = screen.getAllByRole('link', { name: /get started/i })
  expect(ctas.length).toBeGreaterThanOrEqual(1)
  for (const cta of ctas) expect(cta).toHaveAttribute('href', '/onboarding')
})

test('every pathway, Advanced included, is an interactive control', () => {
  renderHome()
  for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
    expect(screen.getByRole('button', { name: new RegExp(level) })).toBeInTheDocument()
  }
  expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
})
