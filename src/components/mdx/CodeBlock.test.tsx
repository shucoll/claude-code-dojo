import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeBlock } from './CodeBlock'

/** Mirrors what MDX hands `pre`: a `<code>` child carrying the language class. */
function fence(lang: string, code: string) {
  return (
    <CodeBlock>
      <code className={`language-${lang}`}>{code}</code>
    </CodeBlock>
  )
}

test('a prompt fence renders the labelled prompt card', () => {
  render(fence('prompt', 'what does this project do?\n'))
  expect(screen.getByText('Prompt:')).toBeInTheDocument()
  expect(screen.getByText('what does this project do?')).toBeInTheDocument()
})

test('a non-prompt fence renders no prompt label', () => {
  render(fence('bash', 'git clone https://example.com/repo\n'))
  expect(screen.queryByText('Prompt:')).toBeNull()
  expect(screen.getByText('git clone https://example.com/repo')).toBeInTheDocument()
})

test('both prompt and bash fences expose a copy button', () => {
  const { unmount } = render(fence('prompt', 'hello'))
  expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument()
  unmount()

  render(fence('bash', 'ls -la'))
  expect(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument()
})

test('copying writes the fence source, without its trailing newline', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined)
  vi.stubGlobal('navigator', { clipboard: { writeText } })

  render(fence('bash', 'claude --version\n'))
  await userEvent.click(screen.getByRole('button', { name: 'Copy to clipboard' }))

  expect(writeText).toHaveBeenCalledWith('claude --version')
  expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()

  vi.unstubAllGlobals()
})
