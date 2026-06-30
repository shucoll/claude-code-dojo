import { render, screen } from '@testing-library/react'
import { LanguageProvider } from '../../context/LanguageContext'
import { ChartPopup } from './ChartPopup'
import type { PopupTarget } from '../../content/charts/types'

const target: PopupTarget = {
  kind: 'popup',
  title: 'Bash',
  content: () => import('../../content/charts/popups/bash.mdx'),
}

test('renders nothing when target is null', () => {
  render(<ChartPopup target={null} onClose={() => {}} />)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('renders the node MDX (including a Snippet) inside the popup', async () => {
  render(
    <LanguageProvider>
      <ChartPopup target={target} onClose={() => {}} />
    </LanguageProvider>,
  )
  expect(await screen.findByRole('heading', { name: 'Bash' })).toBeInTheDocument()
  // bash.mdx embeds <Snippet id="edit-function" />; its JS pack code is `export function add(a, b)`
  expect(await screen.findByText(/export function add/)).toBeInTheDocument()
})
