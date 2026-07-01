# Authoring & CI Tooling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a tested Node-only scaffolding/validation core plus thin Claude Code skills that make adding lessons, whole modules/levels, and language packs correct-by-construction, and gate broken content in CI.

**Architecture:** A deterministic TS core in `scripts/authoring/` uses `ts-morph` to edit `curriculum.ts`, the language packs, and `snippets/index.ts`, and does static analysis for `check-snippets`. It is executed with `tsx`, unit-tested with Vitest (node env), and never bundled by Vite. Thin `.claude/skills/` recipes gather judgment (titles/prose/translations) and call the core.

**Tech Stack:** TypeScript (strict), ts-morph (AST edits), tsx (TS execution), Vitest (node env), Node `fs`/`path`.

**Spec:** `docs/superpowers/specs/2026-07-01-authoring-tooling-design.md`

## Global Constraints

- **`ts-morph` and `tsx` are devDependencies only** — never imported by `src/` app code; the browser bundle is unchanged.
- **Module rules (per `tsconfig.node.json`):** `module: nodenext` + `verbatimModuleSyntax: true` + `allowImportingTsExtensions: true`. Therefore: relative imports in `scripts/authoring/` MUST include the `.ts` extension (`import { STUB } from './paths.ts'`), and type-only imports MUST use `import type` (`import type { SourceFile } from 'ts-morph'`).
- **`noUnusedLocals` / `noUnusedParameters` are on** — no unused symbols.
- **TypeScript strict, no `any`** in committed code.
- **Single quotes**; generated TS uses single quotes to match the codebase.
- **Authoring tests** start with `// @vitest-environment node` (they touch `fs`/`ts-morph`, no DOM) and must never mutate the real `src/content` — use in-memory ts-morph `Project`s or `fs.mkdtempSync` temp dirs.
- **Stub sentinel** is the string `@@TODO@@`, exported as `STUB` from `paths.ts`.
- **Default language** is `javascript`.
- **Every task ends green**: `npm test` passes, and where touched, `npm run lint` and `npm run build` pass.

---

## File Structure

- `scripts/authoring/paths.ts` — path derivations + `STUB` + `DEFAULT_LANGUAGE` constants.
- `scripts/authoring/curriculum.ts` — ts-morph editor for `curriculum.ts` (`ensureLevel`/`ensureModule`/`addLesson`).
- `scripts/authoring/packs.ts` — ts-morph editor/reader for a language pack (`addSnippetStub`/`addPromptStub`/`readPack`).
- `scripts/authoring/lessonTemplate.ts` — builds the lesson `.mdx` skeleton.
- `scripts/authoring/scaffold.ts` — `scaffoldLesson` / `scaffoldOutline` (compose the editors + fs writes).
- `scripts/authoring/language.ts` — `scaffoldLanguage` (new empty pack + register in `snippets/index.ts`).
- `scripts/authoring/check.ts` — `checkSnippets` (static analysis → `{ errors, warnings }`).
- `scripts/authoring/cli.ts` — argv dispatch (`lesson | outline | language | check`).
- `scripts/authoring/*.test.ts` — colocated node-env Vitest.
- `.claude/skills/new-lesson/SKILL.md`, `.claude/skills/new-language/SKILL.md` — thin recipes.
- `.claude/commands/check-snippets.md` — slash command.
- Modified: `package.json` (deps + script), `tsconfig.node.json` (include + types), `.github/workflows/ci.yml` (step), `CLAUDE.md` (pointers).

---

## Task 1: Setup — deps, config isolation, paths module

**Files:**
- Modify: `package.json` (devDependencies + `check-snippets` script)
- Modify: `tsconfig.node.json` (`include`, `types`)
- Create: `scripts/authoring/paths.ts`
- Test: `scripts/authoring/paths.test.ts`

**Interfaces:**
- Produces:
  - `STUB: string` (= `'@@TODO@@'`), `DEFAULT_LANGUAGE: string` (= `'javascript'`)
  - `DEFAULT_CONTENT_DIR: string`
  - `curriculumFile(contentDir: string): string`
  - `lessonsDir(contentDir: string): string`
  - `snippetsDir(contentDir: string): string`
  - `packFile(contentDir: string, id: string): string`
  - `packsIndexFile(contentDir: string): string`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install -D ts-morph tsx
```
Expected: `package.json` gains `ts-morph` and `tsx` under `devDependencies`; lockfile updates.

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"`:
```json
"check-snippets": "tsx scripts/authoring/cli.ts check"
```

- [ ] **Step 3: Extend `tsconfig.node.json`**

Change the `types` and `include` fields:
```jsonc
    "types": ["node", "vitest/globals"],
```
```jsonc
  "include": ["vite.config.ts", "scripts"]
```
(Adds Vitest globals so authoring test files type-check, and brings `scripts/` under `tsc -b`.)

