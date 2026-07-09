import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ChartCard } from '../../content/charts/types'
import { GridView } from './GridView'

const popup = {
  kind: 'popup' as const,
  content: () => Promise.resolve({ default: () => <p>body</p> }),
}

const items: ChartCard[] = [
  { id: 'help', title: '/help', lines: ['List every command'], target: popup },
  { id: 'clear', title: '/clear', lines: ['Fresh conversation'], target: popup },
  { id: 'inert', title: '/inert', lines: ['No target'] },
]

test('renders the label, caption, and every item', () => {
  render(<GridView row={{ items, label: 'The daily seven', caption: 'A note.' }} onActivate={() => {}} />)
  expect(screen.getByText('The daily seven')).toBeInTheDocument()
  expect(screen.getByText('A note.')).toBeInTheDocument()
  expect(screen.getByText('/help')).toBeInTheDocument()
  expect(screen.getByText('/clear')).toBeInTheDocument()
  expect(screen.getByText('/inert')).toBeInTheDocument()
})

test('holds more items than a cards row allows', () => {
  const many = Array.from({ length: 7 }, (_, i) => ({ id: `c${i}`, title: `/cmd${i}` }))
  render(<GridView row={{ items: many }} onActivate={() => {}} />)
  const grid = screen.getByRole('group', { name: 'Grid' })
  expect(grid.children).toHaveLength(7)
})

test('only items with a target are activatable', async () => {
  const onActivate = vi.fn()
  render(<GridView row={{ items }} onActivate={onActivate} />)

  expect(screen.queryByRole('button', { name: '/inert' })).toBeNull()
  await userEvent.click(screen.getByRole('button', { name: '/help' }))
  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'help' }))
})
