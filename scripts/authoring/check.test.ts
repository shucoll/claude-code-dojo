// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkSnippets } from './check.ts'

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  const pack = (name: string, label: string, body: string) => `import type { LanguagePack } from '../types'

const ${name}: LanguagePack = {
  meta: { id: '${name}', label: '${label}' },
${body}
}

export default ${name}
`
  fs.writeFileSync(
    path.join(dir, 'snippets/javascript.ts'),
    pack('javascript', 'JavaScript', `  snippets: { 'edit-function': { filename: 'math.js', code: 'add' } },\n  prompts: { refactor: 'Refactor it.' },`),
  )
  fs.writeFileSync(path.join(dir, 'snippets/python.ts'), pack('python', 'Python', `  snippets: {},\n  prompts: {},`))
  return dir
}

test('no errors or warnings when every reference resolves and packs match', () => {
  const dir = seedContent()
  // python needs the same keys to avoid fallback warnings
  fs.writeFileSync(
    path.join(dir, 'snippets/python.ts'),
    `import type { LanguagePack } from '../types'

const python: LanguagePack = {
  meta: { id: 'python', label: 'Python' },
  snippets: { 'edit-function': { filename: 'math.py', code: 'add' } },
  prompts: { refactor: 'Refactor it.' },
}

export default python
`,
  )
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="edit-function" />\n\n<TryPrompt id="refactor" />\n')
  const { errors, warnings } = checkSnippets(dir)
  expect(errors).toEqual([])
  expect(warnings).toEqual([])
})

test('a reference missing from the default pack is an ERROR', () => {
  const dir = seedContent()
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="does-not-exist" />\n')
  const { errors } = checkSnippets(dir)
  expect(errors.some((e) => e.includes('does-not-exist'))).toBe(true)
})

test('a key missing from a non-default pack is a warning, not an error', () => {
  const dir = seedContent() // python has neither edit-function nor refactor
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="edit-function" />\n\n<TryPrompt id="refactor" />\n')
  const { errors, warnings } = checkSnippets(dir)
  expect(errors).toEqual([])
  expect(warnings.some((w) => w.includes('python') && w.includes('edit-function'))).toBe(true)
})

test('references inside code fences or inline code are ignored (no false-positive ERROR)', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'lessons/beginner/e.mdx'),
    '# E\n\nInline `<Snippet id="doc-only" />` and:\n\n```mdx\n<Snippet id="fenced-only" />\n<TryPrompt id="fenced-prompt" />\n```\n',
  )
  const { errors } = checkSnippets(dir)
  expect(errors).toEqual([])
})

test('a leftover STUB value is a warning', () => {
  const dir = seedContent()
  fs.writeFileSync(
    path.join(dir, 'snippets/javascript.ts'),
    `import type { LanguagePack } from '../types'

const javascript: LanguagePack = {
  meta: { id: 'javascript', label: 'JavaScript' },
  snippets: { 'edit-function': { filename: 'x', code: '// @@TODO@@ snippet: edit-function' } },
  prompts: {},
}

export default javascript
`,
  )
  fs.writeFileSync(path.join(dir, 'lessons/beginner/e.mdx'), '# E\n\n<Snippet id="edit-function" />\n')
  const { warnings } = checkSnippets(dir)
  expect(warnings.some((w) => w.includes('edit-function') && w.toLowerCase().includes('stub'))).toBe(true)
})