- [ ] **Step 4: Write the failing test**

Create `scripts/authoring/paths.test.ts`:
```ts
// @vitest-environment node
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, STUB, curriculumFile, packFile, packsIndexFile, snippetsDir } from './paths.ts'

test('STUB and default language are the agreed constants', () => {
  expect(STUB).toBe('@@TODO@@')
  expect(DEFAULT_LANGUAGE).toBe('javascript')
})

test('DEFAULT_CONTENT_DIR points at src/content', () => {
  expect(DEFAULT_CONTENT_DIR.replace(/\\/g, '/')).toMatch(/\/src\/content$/)
})

test('path derivations join under the given content dir', () => {
  expect(curriculumFile('/x').replace(/\\/g, '/')).toBe('/x/curriculum.ts')
  expect(snippetsDir('/x').replace(/\\/g, '/')).toBe('/x/snippets')
  expect(packFile('/x', 'python').replace(/\\/g, '/')).toBe('/x/snippets/python.ts')
  expect(packsIndexFile('/x').replace(/\\/g, '/')).toBe('/x/snippets/index.ts')
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- paths`
Expected: FAIL — `Cannot find module './paths.ts'`.

- [ ] **Step 6: Implement `paths.ts`**

Create `scripts/authoring/paths.ts`:
```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const STUB = '@@TODO@@'
export const DEFAULT_LANGUAGE = 'javascript'

const here = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_CONTENT_DIR = path.resolve(here, '../../src/content')

export const curriculumFile = (contentDir: string): string => path.join(contentDir, 'curriculum.ts')
export const lessonsDir = (contentDir: string): string => path.join(contentDir, 'lessons')
export const snippetsDir = (contentDir: string): string => path.join(contentDir, 'snippets')
export const packFile = (contentDir: string, id: string): string => path.join(contentDir, 'snippets', `${id}.ts`)
export const packsIndexFile = (contentDir: string): string => path.join(contentDir, 'snippets', 'index.ts')
```

- [ ] **Step 7: Run tests + build to verify green**

