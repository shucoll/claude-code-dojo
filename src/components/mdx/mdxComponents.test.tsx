import { render, screen } from '@testing-library/react'
import { mdxComponents } from './mdxComponents'

const A = mdxComponents.a

test('external links open in a new tab with an external marker', () => {
  render(<A href="https://code.claude.com/docs/en/setup">setup guide</A>)
  const link = screen.getByRole('link', { name: /setup guide/i })
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  // the ↗ marker sits inside the link
  expect(link.textContent).toContain('↗')
})

test('in-page anchor links stay in place with no marker', () => {
  render(<A href="#pitfalls">jump to pitfalls</A>)
  const link = screen.getByRole('link', { name: /jump to pitfalls/i })
  expect(link).not.toHaveAttribute('target')
  expect(link.textContent).not.toContain('↗')
})
