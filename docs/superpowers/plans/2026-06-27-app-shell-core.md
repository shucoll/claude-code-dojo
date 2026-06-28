# App Shell Core Implementation Plan (Phase 3a of 6)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the application plumbing — MDX tooling, a `curriculum.ts` source of truth with stub lessons, `ProgressContext`, and React Router — so a lesson route renders real MDX (with the Phase 2 language-aware components) end to end and progress is tracked. The polished shell UI (sidebar, progress bar, animations) is Phase 3b.

**Architecture:** Pure client-side SPA. `curriculum.ts` defines levels → modules → lessons (each lesson lazy-imports an `.mdx` file). MDX is compiled by `@mdx-js/rollup` with `providerImportSource: '@mdx-js/react'`, so an `MDXProvider` supplies the Phase 2 `Snippet`/`TryPrompt`/`WhenLang` components to lessons. Routes are derived from the curriculum. `ProgressContext` persists visited/completed per lesson to `ccc:progress`. All providers (Theme → Language → Progress → Router) wrap the app.

**Tech Stack:** Builds on Phases 1–2. New deps: `react-router-dom`, `@mdx-js/rollup`, `@mdx-js/react`, `@types/mdx`.

## Global Constraints

- TypeScript strict; no `any` in committed code.
- localStorage: progress persists under `STORAGE_KEYS.progress` (`'ccc:progress'`), already defined in `src/lib/storageKeys.ts`. Value shape: `Record<string /*lessonId*/, 'visited' | 'completed'>`.
- `curriculum.ts` is the single source of truth — routes, progress lesson set, and (in 3b) the sidebar all derive from it. No route or lesson list is hand-maintained elsewhere.
- MDX: `@mdx-js/rollup` must run with `{ enforce: 'pre' }` BEFORE `@vitejs/plugin-react`, and the React plugin's `include` must cover `.mdx`. Use `providerImportSource: '@mdx-js/react'`.
- Context providers mirror the existing `ThemeContext`/`LanguageContext` pattern: default `null`, hook throws outside its provider, value persisted via `useLocalStorage`.
- Stub lessons only — short placeholder MDX exercising the engine. Real lesson authoring is a separate later track.
- No Tailwind Typography plugin and no Framer Motion in this phase (3b). Lesson layout is a plain max-width container.
- Tests: Vitest globals + RTL + jsdom; TDD; pristine output. `.mdx` files are transformed by the shared Vite plugin pipeline in Vitest too.

---

### Task 1: MDX tooling

**Files:**
- Modify: `vite.config.ts`
- Create: `src/mdx.d.ts`
- Create: `src/test/fixtures/sample.mdx`
- Create: `src/test/mdx-tooling.test.tsx`

**Interfaces:**
- Produces: `.mdx` files import as a default React component (`ComponentType`); `@mdx-js/react`'s `MDXProvider` supplies/overrides components in compiled MDX.

- [ ] **Step 1: Install MDX dependencies**

```bash
npm install @mdx-js/rollup @mdx-js/react
npm install -D @types/mdx
```

- [ ] **Step 2: Update `vite.config.ts` to add the MDX plugin**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

- [ ] **Step 3: Create the ambient type declaration `src/mdx.d.ts`**

```ts
declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<Record<string, unknown>>
  export default MDXComponent
}
```

- [ ] **Step 4: Create the fixture `src/test/fixtures/sample.mdx`**

```mdx
# Sample Heading

Hello from MDX.
```

- [ ] **Step 5: Write the test `src/test/mdx-tooling.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { MDXProvider } from '@mdx-js/react'
import Sample from './fixtures/sample.mdx'

test('renders an .mdx file as a React component', () => {
  render(<Sample />)
  expect(screen.getByRole('heading', { name: /sample heading/i })).toBeInTheDocument()
})

test('MDXProvider supplies components to compiled MDX', () => {
  render(
    <MDXProvider components={{ h1: (props) => <h1 data-testid="custom-h1" {...props} /> }}>
      <Sample />
    </MDXProvider>,
  )
  expect(screen.getByTestId('custom-h1')).toBeInTheDocument()
})
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- mdx-tooling`
Expected: 2 passed. (If the `.mdx` import fails to transform under Vitest, STOP and report BLOCKED with the exact error — do not work around it by mocking MDX.)