Run: `npm test -- paths && npm run build`
Expected: tests PASS; `tsc -b` type-checks `scripts/` with no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.node.json scripts/authoring/paths.ts scripts/authoring/paths.test.ts
git commit -m "feat(authoring): add ts-morph/tsx deps, config isolation, paths module"
```

---

## Task 2: curriculum.ts AST editor

**Files:**
- Create: `scripts/authoring/curriculum.ts`
- Test: `scripts/authoring/curriculum.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression`
  - `ensureModule(levelObj: ObjectLiteralExpression, module: { id: string; title: string }): ObjectLiteralExpression`
  - `addLesson(moduleObj: ObjectLiteralExpression, lesson: { id: string; title: string; importPath: string }): boolean` (true if inserted, false if the id already existed)

- [ ] **Step 1: Write the failing test**

Create `scripts/authoring/curriculum.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- curriculum.test`
Expected: FAIL — `Cannot find module './curriculum.ts'`.

- [ ] **Step 3: Implement `curriculum.ts`**

Create `scripts/authoring/curriculum.ts`:
```ts
import { Node, SyntaxKind } from 'ts-morph'
import type { ArrayLiteralExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'

/** Single-quoted, escaped string literal text for insertion. */
function sq(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined
  const init = prop.getInitializer()
  return init && Node.isStringLiteral(init) ? init.getLiteralText() : undefined
}

function getArrayProp(obj: ObjectLiteralExpression, name: string): ArrayLiteralExpression {
  return obj
    .getPropertyOrThrow(name)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

function findById(arr: ArrayLiteralExpression, id: string): ObjectLiteralExpression | undefined {
  return arr
    .getElements()
    .filter(Node.isObjectLiteralExpression)
    .find((el) => getStringProp(el, 'id') === id)
}

function curriculumArray(sf: SourceFile): ArrayLiteralExpression {
  return sf.getVariableDeclarationOrThrow('curriculum').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

export function ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression {
  const arr = curriculumArray(sf)
  const existing = findById(arr, level.id)
  if (existing) return existing
  arr.addElement(`{ id: ${sq(level.id)}, title: ${sq(level.title)}, modules: [] }`)
  return findById(arr, level.id)!
}

export function ensureModule(levelObj: ObjectLiteralExpression, module: { id: string; title: string }): ObjectLiteralExpression {
  const modules = getArrayProp(levelObj, 'modules')
  const existing = findById(modules, module.id)
  if (existing) return existing
  modules.addElement(`{ id: ${sq(module.id)}, title: ${sq(module.title)}, lessons: [] }`)
  return findById(modules, module.id)!
}

export function addLesson(moduleObj: ObjectLiteralExpression, lesson: { id: string; title: string; importPath: string }): boolean {
  const lessons = getArrayProp(moduleObj, 'lessons')
  if (findById(lessons, lesson.id)) return false
  lessons.addElement(`{ id: ${sq(lesson.id)}, title: ${sq(lesson.title)}, content: () => import(${sq(lesson.importPath)}) }`)
  return true
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- curriculum.test`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/authoring/curriculum.ts scripts/authoring/curriculum.test.ts
git commit -m "feat(authoring): ts-morph editor for curriculum.ts"
```

---

## Task 3: packs.ts AST editor + reader

**Files:**
- Create: `scripts/authoring/packs.ts`
- Test: `scripts/authoring/packs.test.ts`

**Interfaces:**
- Consumes: `STUB` from `paths.ts`.
- Produces:
  - `addSnippetStub(sf: SourceFile, key: string): boolean`
  - `addPromptStub(sf: SourceFile, key: string): boolean`
  - `readPack(sf: SourceFile): { snippets: Record<string, string>; prompts: Record<string, string> }` — values are the raw initializer text of each key (used only for STUB substring detection); `Object.keys(...)` gives the key set.

- [ ] **Step 1: Write the failing test**

Create `scripts/authoring/packs.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- packs.test`
Expected: FAIL — `Cannot find module './packs.ts'`.

- [ ] **Step 3: Implement `packs.ts`**

Create `scripts/authoring/packs.ts`:
```ts
import { Node, SyntaxKind } from 'ts-morph'
import type { ObjectLiteralExpression, SourceFile } from 'ts-morph'
import { STUB } from './paths.ts'

function sq(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function unquote(name: string): string {
  return name.replace(/^['"]|['"]$/g, '')
}

function packObject(sf: SourceFile): ObjectLiteralExpression {
  const decl = sf.getVariableDeclarations().find((d) => d.getTypeNode()?.getText() === 'LanguagePack')
  if (!decl) throw new Error('no `: LanguagePack` declaration found in pack file')
  return decl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
}

function sectionObject(sf: SourceFile, section: 'snippets' | 'prompts'): ObjectLiteralExpression {
  return packObject(sf)
    .getPropertyOrThrow(section)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
}

function hasKey(obj: ObjectLiteralExpression, key: string): boolean {
  return obj.getProperties().some((p) => Node.isPropertyAssignment(p) && unquote(p.getName()) === key)
}

function readSection(sf: SourceFile, section: 'snippets' | 'prompts'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of sectionObject(sf, section).getProperties()) {
    if (Node.isPropertyAssignment(p)) out[unquote(p.getName())] = p.getInitializerOrThrow().getText()
  }
  return out
}

export function readPack(sf: SourceFile): { snippets: Record<string, string>; prompts: Record<string, string> } {
  return { snippets: readSection(sf, 'snippets'), prompts: readSection(sf, 'prompts') }
}

export function addSnippetStub(sf: SourceFile, key: string): boolean {
  const snippets = sectionObject(sf, 'snippets')
  if (hasKey(snippets, key)) return false
  snippets.addPropertyAssignment({
    name: sq(key),
    initializer: `{ filename: ${sq(key)}, code: ${sq(`// ${STUB} snippet: ${key}`)} }`,
  })
  return true
}

export function addPromptStub(sf: SourceFile, key: string): boolean {
  const prompts = sectionObject(sf, 'prompts')
  if (hasKey(prompts, key)) return false
  prompts.addPropertyAssignment({ name: sq(key), initializer: sq(`${STUB} prompt: ${key}`) })
  return true
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- packs.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/authoring/packs.ts scripts/authoring/packs.test.ts
git commit -m "feat(authoring): ts-morph editor/reader for language packs"
```

---

## Task 4: lesson template + scaffoldLesson / scaffoldOutline

**Files:**
- Create: `scripts/authoring/lessonTemplate.ts`
- Create: `scripts/authoring/scaffold.ts`
- Test: `scripts/authoring/scaffold.test.ts`

**Interfaces:**
- Consumes: `curriculumFile`, `lessonsDir`, `packFile`, `DEFAULT_CONTENT_DIR`, `DEFAULT_LANGUAGE`, `STUB` from `paths.ts`; `ensureLevel`/`ensureModule`/`addLesson` from `curriculum.ts`; `addSnippetStub`/`addPromptStub` from `packs.ts`.
- Produces:
  - `lessonTemplate(title: string, snippetId: string, promptId: string): string`
  - `OutlineLesson`, `OutlineModule`, `OutlineLevel`, `Outline`, `LessonSpec`, `ScaffoldReport` interfaces
  - `scaffoldLesson(spec: LessonSpec, contentDir?: string): ScaffoldReport`
  - `scaffoldOutline(outline: Outline, contentDir?: string): ScaffoldReport`

- [ ] **Step 1: Write the failing test**

Create `scripts/authoring/scaffold.test.ts`:
```ts
// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { lessonTemplate } from './lessonTemplate.ts'
import { scaffoldLesson, scaffoldOutline } from './scaffold.ts'

function seedContent(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  fs.mkdirSync(path.join(dir, 'lessons/beginner'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'curriculum.ts'),
    `export const curriculum = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'The Basics', lessons: [] },
  ] },
]
`,
  )
  const emptyPack = (name: string, label: string) => `import type { LanguagePack } from '../types'

