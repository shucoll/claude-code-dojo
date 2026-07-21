// src/components/charts/ChartEmbed.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartEmbed } from './ChartEmbed'

vi.mock('../../content/curriculum', async () => await import('../../test/curriculumFixture'))

// ChartEmbed's job is wiring (navigate vs. popup vs. nothing), not chart content.
// Mock the registry too, so this suite does not break when a real chart retargets
// a card — real charts point at the real curriculum, which is mocked away here.
vi.mock('../../content/charts', () => {
  const chart = {
    id: 'demo',
    rows: [
      {
        kind: 'cards',
        cards: [
          {
            id: 'beginner',
            title: 'Beginner',
            target: {
              kind: 'lesson',
              ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' },
            },
          },
          {
            id: 'anchored',
            title: 'Anchored',
            target: {
              kind: 'lesson',
              ref: {
                level: 'beginner',
                module: 'basics',
                lesson: 'first-edit',
                anchor: 'some-section',
              },
            },
          },
          {
            id: 'bash',
            title: 'Bash',
            target: {
              kind: 'popup',
              title: 'Bash',
              content: () => Promise.resolve({ default: () => 'bash body' }),
            },
          },
        ],
      },
    ],
  }
  return { getChart: (id: string) => (id === 'demo' ? chart : undefined) }
})

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="loc">{loc.pathname}{loc.hash}|{JSON.stringify(loc.state)}</div>
}

function renderEmbed(id: string) {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={['/learn/advanced/power/subagents']}>
        <Routes>
          <Route path="/learn/:levelId/:moduleId/:lessonId" element={<><ChartEmbed id={id} /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </LanguageProvider>,
  )
}

test('renders nothing for an unknown chart id', () => {
  const { container } = renderEmbed('nope')
  expect(container.querySelector('[id^="chart-"]')).toBeNull()
})

test('exposes the scroll anchor id', () => {
  const { container } = renderEmbed('demo')
  expect(container.querySelector('#chart-demo')).not.toBeNull()
})

test('a lesson card navigates with state.from set to the anchor', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Beginner' }))
  const loc = screen.getByTestId('loc').textContent ?? ''
  expect(loc).toContain('/learn/beginner/basics/first-edit')
  expect(loc).toContain('/learn/advanced/power/subagents#chart-demo')
})

test('a lesson card with an anchor lands on that section, not the top', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Anchored' }))
  const loc = screen.getByTestId('loc').textContent ?? ''
  expect(loc).toContain('/learn/beginner/basics/first-edit#some-section')
})

test('a popup card opens the modal instead of navigating', async () => {
  const user = userEvent.setup()
  renderEmbed('demo')
  await user.click(screen.getByRole('button', { name: 'Bash' }))
  expect(await screen.findByRole('dialog')).toHaveAccessibleName('Bash')
  expect(screen.getByTestId('loc').textContent).toContain('/learn/advanced/power/subagents')
})
