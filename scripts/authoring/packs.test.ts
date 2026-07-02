// @vitest-environment node
import { Project, type SourceFile } from 'ts-morph'
import { addPromptStub, addSnippetStub, readPack } from './packs.ts'

const SEED = `import type { LanguagePack } from '../types'

const javascript: LanguagePack = {
  meta: { id: 'javascript', label: 'JavaScript' },
  snippets: {
    'edit-function': { filename: 'math.js', code: 'export function add(a, b) { return a + b }' },
  },
  prompts: {
    refactor: 'Ask Claude to refactor.',
  },
}

export default javascript
`

function seed(src = SEED): SourceFile {
  return new Project({ useInMemoryFileSystem: true }).createSourceFile('javascript.ts', src)
}

test('readPack returns existing key sets', () => {
  const pack = readPack(seed())
  expect(Object.keys(pack.snippets)).toEqual(['edit-function'])
  expect(Object.keys(pack.prompts)).toEqual(['refactor'])
})

test('addSnippetStub inserts a stub containing the sentinel and is idempotent', () => {
  const sf = seed()
  expect(addSnippetStub(sf, 'worktrees-example')).toBe(true)
  expect(addSnippetStub(sf, 'worktrees-example')).toBe(false)
  const pack = readPack(sf)
  expect(Object.keys(pack.snippets).sort()).toEqual(['edit-function', 'worktrees-example'])
  expect(pack.snippets['worktrees-example']).toContain('@@TODO@@')
})

test('addPromptStub inserts a stub prompt containing the sentinel', () => {
  const sf = seed()
  expect(addPromptStub(sf, 'worktrees')).toBe(true)
  const pack = readPack(sf)
  expect(pack.prompts['worktrees']).toContain('@@TODO@@')
})
