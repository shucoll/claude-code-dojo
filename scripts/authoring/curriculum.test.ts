// @vitest-environment node
import { Project, type SourceFile } from 'ts-morph'
import { addLesson, ensureLevel, ensureModule } from './curriculum.ts'

const SEED = `export const curriculum = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'The Basics', lessons: [
      { id: 'what-is-cc', title: 'What is Claude Code?', content: () => import('./lessons/beginner/what-is-cc.mdx') },
    ] },
  ] },
]
`

function seed(src = SEED): SourceFile {
  return new Project({ useInMemoryFileSystem: true }).createSourceFile('curriculum.ts', src)
}

test('ensureLevel returns the existing level without duplicating it', () => {
  const sf = seed()
  ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  expect((sf.getFullText().match(/id: 'beginner'/g) ?? []).length).toBe(1)
})

test('ensureLevel appends a new level with an empty modules array', () => {
  const sf = seed()
  ensureLevel(sf, { id: 'advanced', title: 'Advanced' })
  expect(sf.getFullText()).toContain("id: 'advanced'")
  expect(sf.getFullText()).toContain("title: 'Advanced'")
})

test('ensureModule appends a new module under the level', () => {
  const sf = seed()
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  ensureModule(level, { id: 'workflows', title: 'Workflows' })
  expect(sf.getFullText()).toContain("id: 'workflows'")
})

test('addLesson inserts a well-formed entry and is idempotent', () => {
  const sf = seed()
  const level = ensureLevel(sf, { id: 'beginner', title: 'Beginner' })
  const mod = ensureModule(level, { id: 'basics', title: 'The Basics' })
  const first = addLesson(mod, { id: 'first-edit', title: 'Your First Edit', importPath: './lessons/beginner/first-edit.mdx' })
  const again = addLesson(mod, { id: 'first-edit', title: 'Your First Edit', importPath: './lessons/beginner/first-edit.mdx' })
  expect(first).toBe(true)
  expect(again).toBe(false)
  expect(sf.getFullText()).toContain("id: 'first-edit'")
  expect(sf.getFullText()).toContain("import('./lessons/beginner/first-edit.mdx')")
})