- [ ] **Step 7: Verify the build**

Run: `npm run build`
Expected: succeeds (the ambient `*.mdx` type makes the import type-check).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add MDX tooling (rollup plugin, types, MDXProvider support)"
```

---

### Task 2: Curriculum types, stub lessons, and navigation helpers

**Files:**
- Create: `src/content/curriculum.ts`
- Create: `src/content/lessons/beginner/what-is-cc.mdx`
- Create: `src/content/lessons/beginner/first-edit.mdx`
- Create: `src/content/lessons/intermediate/slash-commands.mdx`
- Create: `src/content/lessons/advanced/subagents.mdx`
- Create: `src/lib/curriculumNav.ts`
- Create: `src/lib/curriculumNav.test.ts`

**Interfaces:**
- Consumes: MDX tooling (Task 1); Phase 2 components (`Snippet`, `TryPrompt`, `WhenLang`) used inside the lessons.
- Produces:
  - `interface Lesson { id: string; title: string; content: () => Promise<{ default: ComponentType }> }`
  - `interface Module { id: string; title: string; lessons: Lesson[] }`
  - `interface Level { id: string; title: string; modules: Module[] }`
  - `curriculum: Level[]`
  - `interface LessonLocation { levelId: string; moduleId: string; lesson: Lesson }`
  - `flattenLessons(levels)`, `firstLesson(levels)`, `findLesson(levels, levelId, moduleId, lessonId)`, `nextLesson(levels, lessonId)`

- [ ] **Step 1: Create the stub lessons**

`src/content/lessons/beginner/what-is-cc.mdx`:
```mdx
# What is Claude Code?

Claude Code is an agentic coding tool that lives in your terminal and edits real files.

<TryPrompt id="first-edit" />
```

`src/content/lessons/beginner/first-edit.mdx`:
```mdx
# Your First Edit

Point Claude at a function and ask it to change it.

<Snippet id="edit-function" />

<WhenLang is="python">
Tip: activate your virtualenv before pointing Claude at the project.
</WhenLang>

<TryPrompt id="first-edit" />
```

`src/content/lessons/intermediate/slash-commands.mdx`:
```mdx
# Slash Commands

Slash commands trigger reusable workflows inside Claude Code.

<TryPrompt id="refactor" />
```

`src/content/lessons/advanced/subagents.mdx`:
```mdx
# Subagents

Dispatch focused subagents to parallelize independent work.

<Snippet id="hello-world" />
```

- [ ] **Step 2: Create `src/content/curriculum.ts`**

```ts
import type { ComponentType } from 'react'

export interface Lesson {
  id: string
  title: string
  content: () => Promise<{ default: ComponentType }>
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Level {
  id: string
  title: string
  modules: Module[]
}

export const curriculum: Level[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    modules: [
      {
        id: 'basics',
        title: 'The Basics',
        lessons: [
          { id: 'what-is-cc', title: 'What is Claude Code?', content: () => import('./lessons/beginner/what-is-cc.mdx') },
          { id: 'first-edit', title: 'Your First Edit', content: () => import('./lessons/beginner/first-edit.mdx') },
        ],
      },
    ],
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    modules: [
      {
        id: 'workflows',
        title: 'Workflows',
        lessons: [
          { id: 'slash-commands', title: 'Slash Commands', content: () => import('./lessons/intermediate/slash-commands.mdx') },
        ],
      },
    ],
  },
  {
    id: 'advanced',
    title: 'Advanced',
    modules: [
      {
        id: 'power',
        title: 'Power User',
        lessons: [
          { id: 'subagents', title: 'Subagents', content: () => import('./lessons/advanced/subagents.mdx') },
        ],
      },
    ],
  },
]
```

- [ ] **Step 3: Write the failing test `src/lib/curriculumNav.test.ts`**

```ts
import type { Level } from '../content/curriculum'
import { findLesson, firstLesson, flattenLessons, nextLesson } from './curriculumNav'

