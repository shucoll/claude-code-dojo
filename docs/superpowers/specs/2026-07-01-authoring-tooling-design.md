# Authoring & CI Tooling — Design

**Date:** 2026-07-01
**Phase:** 6 (final phase of the Claude Code Craft build)
**Status:** Approved, pending implementation plan

## 1. Purpose

Phase 6 delivers the **content-authoring and CI-guardrail layer** for Claude Code
Craft (design spec §9). It makes adding lessons, whole modules/levels, and language
packs fast and *correct-by-construction*, and prevents broken or incomplete content
from reaching `main`.

The platform teaches Claude Code, so the authoring workflow deliberately **dogfoods
Claude Code skills** rather than shipping a standalone CLI.

## 2. Approach: hybrid, skeleton-first

Authoring work splits into two kinds:

- **Deterministic file mechanics** — create an `.mdx` at the right path, insert a
  well-formed entry into `curriculum.ts`, add matching snippet/prompt keys to *every*
  language pack, cross-check references. Same inputs → same output. This is **tested
  code** and can gate CI.
- **Judgment** — lesson titles, teaching prose, idiomatic per-language snippet code.
  This needs a human or Claude and cannot be a deterministic script.

**Hybrid:** a tested TS core owns the mechanics; thin Claude Code skills own the
judgment and call the core.

**Skeleton-first:** scaffolding materializes the full structure instantly with
placeholder `STUB`s; content is filled incrementally. `check-snippets` reports what
remains. This lets scaffolded skeletons merge and be completed at a human pace.

### Key decisions (locked)

- **Curriculum edits:** `ts-morph` AST codemod (dev-only dependency). Robust,
  format-agnostic, survives hand-edits; never ships to the browser bundle.
- **check-snippets strictness:** **tiered** — a reference with no key in the *default*
  pack is a hard ERROR (exit 1); a key missing from a non-default pack (falls back) or
  a leftover `STUB` is a non-blocking warning (exit 0).
- **Tooling form:** hybrid (tested core + thin skills), not pure-skills and not a
  standalone CLI.

## 3. Architecture

### 3.1 Deterministic core — `scripts/authoring/`

Node-only TypeScript, executed via `tsx`, unit-tested with Vitest (node env). Not
reachable from the app entry, so Vite never bundles it.

```
scripts/authoring/
  paths.ts          content/lessons/packs dir constants; STUB sentinel constant
  curriculum.ts     ts-morph editor: ensureLevel, ensureModule, addLesson (idempotent)
  packs.ts          ts-morph editor: addSnippetStub, addPromptStub, readPackKeys
  lessonTemplate.ts builds the .mdx skeleton string
  scaffold.ts       scaffoldLesson(), scaffoldOutline()
  language.ts       scaffoldLanguage() + register in snippets/index.ts
  check.ts          checkSnippets() -> { errors, warnings }
  cli.ts            arg parsing -> dispatch (lesson | outline | language | check)
  *.test.ts         colocated tests (node env)
```

**Idempotent primitives compose into batch.** `ensureLevel`/`ensureModule` create the
container if absent and no-op otherwise; `scaffoldOutline()` walks a
level→modules→lessons tree calling them plus `scaffoldLesson()` per lesson. A single
lesson and a whole level are the same machinery at different scales, applied
atomically.

**New keys are stubbed in the default pack only.** When a lesson references snippet
key `X` and prompt key `Y`, the scaffolder writes stub entries for `X`/`Y` into the
**default** pack (`javascript.ts`) — the one pack that must contain every key or the
reference hard-errors. Non-default packs are **left absent on purpose**: the resolver
falls back to the default, so a learner never sees a `@@TODO@@` placeholder, and
`check-snippets` reports the gap as a warning (the §5 fallback-gap guarantee). Stubbing
a non-default pack would be strictly worse — a present-but-stub key suppresses the
fallback and renders `@@TODO@@`. The `STUB` sentinel therefore lives only in the
default pack and never leaks into the runtime resolver.

### 3.2 `check-snippets` — `check.ts`

Static analysis, no MDX compilation and no app runtime:

1. Read each lesson `.mdx` as **text**; regex-extract `<Snippet id="…">` and
   `<TryPrompt id="…">` references.
2. Read pack key sets via `ts-morph` (locate the pack object literal → `snippets` /
   `prompts` property → key names + string values for stub detection).
3. Classify:
   - **ERROR** — a referenced id with no key in the **default** pack.
   - **warn** — key present in default but missing from a non-default pack (falls
     back); or a value still containing the `STUB` sentinel.
4. Print a grouped report; exit `1` iff any ERROR.