const ${name}: LanguagePack = {
  meta: { id: '${name}', label: '${label}' },
  snippets: {},
  prompts: {},
}

export default ${name}
`
  fs.writeFileSync(path.join(dir, 'snippets/javascript.ts'), emptyPack('javascript', 'JavaScript'))
  fs.writeFileSync(path.join(dir, 'snippets/python.ts'), emptyPack('python', 'Python'))
  return dir
}

test('lessonTemplate renders heading, prose stub, Snippet and TryPrompt', () => {
  const out = lessonTemplate('Your First Edit', 'first-edit-example', 'first-edit')
  expect(out).toContain('# Your First Edit')
  expect(out).toContain('@@TODO@@')
  expect(out).toContain('<Snippet id="first-edit-example" />')
  expect(out).toContain('<TryPrompt id="first-edit" />')
})

test('scaffoldLesson writes mdx, registers in curriculum, stubs the DEFAULT pack only', () => {
  const dir = seedContent()
  scaffoldLesson(
    { level: { id: 'beginner', title: 'Beginner' }, module: { id: 'basics', title: 'The Basics' }, id: 'first-edit', title: 'Your First Edit' },
    dir,
  )
  expect(fs.existsSync(path.join(dir, 'lessons/beginner/first-edit.mdx'))).toBe(true)
  expect(fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')).toContain("id: 'first-edit'")
  const js = fs.readFileSync(path.join(dir, 'snippets/javascript.ts'), 'utf8')
  expect(js).toContain("'first-edit-example'")
  expect(js).toContain('@@TODO@@')
  // non-default pack is left absent so it falls back
  expect(fs.readFileSync(path.join(dir, 'snippets/python.ts'), 'utf8')).not.toContain('first-edit-example')
})

test('scaffoldOutline creates a brand-new level, module and lessons atomically', () => {
  const dir = seedContent()
  scaffoldOutline(
    {
      levels: [
        {
          id: 'advanced',
          title: 'Advanced',
          modules: [{ id: 'power', title: 'Power User', lessons: [{ id: 'subagents', title: 'Subagents' }] }],
        },
      ],
    },
    dir,
  )
  const curriculum = fs.readFileSync(path.join(dir, 'curriculum.ts'), 'utf8')
  expect(curriculum).toContain("id: 'advanced'")
  expect(curriculum).toContain("id: 'power'")
  expect(curriculum).toContain("id: 'subagents'")
  expect(fs.existsSync(path.join(dir, 'lessons/advanced/subagents.mdx'))).toBe(true)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scaffold.test`
Expected: FAIL — `Cannot find module './lessonTemplate.ts'`.

- [ ] **Step 3: Implement `lessonTemplate.ts`**

Create `scripts/authoring/lessonTemplate.ts`:
```ts
import { STUB } from './paths.ts'

export function lessonTemplate(title: string, snippetId: string, promptId: string): string {
  return `# ${title}

{/* ${STUB} teaching prose */}

<Snippet id="${snippetId}" />

<TryPrompt id="${promptId}" />
`
}
```

- [ ] **Step 4: Implement `scaffold.ts`**

