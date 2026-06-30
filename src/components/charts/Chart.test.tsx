import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Chart } from './Chart'
import type { ChartDef } from '../../content/charts/types'

const def: ChartDef = {
  id: 't',
  nodes: [
    { id: 'a', label: 'A', x: 30, y: 20, target: { kind: 'popup', content: () => Promise.resolve({ default: () => null }) } },
    { id: 'b', label: 'B', x: 70, y: 80 }, // targetless
  ],
  edges: [{ from: 'a', to: 'b' }],
}

test('renders one control per interactive node and one line per edge', () => {
  const { container } = render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.getByRole('button', { name: 'A' })).toBeInTheDocument()
  expect(container.querySelectorAll('line')).toHaveLength(1)
})

test('a targetless node is inert (no button, not focusable)', () => {
  render(<Chart def={def} onActivate={() => {}} />)
  expect(screen.queryByRole('button', { name: 'B' })).toBeNull()
  expect(screen.getByText('B').closest('[tabindex]')).toBeNull()
})

test('fires onActivate on click and on Enter/Space', async () => {
  const user = userEvent.setup()
  const onActivate = vi.fn()
  render(<Chart def={def} onActivate={onActivate} />)
  const node = screen.getByRole('button', { name: 'A' })

  await user.click(node)
  expect(onActivate).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))

  node.focus()
  await user.keyboard('{Enter}')
  await user.keyboard(' ')
  expect(onActivate).toHaveBeenCalledTimes(3)
})
