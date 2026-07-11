import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { LessonLink } from './LessonLink'

vi.mock('../../content/curriculum', async () => await import('../../test/curriculumFixture'))

function renderLink(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

function LocationProbe() {
  const { state } = useLocation()
  return <div data-testid="probe">{JSON.stringify(state)}</div>
}

test('renders a link to the resolved lesson using its title as text', () => {
  renderLink(<LessonLink id="B1.1" />)
  const link = screen.getByRole('link', { name: /what is claude code/i })
  expect(link).toHaveAttribute('href', '/learn/beginner/basics/what-is-cc')
})

test('children override the link text', () => {
  renderLink(<LessonLink id="B1.1">start here</LessonLink>)
  expect(screen.getByRole('link', { name: 'start here' })).toHaveAttribute(
    'href',
    '/learn/beginner/basics/what-is-cc',
  )
})

test('an unknown id renders plain text with no anchor', () => {
  renderLink(<LessonLink id="ZZ9.9">missing</LessonLink>)
  expect(screen.queryByRole('link')).toBeNull()
  expect(screen.getByText('missing')).toBeInTheDocument()
})

test('an unknown id with no children falls back to the raw id', () => {
  renderLink(<LessonLink id="ZZ9.9" />)
  expect(screen.getByText('ZZ9.9')).toBeInTheDocument()
})

test('records the page and exact link it was clicked from so Back returns to that spot', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/learn/beginner/basics/came-from-here']}>
      <LessonLink id="B1.1" />
      <LocationProbe />
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('link'))
  // `from` carries the link's ordinal (#lref-0 = the first lesson link on the
  // page), which LessonPage resolves back to the element on Back.
  expect(screen.getByTestId('probe')).toHaveTextContent(
    '{"from":"/learn/beginner/basics/came-from-here#lref-0"}',
  )
})

test('each lesson link records its own ordinal among all lesson links', async () => {
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/learn/beginner/basics/came-from-here']}>
      <LessonLink id="B1.1">first</LessonLink>
      <LessonLink id="B1.1">second</LessonLink>
      <LocationProbe />
    </MemoryRouter>,
  )
  await user.click(screen.getByRole('link', { name: 'second' }))
  expect(screen.getByTestId('probe')).toHaveTextContent(
    '{"from":"/learn/beginner/basics/came-from-here#lref-1"}',
  )
})