Create `scripts/authoring/scaffold.ts`:
```ts
import fs from 'node:fs'
import path from 'node:path'
import { Project, QuoteKind } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, curriculumFile, lessonsDir, packFile } from './paths.ts'
import { addLesson, ensureLevel, ensureModule } from './curriculum.ts'
import { addPromptStub, addSnippetStub } from './packs.ts'
import { lessonTemplate } from './lessonTemplate.ts'

export interface OutlineLesson {
  id: string
  title: string
  snippets?: string[]
  prompts?: string[]
}
export interface OutlineModule {
  id: string
  title: string
  lessons: OutlineLesson[]
}
export interface OutlineLevel {
  id: string
  title: string
  modules: OutlineModule[]
}
export interface Outline {
  levels: OutlineLevel[]
}

export interface LessonSpec {
  level: { id: string; title: string }
  module: { id: string; title: string }
  id: string
  title: string
  snippets?: string[]
  prompts?: string[]
}

export interface ScaffoldReport {
  created: string[]
  changed: string[]
}

export function scaffoldOutline(outline: Outline, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  const project = new Project({ skipAddingFilesFromTsConfig: true, manipulationSettings: { quoteKind: QuoteKind.Single } })
  const curriculum = project.addSourceFileAtPath(curriculumFile(contentDir))
  const defaultPack = project.addSourceFileAtPath(packFile(contentDir, DEFAULT_LANGUAGE))
  const report: ScaffoldReport = { created: [], changed: [] }

  for (const level of outline.levels) {
    const levelObj = ensureLevel(curriculum, { id: level.id, title: level.title })
    for (const mod of level.modules) {
      const moduleObj = ensureModule(levelObj, { id: mod.id, title: mod.title })
      for (const lesson of mod.lessons) {
        const snippetKeys = lesson.snippets ?? [`${lesson.id}-example`]
        const promptKeys = lesson.prompts ?? [lesson.id]
        addLesson(moduleObj, { id: lesson.id, title: lesson.title, importPath: `./lessons/${level.id}/${lesson.id}.mdx` })

        const dir = path.join(lessonsDir(contentDir), level.id)
        fs.mkdirSync(dir, { recursive: true })
        const file = path.join(dir, `${lesson.id}.mdx`)
        if (!fs.existsSync(file)) {
          fs.writeFileSync(file, lessonTemplate(lesson.title, snippetKeys[0], promptKeys[0]))
          report.created.push(file)
        }
        for (const key of snippetKeys) addSnippetStub(defaultPack, key)
        for (const key of promptKeys) addPromptStub(defaultPack, key)
      }
    }
  }

  curriculum.saveSync()
  defaultPack.saveSync()
  report.changed.push(curriculumFile(contentDir), packFile(contentDir, DEFAULT_LANGUAGE))
  return report
}

export function scaffoldLesson(spec: LessonSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  return scaffoldOutline(
    {
      levels: [
        {
          id: spec.level.id,
          title: spec.level.title,
          modules: [
            {
              id: spec.module.id,
              title: spec.module.title,
              lessons: [{ id: spec.id, title: spec.title, snippets: spec.snippets, prompts: spec.prompts }],
            },
          ],
        },
      ],
    },
    contentDir,
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- scaffold.test`
Expected: PASS (3 tests).

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: no type errors.

- [ ] **Step 7: Commit**

```bash
git add scripts/authoring/lessonTemplate.ts scripts/authoring/scaffold.ts scripts/authoring/scaffold.test.ts
git commit -m "feat(authoring): lesson template + scaffoldLesson/scaffoldOutline"
```

---

## Task 5: scaffoldLanguage

**Files:**
- Create: `scripts/authoring/language.ts`
- Test: `scripts/authoring/language.test.ts`

**Interfaces:**
- Consumes: `packFile`, `packsIndexFile`, `DEFAULT_CONTENT_DIR` from `paths.ts`; `ScaffoldReport` from `scaffold.ts`.
- Produces:
  - `LanguageSpec` interface (`{ id: string; label: string; icon?: string }`)
  - `scaffoldLanguage(spec: LanguageSpec, contentDir?: string): ScaffoldReport`

- [ ] **Step 1: Write the failing test**

Create `scripts/authoring/language.test.ts`:
```ts
// @vitest-environment node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { scaffoldLanguage } from './language.ts'

function seedSnippets(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccc-'))
  fs.mkdirSync(path.join(dir, 'snippets'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'snippets/index.ts'),
    `import type { LanguagePack } from '../types'
import javascript from './javascript'
import python from './python'

export const LANGUAGE_PACKS: Record<string, LanguagePack> = {
  javascript,
  python,
}
`,
  )
  return dir
}

test('scaffoldLanguage creates an empty pack and registers it', () => {
  const dir = seedSnippets()
  scaffoldLanguage({ id: 'rust', label: 'Rust', icon: '🦀' }, dir)

  const pack = fs.readFileSync(path.join(dir, 'snippets/rust.ts'), 'utf8')
  expect(pack).toContain("id: 'rust'")
  expect(pack).toContain("label: 'Rust'")
  expect(pack).toContain('snippets: {}')
  expect(pack).toContain('prompts: {}')

  const index = fs.readFileSync(path.join(dir, 'snippets/index.ts'), 'utf8')
  expect(index).toContain("import rust from './rust'")
  expect(index).toMatch(/LANGUAGE_PACKS[\s\S]*rust/)
})

test('scaffoldLanguage refuses to overwrite an existing pack', () => {
  const dir = seedSnippets()
  fs.writeFileSync(path.join(dir, 'snippets/rust.ts'), '// existing')
  expect(() => scaffoldLanguage({ id: 'rust', label: 'Rust' }, dir)).toThrow(/already exists/)
})

test('scaffoldLanguage rejects a non-identifier id', () => {
  const dir = seedSnippets()
  expect(() => scaffoldLanguage({ id: 'c++', label: 'C++' }, dir)).toThrow(/identifier/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- language.test`
Expected: FAIL — `Cannot find module './language.ts'`.

- [ ] **Step 3: Implement `language.ts`**