const noop = () => Promise.resolve({ default: () => null })
const levels: Level[] = [
  { id: 'l1', title: 'L1', modules: [
    { id: 'm1', title: 'M1', lessons: [
      { id: 'a', title: 'A', content: noop },
      { id: 'b', title: 'B', content: noop },
    ] },
  ] },
  { id: 'l2', title: 'L2', modules: [
    { id: 'm2', title: 'M2', lessons: [{ id: 'c', title: 'C', content: noop }] },
  ] },
]

test('flattenLessons returns lessons in order with their location', () => {
  expect(flattenLessons(levels).map((l) => l.lesson.id)).toEqual(['a', 'b', 'c'])
  expect(flattenLessons(levels)[0]).toMatchObject({ levelId: 'l1', moduleId: 'm1' })
})

test('firstLesson returns the first lesson location', () => {
  expect(firstLesson(levels)?.lesson.id).toBe('a')
})

test('findLesson locates a lesson by its full path', () => {
  expect(findLesson(levels, 'l1', 'm1', 'b')?.lesson.title).toBe('B')
  expect(findLesson(levels, 'l1', 'm1', 'zzz')).toBeUndefined()
})

test('nextLesson returns the following lesson across module/level boundaries', () => {
  expect(nextLesson(levels, 'b')?.lesson.id).toBe('c')
  expect(nextLesson(levels, 'c')).toBeUndefined()
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- curriculumNav`
Expected: FAIL — cannot find module `./curriculumNav`.

- [ ] **Step 5: Implement `src/lib/curriculumNav.ts`**

```ts
import type { Lesson, Level } from '../content/curriculum'

export interface LessonLocation {
  levelId: string
  moduleId: string
  lesson: Lesson
}

export function flattenLessons(levels: Level[]): LessonLocation[] {
  const out: LessonLocation[] = []
  for (const level of levels) {
    for (const mod of level.modules) {
      for (const lesson of mod.lessons) {
        out.push({ levelId: level.id, moduleId: mod.id, lesson })
      }
    }
  }
  return out
}

export function firstLesson(levels: Level[]): LessonLocation | undefined {
  return flattenLessons(levels)[0]
}

export function findLesson(
  levels: Level[],
  levelId: string,
  moduleId: string,
  lessonId: string,
): LessonLocation | undefined {
  return flattenLessons(levels).find(
    (l) => l.levelId === levelId && l.moduleId === moduleId && l.lesson.id === lessonId,
  )
}

export function nextLesson(levels: Level[], lessonId: string): LessonLocation | undefined {
  const all = flattenLessons(levels)
  const idx = all.findIndex((l) => l.lesson.id === lessonId)
  return idx >= 0 ? all[idx + 1] : undefined
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- curriculumNav`
Expected: 4 passed.

- [ ] **Step 7: Verify the build (confirms lessons + lazy imports type-check)**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add curriculum source of truth, stub lessons, and nav helpers"
```

---

### Task 3: `ProgressContext` + progress math (TDD)

**Files:**
- Create: `src/lib/progressMath.ts`
- Create: `src/lib/progressMath.test.ts`
- Create: `src/context/ProgressContext.tsx`
- Create: `src/context/ProgressContext.test.tsx`

**Interfaces:**
- Consumes: `useLocalStorage`, `STORAGE_KEYS.progress`; `Level` (Task 2).
- Produces:
  - `type ProgressMap = Record<string, 'visited' | 'completed'>`
  - `lessonIds(levels)`, `completedCount(ids, progress)`, `percentComplete(ids, progress)`, `levelPercent(level, progress)`
  - `<ProgressProvider>` and `useProgress(): { progress, getStatus, markVisited, markCompleted }` where `getStatus(lessonId): 'unvisited' | 'visited' | 'completed'`.

- [ ] **Step 1: Write the failing test `src/lib/progressMath.test.ts`**

```ts
import type { Level } from '../content/curriculum'
import { completedCount, lessonIds, levelPercent, percentComplete } from './progressMath'

const noop = () => Promise.resolve({ default: () => null })
const level: Level = {
  id: 'l1', title: 'L1', modules: [
    { id: 'm1', title: 'M1', lessons: [
      { id: 'a', title: 'A', content: noop },
      { id: 'b', title: 'B', content: noop },
      { id: 'c', title: 'C', content: noop },
      { id: 'd', title: 'D', content: noop },
    ] },
  ],
}

test('lessonIds collects every lesson id', () => {
  expect(lessonIds([level])).toEqual(['a', 'b', 'c', 'd'])
})

test('completedCount counts only completed lessons', () => {
  expect(completedCount(['a', 'b', 'c'], { a: 'completed', b: 'visited', c: 'completed' })).toBe(2)
})

test('percentComplete rounds completed/total to a percentage', () => {
  expect(percentComplete(['a', 'b', 'c', 'd'], { a: 'completed' })).toBe(25)
  expect(percentComplete([], {})).toBe(0)
})

test('levelPercent computes completion for a level', () => {
  expect(levelPercent(level, { a: 'completed', b: 'completed' })).toBe(50)
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- progressMath`
Expected: FAIL — cannot find module `./progressMath`.

- [ ] **Step 3: Implement `src/lib/progressMath.ts`**

```ts
import type { Level } from '../content/curriculum'

export type ProgressMap = Record<string, 'visited' | 'completed'>

export function lessonIds(levels: Level[]): string[] {
  return levels.flatMap((level) => level.modules.flatMap((mod) => mod.lessons.map((l) => l.id)))
}

export function completedCount(ids: string[], progress: ProgressMap): number {
  return ids.filter((id) => progress[id] === 'completed').length
}

export function percentComplete(ids: string[], progress: ProgressMap): number {
  if (ids.length === 0) return 0
  return Math.round((completedCount(ids, progress) / ids.length) * 100)
}

export function levelPercent(level: Level, progress: ProgressMap): number {
  return percentComplete(lessonIds([level]), progress)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- progressMath`
Expected: 4 passed.

- [ ] **Step 5: Write the failing test `src/context/ProgressContext.test.tsx`**

```tsx
import { act, render, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ProgressProvider, useProgress } from './ProgressContext'

const wrapper = ({ children }: { children: ReactNode }) => <ProgressProvider>{children}</ProgressProvider>

test('getStatus reports unvisited for unknown lessons', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  expect(result.current.getStatus('x')).toBe('unvisited')
})

test('markVisited then markCompleted updates status and persists', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  act(() => result.current.markVisited('x'))
  expect(result.current.getStatus('x')).toBe('visited')
  act(() => result.current.markCompleted('x'))
  expect(result.current.getStatus('x')).toBe('completed')
  expect(JSON.parse(localStorage.getItem('ccc:progress')!).x).toBe('completed')
})

test('markVisited does not downgrade a completed lesson', () => {
  const { result } = renderHook(() => useProgress(), { wrapper })
  act(() => result.current.markCompleted('x'))
  act(() => result.current.markVisited('x'))
  expect(result.current.getStatus('x')).toBe('completed')
})

test('useProgress throws outside a provider', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  expect(() => render(<BareConsumer />)).toThrow(/ProgressProvider/)
  errorSpy.mockRestore()
})

function BareConsumer() {
  useProgress()
  return <div>x</div>
}
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npm test -- ProgressContext`
Expected: FAIL — cannot find module `./ProgressContext`.

- [ ] **Step 7: Implement `src/context/ProgressContext.tsx`**

```tsx
import { createContext, useContext, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { STORAGE_KEYS } from '../lib/storageKeys'
import type { ProgressMap } from '../lib/progressMath'

export type LessonStatus = 'unvisited' | 'visited' | 'completed'

interface ProgressContextValue {
  progress: ProgressMap
  getStatus: (lessonId: string) => LessonStatus
  markVisited: (lessonId: string) => void
  markCompleted: (lessonId: string) => void
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useLocalStorage<ProgressMap>(STORAGE_KEYS.progress, {})

  const getStatus = (lessonId: string): LessonStatus => progress[lessonId] ?? 'unvisited'

  const markVisited = (lessonId: string) =>
    setProgress((prev) => (prev[lessonId] ? prev : { ...prev, [lessonId]: 'visited' }))

  const markCompleted = (lessonId: string) =>
    setProgress((prev) => ({ ...prev, [lessonId]: 'completed' }))

  return (
    <ProgressContext.Provider value={{ progress, getStatus, markVisited, markCompleted }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used within a ProgressProvider')
  return ctx
}
```

- [ ] **Step 8: Run the test to verify it passes**

Run: `npm test -- progressMath ProgressContext`
Expected: 8 passed total, pristine.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add progress context and progress math"
```

---

### Task 4: Routing, lesson page, MDX components map, and provider wiring

**Files:**
- Create: `src/components/mdx/mdxComponents.ts`
- Create: `src/pages/LessonPage.tsx`
- Create: `src/pages/LessonPage.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `curriculum`, `findLesson`, `firstLesson` (Task 2); `useProgress`/`ProgressProvider` (Task 3); `LanguageProvider` (Phase 2); `ThemeProvider`/`ThemeToggle` (Phase 1); MDX components (Phase 2 barrel); `react-router-dom`.
- Produces: a `/learn/:levelId/:moduleId/:lessonId` route that lazy-renders the lesson MDX inside an `MDXProvider`, marks it visited on mount, and a root redirect to the first lesson.

- [ ] **Step 1: Install React Router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Create `src/components/mdx/mdxComponents.ts`**

```ts
import type { MDXComponents } from 'mdx/types'
import { Snippet, TryPrompt, WhenLang } from './index'

export const mdxComponents = {
  Snippet,
  TryPrompt,
  WhenLang,
} satisfies MDXComponents
```

- [ ] **Step 3: Write the failing test `src/pages/LessonPage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LanguageProvider } from '../context/LanguageContext'
import { ProgressProvider } from '../context/ProgressContext'
import { LessonPage } from './LessonPage'

function renderAt(path: string) {
  return render(
    <LanguageProvider>
      <ProgressProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
          </Routes>
        </MemoryRouter>
      </ProgressProvider>
    </LanguageProvider>,
  )
}

test('renders the lesson MDX content for the route', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  expect(await screen.findByRole('heading', { name: /your first edit/i })).toBeInTheDocument()
})

test('marks the lesson visited on mount', async () => {
  renderAt('/learn/beginner/basics/first-edit')
  await screen.findByRole('heading', { name: /your first edit/i })
  expect(JSON.parse(localStorage.getItem('ccc:progress')!)['first-edit']).toBe('visited')
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- LessonPage`
Expected: FAIL — cannot find module `./LessonPage`.

- [ ] **Step 5: Implement `src/pages/LessonPage.tsx`**

All hooks are called unconditionally before any early return (Rules of Hooks).

```tsx
import { MDXProvider } from '@mdx-js/react'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { mdxComponents } from '../components/mdx/mdxComponents'
import { curriculum } from '../content/curriculum'
import { useProgress } from '../context/ProgressContext'
import { findLesson } from '../lib/curriculumNav'

export function LessonPage() {
  const { levelId, moduleId, lessonId } = useParams()
  const { markVisited } = useProgress()

  const location = useMemo(
    () =>
      levelId && moduleId && lessonId
        ? findLesson(curriculum, levelId, moduleId, lessonId)
        : undefined,
    [levelId, moduleId, lessonId],
  )

  useEffect(() => {
    if (location) markVisited(location.lesson.id)
  }, [location, markVisited])

  const LessonContent = useMemo(() => (location ? lazy(location.lesson.content) : null), [location])

  if (!location || !LessonContent) return <Navigate to="/" replace />

  return (
    <article className="mx-auto max-w-2xl p-8">
      <MDXProvider components={mdxComponents}>
        <Suspense fallback={<p>Loading…</p>}>
          <LessonContent />
        </Suspense>
      </MDXProvider>
    </article>
  )
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- LessonPage`
Expected: 2 passed.

- [ ] **Step 7: Rewrite `src/App.tsx` to wire providers + router**

```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeToggle } from './components/shell/ThemeToggle'
import { curriculum } from './content/curriculum'
import { LanguageProvider } from './context/LanguageContext'
import { ProgressProvider } from './context/ProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { firstLesson } from './lib/curriculumNav'
import { LessonPage } from './pages/LessonPage'

function RootRedirect() {
  const first = firstLesson(curriculum)
  if (!first) return <p className="p-8">No lessons yet.</p>
  return <Navigate to={`/learn/${first.levelId}/${first.moduleId}/${first.lesson.id}`} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ProgressProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
              <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
                <span className="font-bold">Claude Code Craft</span>
                <ThemeToggle />
              </header>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/learn/:levelId/:moduleId/:lessonId" element={<LessonPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ProgressProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 8: Update `src/App.tsx` smoke test `src/App.test.tsx`**

The app now renders a brand header + theme toggle synchronously (the lesson content loads lazily below).

```tsx
import { render, screen } from '@testing-library/react'
import App from './App'

test('renders the brand header and theme toggle', () => {
  render(<App />)
  expect(screen.getByText('Claude Code Craft')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
})
```

- [ ] **Step 9: Run the full suite + build**

Run: `npm test`
Expected: all tests pass (Phases 1–2 + Phase 3a), pristine output.

Run: `npm run build`
Expected: type-checked build succeeds.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: wire router, lesson page, MDX components, and providers into the app"
```

---

## Self-Review

**Spec coverage (Phase 3a scope):** `curriculum.ts` as source of truth (Task 2, spec §4/§5); MDX tooling + lessons rendering with the Phase 2 language components via `MDXProvider` (Tasks 1, 4, spec §5); progress tracking persisted to `ccc:progress` with visited/completed and derived percentages (Task 3, spec §6); routing derived from curriculum with a root redirect (Task 4, spec §7 — onboarding/resume logic deferred to Phase 4); all providers wired (Task 4). Deferred to 3b: `AppShell`/`Sidebar`/`ProgressBar` UI, sidebar glyphs, "Mark complete / Next" button, language switcher, animations, Tailwind Typography.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command shows expected output.

**Type consistency:** `Lesson`/`Module`/`Level` defined in Task 2 and consumed by `curriculumNav` (Task 2), `progressMath` (Task 3), and `App`/`LessonPage` (Task 4). `ProgressMap` defined in `progressMath` (Task 3) and imported by `ProgressContext` (Task 3). `LessonLocation` from `curriculumNav` used by `LessonPage`. `STORAGE_KEYS.progress === 'ccc:progress'` (Phase 1) matches the literal asserted in Task 3/Task 4 tests. The `content: () => Promise<{ default: ComponentType }>` signature matches the `*.mdx` ambient default export (Task 1) and `React.lazy` usage (Task 4). `mdxComponents` keys (`Snippet`/`TryPrompt`/`WhenLang`) match the Phase 2 barrel exports.