Powers `npm run check-snippets`, the `/check-snippets` slash command, and the CI step.

### 3.3 Claude Code skills — `.claude/skills/`

Thin markdown recipes; they own judgment and call the core.

- **`new-lesson/SKILL.md`**
  1. Gather/propose `level`, `module`, lesson `id` + `title`. For a module/level, draft
     the full outline and **get user approval before writing anything**.
  2. `npx tsx scripts/authoring/cli.ts lesson --level … --module … --id … --title …`
     (or `outline --file <path>` for a batch).
  3. Write teaching prose in the new `.mdx`; replace `STUB`s in `javascript.ts` with
     real code; add idiomatic `python.ts` versions.
  4. Run `npm run check-snippets`; resolve all ERRORs before finishing.

- **`new-language/SKILL.md`**
  1. Confirm `id` / `label` / `icon`.
  2. `npx tsx scripts/authoring/cli.ts language --id rust --label Rust --icon 🦀` →
     creates a pack with `meta` and **empty** `snippets`/`prompts`, and registers it in
     `snippets/index.ts`. Every existing lesson immediately works via fallback to the
     default pack.
  3. Fill idiomatic translations key-by-key; `check-snippets` lists every un-translated
     key (as a fallback-gap warning) as the worklist. Each key added overrides the
     fallback for that key.

### 3.4 Slash command — `.claude/commands/check-snippets.md`

One-liner: run `npm run check-snippets` and summarize the report.

### 3.5 CI

Add a step to `.github/workflows/ci.yml` after `test`:

```yaml
- name: Check snippets
  run: npm run check-snippets
```

Tiered exit code means only genuinely broken references block a PR; fallback gaps and
stubs are advisory.

## 4. Conventions

### Stub sentinel

One exported constant, `STUB = '@@TODO@@'`. Scaffolded values embed it so the checker
can flag them:

```ts
// javascript.ts (default) — warned until filled
'worktrees-example': { filename: 'worktrees.js', code: '// @@TODO@@ snippet: worktrees-example' },
// prompt
'worktrees': '@@TODO@@ prompt: worktrees',
```

### Lesson MDX template

Matches existing lessons' style:

```mdx
# {title}

{/* @@TODO@@ teaching prose */}

<Snippet id="{id}-example" />

<TryPrompt id="{id}" />
```

Default references: snippet `{id}-example`, prompt `{id}`. `--snippets a,b` /
`--prompts c` override. `<WhenLang>` is omitted from the template (optional,
per-lesson).

## 5. Testing & isolation

- **Vitest, node env** (`// @vitest-environment node` on authoring tests — they touch
  `fs`/`ts-morph`, no DOM).
- **Editor tests** run against in-memory `ts-morph` `Project`s: feed fixture source →
  assert transformed source.
- **Scaffold / check tests** run against a **temp dir** seeded from a small fixture
  content tree; the real `src/content` is never mutated.
- **`tsconfig.node.json`** extended to include `scripts/`, so `npm run build`
  (`tsc -b`) type-checks the authoring code. Vite does not bundle it (unreachable from
  the app entry).

## 6. Dependencies

Two new **devDependencies**:

- `ts-morph` — programmatic TypeScript AST edits (`curriculum.ts`, packs,
  `snippets/index.ts`).
- `tsx` — execute the TS CLI (`scripts/authoring/cli.ts`) and the checker.

Neither is a runtime dependency; the browser bundle is unchanged.

## 7. Out of scope (YAGNI)

- No interactive prompt-driven CLI (skills gather metadata; the CLI takes flags).
- No auto-generation of teaching prose or snippet translations (judgment stays with
  the author/Claude).
- No refactor of `curriculum.ts` into a data file / globbed wiring (preserves the
  load-bearing single-source-of-truth invariant).
- No `blocks` authoring support (the `LanguagePack.blocks` field is reserved/future).

## 8. Implementation task outline

1. Deps + `tsconfig.node.json` include + bundle isolation + `paths.ts` (STUB sentinel).
2. `curriculum.ts` + `packs.ts` ts-morph editors (+ tests).
3. `lessonTemplate.ts` + `scaffold.ts` (`scaffoldLesson` / `scaffoldOutline`) (+ tests).
4. `language.ts` scaffolder + `snippets/index.ts` registration (+ tests).
5. `check.ts` + `cli.ts` + `npm run check-snippets` (+ tests).
6. `.claude/skills/{new-lesson,new-language}` + `.claude/commands/check-snippets.md`
   + `ci.yml` step + CLAUDE.md "add a lesson/language" pointers.