Create `scripts/authoring/language.ts`:
```ts
import fs from 'node:fs'
import { Project, QuoteKind, SyntaxKind } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, packFile, packsIndexFile } from './paths.ts'
import type { ScaffoldReport } from './scaffold.ts'

export interface LanguageSpec {
  id: string
  label: string
  icon?: string
}

const IDENTIFIER = /^[a-zA-Z_$][\w$]*$/

export function scaffoldLanguage(spec: LanguageSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  if (!IDENTIFIER.test(spec.id)) throw new Error(`language id "${spec.id}" is not a valid identifier`)
  const file = packFile(contentDir, spec.id)
  if (fs.existsSync(file)) throw new Error(`pack already exists: ${spec.id}`)

  const iconLine = spec.icon ? `, icon: '${spec.icon}'` : ''
  const body = `import type { LanguagePack } from '../types'

const ${spec.id}: LanguagePack = {
  meta: { id: '${spec.id}', label: '${spec.label}'${iconLine} },
  snippets: {},
  prompts: {},
}

export default ${spec.id}
`
  fs.writeFileSync(file, body)

  const project = new Project({ skipAddingFilesFromTsConfig: true, manipulationSettings: { quoteKind: QuoteKind.Single } })
  const index = project.addSourceFileAtPath(packsIndexFile(contentDir))
  index.addImportDeclaration({ defaultImport: spec.id, moduleSpecifier: `./${spec.id}` })
  index
    .getVariableDeclarationOrThrow('LANGUAGE_PACKS')
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .addShorthandPropertyAssignment({ name: spec.id })
  index.saveSync()

  return { created: [file], changed: [packsIndexFile(contentDir)] }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- language.test`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add scripts/authoring/language.ts scripts/authoring/language.test.ts
git commit -m "feat(authoring): scaffoldLanguage creates + registers an empty pack"
```

---

## Task 6: checkSnippets + CLI + npm script wiring + CI

**Files:**
- Create: `scripts/authoring/check.ts`
- Create: `scripts/authoring/cli.ts`
- Test: `scripts/authoring/check.test.ts`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `DEFAULT_CONTENT_DIR`, `DEFAULT_LANGUAGE`, `STUB`, `lessonsDir`, `snippetsDir`, `packFile` from `paths.ts`; `readPack` from `packs.ts`; `scaffoldLesson`/`scaffoldOutline` from `scaffold.ts`; `scaffoldLanguage` from `language.ts`.
- Produces:
  - `CheckResult` interface (`{ errors: string[]; warnings: string[] }`)
  - `checkSnippets(contentDir?: string): CheckResult`
  - `cli.ts` executable dispatch (not imported anywhere)

- [ ] **Step 1: Write the failing test**

Create `scripts/authoring/check.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- check.test`
Expected: FAIL — `Cannot find module './check.ts'`.

- [ ] **Step 3: Implement `check.ts`**

Create `scripts/authoring/check.ts`:
```ts
import fs from 'node:fs'
import path from 'node:path'
import { Project } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, STUB, lessonsDir, packFile, snippetsDir } from './paths.ts'
import { readPack } from './packs.ts'

export interface CheckResult {
  errors: string[]
  warnings: string[]
}

function listPackIds(contentDir: string): string[] {
  return fs
    .readdirSync(snippetsDir(contentDir))
    .filter((f) => f.endsWith('.ts') && !f.startsWith('index.') && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

function scanLessonRefs(dir: string): { snippets: Set<string>; prompts: Set<string> } {
  const snippets = new Set<string>()
  const prompts = new Set<string>()
  for (const file of walk(dir)) {
    if (!file.endsWith('.mdx')) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/<Snippet\s+id=["']([^"']+)["']/g)) snippets.add(m[1])
    for (const m of text.matchAll(/<TryPrompt\s+id=["']([^"']+)["']/g)) prompts.add(m[1])
  }
  return { snippets, prompts }
}

export function checkSnippets(contentDir: string = DEFAULT_CONTENT_DIR): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const project = new Project({ skipAddingFilesFromTsConfig: true })

  const packs: Record<string, { snippets: Record<string, string>; prompts: Record<string, string> }> = {}
  for (const id of listPackIds(contentDir)) packs[id] = readPack(project.addSourceFileAtPath(packFile(contentDir, id)))
  const def = packs[DEFAULT_LANGUAGE]
  if (!def) throw new Error(`default pack "${DEFAULT_LANGUAGE}" not found`)

  const refs = scanLessonRefs(lessonsDir(contentDir))
  for (const id of refs.snippets) {
    if (!(id in def.snippets)) errors.push(`Snippet id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }
  for (const id of refs.prompts) {
    if (!(id in def.prompts)) errors.push(`Prompt id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }

  for (const [id, pack] of Object.entries(packs)) {
    if (id !== DEFAULT_LANGUAGE) {
      for (const key of Object.keys(def.snippets)) {
        if (!(key in pack.snippets)) warnings.push(`${id}: missing snippet "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
      for (const key of Object.keys(def.prompts)) {
        if (!(key in pack.prompts)) warnings.push(`${id}: missing prompt "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
    }
    for (const [key, value] of Object.entries(pack.snippets)) {
      if (value.includes(STUB)) warnings.push(`${id}: snippet "${key}" is still a TODO stub.`)
    }
    for (const [key, value] of Object.entries(pack.prompts)) {
      if (value.includes(STUB)) warnings.push(`${id}: prompt "${key}" is still a TODO stub.`)
    }
  }

  return { errors, warnings }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- check.test`
Expected: PASS (4 tests).

- [ ] **Step 5: Implement `cli.ts`**

Create `scripts/authoring/cli.ts`:
```ts
import fs from 'node:fs'
import { scaffoldLesson, scaffoldOutline, type Outline, type ScaffoldReport } from './scaffold.ts'
import { scaffoldLanguage } from './language.ts'
import { checkSnippets } from './check.ts'

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      out[arg.slice(2)] = argv[i + 1] ?? ''
      i++
    }
  }
  return out
}

function titleCase(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function report(r: ScaffoldReport): void {
  for (const f of r.created) console.log(`created ${f}`)
  for (const f of r.changed) console.log(`changed ${f}`)
}

const [command, ...rest] = process.argv.slice(2)
const flags = parseFlags(rest)

switch (command) {
  case 'lesson': {
    report(
      scaffoldLesson({
        level: { id: flags.level, title: flags['level-title'] || titleCase(flags.level) },
        module: { id: flags.module, title: flags['module-title'] || titleCase(flags.module) },
        id: flags.id,
        title: flags.title,
        snippets: flags.snippets ? flags.snippets.split(',') : undefined,
        prompts: flags.prompts ? flags.prompts.split(',') : undefined,
      }),
    )
    break
  }
  case 'outline': {
    const outline = JSON.parse(fs.readFileSync(flags.file, 'utf8')) as Outline
    report(scaffoldOutline(outline))
    break
  }
  case 'language': {
    report(scaffoldLanguage({ id: flags.id, label: flags.label, icon: flags.icon || undefined }))
    break
  }
  case 'check': {
    const { errors, warnings } = checkSnippets()
    for (const w of warnings) console.log(`warn  ${w}`)
    for (const e of errors) console.error(`ERROR ${e}`)
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
    if (errors.length > 0) process.exit(1)
    break
  }
  default:
    console.error(`Unknown command: ${command ?? '(none)'}. Use: lesson | outline | language | check`)
    process.exit(2)
}
```

- [ ] **Step 6: Verify the CLI runs clean on the real repo**

Run: `npm run check-snippets`
Expected: prints `0 error(s), 0 warning(s)` and exits 0 (existing lessons reference `edit-function`/`hello-world`/`first-edit`/`refactor`, all present in both packs).

- [ ] **Step 7: Add the CI step**

In `.github/workflows/ci.yml`, after the `Test` step, add:
```yaml
      - name: Check snippets
        run: npm run check-snippets
```

- [ ] **Step 8: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add scripts/authoring/check.ts scripts/authoring/check.test.ts scripts/authoring/cli.ts .github/workflows/ci.yml
git commit -m "feat(authoring): check-snippets analyzer + CLI + CI gate"
```

---

## Task 7: Claude skills, slash command & docs

**Files:**
- Create: `.claude/skills/new-lesson/SKILL.md`
- Create: `.claude/skills/new-language/SKILL.md`
- Create: `.claude/commands/check-snippets.md`
- Modify: `CLAUDE.md` (add authoring pointers)

**Interfaces:**
- Consumes: the CLI commands from Task 6 (`lesson`, `outline`, `language`, `check`).
- Produces: documentation only (no code, no unit tests).

- [ ] **Step 1: Create `new-lesson` skill**

Create `.claude/skills/new-lesson/SKILL.md`:
```markdown
---
name: new-lesson
description: Use when adding one or more lessons (or a whole module/level) to Claude Code Craft. Scaffolds the MDX, registers it in curriculum.ts, and stubs snippet/prompt keys in the default pack, then guides filling in content.
---

# Add a lesson (or module/level)

The deterministic scaffolding lives in `scripts/authoring/` and is run via the CLI.
You supply the judgment (ids, titles, prose, snippet code); the CLI does the wiring.

## Single lesson

1. Decide `level` id, `module` id, lesson `id` (kebab-case) and `title`. Propose them if
   the user hasn't; confirm before writing.
2. Scaffold:
   ```bash
   npx tsx scripts/authoring/cli.ts lesson \
     --level <level> --module <module> --id <id> --title "<Title>"
   ```
   Optional: `--level-title`, `--module-title` (needed only when creating a new
   level/module), `--snippets a,b`, `--prompts c` (defaults: snippet `<id>-example`,
   prompt `<id>`).
3. Fill content:
   - Write the teaching prose in `src/content/lessons/<level>/<id>.mdx` (replace the
     `@@TODO@@` comment).
   - Replace the `@@TODO@@` stub(s) in `src/content/snippets/javascript.ts` (the default
     pack) with real code.
   - Add idiomatic versions of those keys to the other packs (e.g. `python.ts`).
4. Verify: `npm run check-snippets` — resolve every `ERROR` before finishing.

## Whole module or level (batch)

1. Draft the full outline and **get the user's approval before writing anything.**
2. Write it to a temp JSON file in this shape:
   ```json
   {
     "levels": [
       { "id": "advanced-git", "title": "Advanced Git", "modules": [
         { "id": "worktrees", "title": "Worktrees", "lessons": [
           { "id": "wt-intro", "title": "Why Worktrees" }
         ] }
       ] }
     ]
   }
   ```
3. Scaffold the skeleton: `npx tsx scripts/authoring/cli.ts outline --file <path>`
4. Fill lessons incrementally (as above). `npm run check-snippets` reports what remains;
   leftover stubs are warnings, not errors, so a skeleton can be committed and finished
   over several passes.
```

- [ ] **Step 2: Create `new-language` skill**

Create `.claude/skills/new-language/SKILL.md`:
```markdown
---
name: new-language
description: Use when adding a new language pack to Claude Code Craft. Creates an empty pack (so all existing lessons fall back to the default) and registers it, then guides idiomatic translation of every key.
---

# Add a language pack

1. Confirm the language `id` (a valid JS identifier, e.g. `rust`), `label` (e.g. `Rust`)
   and optional `icon` emoji.
2. Scaffold:
   ```bash
   npx tsx scripts/authoring/cli.ts language --id rust --label Rust --icon 🦀
   ```
   This creates `src/content/snippets/rust.ts` with empty `snippets`/`prompts` and
   registers it in `snippets/index.ts`. Every existing lesson immediately works in the
   new language by falling back to the default pack (`javascript`).
3. Get the translation worklist: `npm run check-snippets` lists every key the new pack is
   missing (as fallback warnings).
4. Fill keys idiomatically, one at a time, in `rust.ts`. Each key you add overrides the
   fallback for that key. Warnings shrink as you go; there is no hard error because
   fallback keeps the app correct throughout.
```

- [ ] **Step 3: Create the slash command**

Create `.claude/commands/check-snippets.md`:
```markdown
---
description: Report snippet/prompt reference errors and language-pack gaps
---

Run `npm run check-snippets` and summarize the result: list any ERRORs (broken
references — these fail CI) first, then group the warnings (fallback gaps and leftover
TODO stubs). If there are zero errors and zero warnings, say so plainly.
```

- [ ] **Step 4: Add pointers to `CLAUDE.md`**

In `CLAUDE.md`, after the existing "Adding a chart" section, add:
```markdown
## Adding lessons & languages
Authoring is script-backed (`scripts/authoring/`, run via `tsx`) and wrapped by skills:
- **Add a lesson / module / level:** use the `new-lesson` skill (`cli.ts lesson` or
  `cli.ts outline`). Stubs new snippet/prompt keys in the default pack only; other packs
  fall back.
- **Add a language:** use the `new-language` skill (`cli.ts language`) — creates an empty
  pack; existing lessons fall back to the default until translated.
- **Check coverage:** `npm run check-snippets` (also a CI gate and the `/check-snippets`
  command). Tiered: a reference missing from the default pack fails; non-default gaps and
  leftover `@@TODO@@` stubs warn.
```

- [ ] **Step 5: Verify nothing broke**

Run: `npm test && npm run lint && npm run build && npm run check-snippets`
Expected: all green; check-snippets reports `0 error(s), 0 warning(s)`.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/new-lesson/SKILL.md .claude/skills/new-language/SKILL.md .claude/commands/check-snippets.md CLAUDE.md
git commit -m "docs(authoring): new-lesson/new-language skills, check-snippets command, CLAUDE.md pointers"
```

---

## Final verification (whole branch)

- [ ] `npm test` — all suites green (existing + new authoring tests).
- [ ] `npm run lint` — clean.
- [ ] `npm run build` — `tsc -b` (incl. `scripts/`) + `vite build` succeed; confirm `ts-morph`/`tsx` are **not** in the browser bundle (they're only imported under `scripts/`).
- [ ] `npm run check-snippets` — `0 error(s), 0 warning(s)` on the untouched repo.
- [ ] Smoke test end-to-end in a scratch checkout (optional): scaffold a throwaway lesson, confirm `curriculum.ts`/pack/mdx update, then `git checkout` to discard.
