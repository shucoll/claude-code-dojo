# Curriculum Authoring Platform — Design

**Date:** 2026-07-03
**Status:** Approved, pending phased implementation plans
**Supersedes in part:** `2026-07-01-authoring-tooling-design.md` (the "curriculum edits
via ts-morph codemod" decision is replaced — `curriculum.ts` is now *generated* from
lesson frontmatter, not hand-edited).

## 1. Purpose

The base curriculum spec (`curriculum-design/claude-code-craft-curriculum_v3.md`, local,
uncommitted) defines ~90 lessons across three levels with rich per-lesson metadata
(`type`, `volatility`, `docsSources`, `prerequisites`, `references`, `interactive`, …),
guided-project modules, resolver decision-trees, and simulators. The current platform
can't honor it: `curriculum.ts` is hand-authored and is the structural source of truth,
lesson MDX carries no frontmatter (and the pipeline can't parse it), the scaffolder
forces one snippet + one prompt per lesson, cross-references have no link mechanism, and
the chart engine renders only linear card-flows.

This design makes the platform able to consume the curriculum spec, in phases. It covers
five changes agreed with the owner:

1. **Frontmatter is the single source of truth**; `curriculum.ts` is generated from it.
2. **Scaffolder upgrade** to author lessons frontmatter-first, per lesson `type`.
3. **Dotted-id → route resolver** so cross-references become real links.
4. **Chart flowchart support** (branching graphs), library choice deferred to its phase.
5. **`new-lesson` skill + content-check update** to match the new authoring model.

## 2. Goals / Non-goals

**Goals**
- One edit surface for lesson state (frontmatter); no hand-maintained duplication.
- Preserve today's lazy, code-split loading model (only opened lessons fetch content).
- Correct-by-construction authoring: invalid content fails at build/CI, not in the browser.
- Every aspect ships incrementally; the curriculum can be authored against Phase 1 now.

**Non-goals (this spec)**
- No database, no accounts, no gated progression, no in-browser Claude execution
  (all resolved in the curriculum spec: R1–R6). The platform stays a static site.
- Quizzes (deferred per curriculum R2/R5).
- Phase 2 interactive decision-tree/simulator *behavior* — only the Phase 1 static
  fallbacks and the flowchart primitive that makes them possible are in scope here.
- Practice-repo strategy (curriculum D2, still open).

## 3. Shared foundation — the data model

### 3.1 Structure manifest — `src/content/structure.ts` (hand-written)

Owns container metadata only. Small, rarely changes, edited by hand (or by the scaffolder
when a new module/level is introduced).

```ts
export const structure: LevelDef[] = [
  { id: 'beginner', title: 'Beginner', order: 1, modules: [
      { id: 'B1', title: 'Meet Claude Code',      slug: 'meet-claude-code',      order: 1 },
      { id: 'B2', title: 'Sessions and Context',  slug: 'sessions-and-context',  order: 2 },
      // …
  ]},
  // intermediate, advanced …
]
```

- Module `slug` is optional; it is the URL segment. If omitted, the module `id` is used.
- Level `id` is the existing route level id (`beginner` | `intermediate` | `advanced`).
- Module `id` is the dotted-id prefix (`B2`), the join key with lesson frontmatter.

### 3.2 Lesson frontmatter (per `.mdx`, the source of truth for lesson state)

```yaml
---
id: "B2.3"                 # dotted id; encodes level (B→beginner) + module (B2) + position
slug: "review-changes"     # stable route + filename key
title: "Reviewing Changes"
type: "core"               # core | resolver | workflow | checkpoint | milestone
order: 3                   # position within the module
estimatedMinutes: 20
volatility: "stable"       # stable | evolving | volatile
verifiedAgainstDocsAt: "2026-07-03"
prerequisites: ["B2.2"]    # dotted ids; empty = module entry point
teaches: ["diff-review"]
references: ["B2.1"]        # dotted ids this lesson links back to
docsSources: ["https://code.claude.com/docs/en/..."]  # required unless volatility: stable
interactive:               # optional
  - kind: "diagram"        # diagram (Phase 1) | decision-tree | simulator | quiz (Phase 2)
    spec: "beginner-workflow-map"
---
```

- `level` and `module` are **derived** from `id` (`B2.3` → level `beginner`, module `B2`)
  and are never written in frontmatter. The `B`/`I`/`A` → level map lives in one constant.
- No `moduleTitle`/`levelTitle` in lessons — those come from the manifest.

### 3.3 Frontmatter parsing

- Add `remark-frontmatter` to the MDX pipeline so the YAML block is **stripped from the
  rendered output** (today it would render as text). No `remark-mdx-frontmatter` export is
  required — the app gets lesson metadata from the generated `curriculum.ts`, not from the
  MDX module.
- The generator reads frontmatter from raw files with `gray-matter` (dev-only dep). It does
  **not** import MDX modules, so building the tree stays cheap and never eagerly bundles
  lesson content.

### 3.4 Loading model (invariant — must be preserved)

Only the metadata tree is eager; lesson content is lazy and code-split.

- Generated `curriculum.ts` holds plain metadata **plus** a `content` thunk per lesson:
  `content: () => import('./lessons/beginner/review-changes.mdx')`.
- Loading `curriculum.ts` defines the thunks but does not pull MDX. The router calls
  `content()` on navigation, triggering a per-lesson dynamic import.
- **Hard requirement:** the generator emits one **literal** `import('…')` per lesson.
  Vite code-splits only statically analyzable specifiers; a computed `import(variable)`
  would collapse every lesson into the main bundle. Tests must guard this.
- Budget at ~90 lessons: eager tree ≈ 20–40 KB; each lesson is its own on-demand chunk.
- Future lever (not now): strip authoring-only fields (`teaches`, `docsSources`) from the
  runtime tree if it ever grows. Unneeded at this scale.

## 4. Aspect 1 — codegen pipeline

### 4.1 Generator — `scripts/authoring/generateCurriculum.ts`

Reads `structure.ts` + every `src/content/lessons/**/*.mdx` frontmatter → validates →
emits the generated tree.

Outputs:
- `src/content/curriculum.ts` — **generated, committed**, header comment `DO NOT EDIT —
  generated by scripts/authoring/generateCurriculum.ts`. Imports types from
  `curriculum.types.ts`; exports `curriculum` (tree with metadata + literal `import()`
  thunks) and `lessonPathById` (see Aspect 3).
- `curriculum.types.ts` — **hand-written** `Lesson`/`Module`/`Level`/`LevelDef` interfaces
  (the expanded `Lesson` carries the new metadata fields).

### 4.2 Validation (generation fails on any violation)

- Required fields present and well-typed; `type`, `volatility` in their enums;
  `verifiedAgainstDocsAt` a valid ISO date.
- `id` and `slug` globally unique.
- `id`'s derived level + module exist in `structure.ts`.
- `order` values within a module are unique and contiguous from 1.
- every `prerequisites` / `references` id resolves to an existing lesson.
- `interactive[].spec` exists in the chart registry.
- `docsSources` non-empty unless `volatility: stable`.

### 4.3 npm scripts + CI

- `gen:curriculum` — run the generator.
- `predev` / `prebuild` — run it automatically.
- CI **stale-check**: `npm run gen:curriculum && git diff --exit-code src/content/curriculum.ts`
  — fails if a lesson changed without regeneration. Validation errors also fail CI.

## 5. Aspect 2 — scaffolder upgrade

- **Stops editing `curriculum.ts`** (the generator owns it). Removes the ts-morph
  curriculum codemod path; `packs.ts` editing is retained only for opt-in snippets/prompts.
- Emits MDX **with complete frontmatter** and a **per-`type` template** matching the
  curriculum anatomies: `core` (§1.2), `resolver` (§1.3: confusion, comparison table,
  decision-tree placeholder, scenario walkthroughs, edge cases), `workflow`, `checkpoint`
  (§1.7 rubric), `milestone` (prompts + reasoning recap).
- **Auto-assigns the dotted `id`** from the target module + next free `order`; author
  supplies `level`, `module`, `slug`, `title`, `type` (proposes, confirms).
- **Snippets/prompts are opt-in** (`--snippets` / `--prompts`, default none). Inline
  fenced code is the norm; `<Snippet>`/`<TryPrompt>` reserved for genuinely
  language-specific spots (guided projects, Agent SDK).
- `outline` batch mode seeds `structure.ts` entries for new modules/levels and writes
  typed frontmatter per lesson.
- Runs the generator at the end so the scaffolded skeleton appears immediately.

## 6. Aspect 3 — dotted-id → route resolver

- Generator emits `lessonPathById: Record<string, string>`, e.g.
  `"B2.3" → "/learn/beginner/sessions-and-context/review-changes"` (module segment uses
  the manifest `slug`, else module id). Route shape is the existing
  `/learn/:levelId/:moduleId/:lessonId`.
- Ship `lessonPath(id)` helper and a `<LessonLink id="B2.3" />` MDX component that renders
  the linked lesson title from the tree.
- Rendering: frontmatter `references` power a "Where next" footer; `prerequisites` render
  at the top; inline backward links ("as in B2.3") use `<LessonLink>`.
- Unknown ids can't rot silently — §4.2 validation rejects any unresolved id at build.

## 7. Aspect 4 — chart flowchart support

**Requirement (fixed now):** charts must express a **branching flowchart** — nodes plus
labeled edges — which the current linear card-flow `ChartDef` cannot. This is needed for
the Phase 1 *static* fallbacks of resolver decision-trees, and must upgrade in place to
Phase 2 guided traversal / simulators from the **same JSON** (curriculum §1.5, R5).
Existing linear card-flow diagrams remain; the flowchart is additive.

**Library decision — deferred to the start of this phase**, decided against explicit
criteria and recorded as a mini-decision before implementation:
- **Option (a):** extend the existing `ChartDef` with a node/edge graph model + a small
  layout renderer.
- **Option (b):** adopt `react-flow`.
- **Criteria:** bundle size; fit with the design system (semantic tokens only, "chunky"
  ink-border style); Vite build compatibility; accessibility (keyboard/focus, SVG a11y);
  effort to reach the Phase 2 guided-traversal / simulator behaviors.

## 8. Aspect 5 — skill + content-check update

- Rewrite the **`new-lesson`** skill for frontmatter-first authoring: per-`type`
  templates; explicit "never hand-edit `curriculum.ts` — it is generated"; run
  `gen:curriculum` + validation; edit `structure.ts` for new containers; inline-code-by-
  default guidance; the Part 0 step to fetch `docsSources` before writing; set
  `volatility` + `verifiedAgainstDocsAt`.
- Content check: grow `check-snippets` into a broader **content check** (or add a sibling
  command) that runs the §4.2 frontmatter validation in addition to snippet/prompt
  coverage. Update the `check-snippets` skill text and the `/check-snippets` command
  wording accordingly.

## 9. Migration

Convert the existing 5 lessons to the frontmatter model, author the initial
`structure.ts`, regenerate `curriculum.ts`, and update affected tests
(`ProgressContext`, `progressMath`, `AppShell`, authoring tests). This exercises the whole
pipeline before authoring at volume and is the acceptance test for Phase 1.

## 10. Phasing (each gets its own implementation plan)

1. **Foundation** — `curriculum.types.ts`, `structure.ts`, frontmatter parsing, generator
   + validation, `lessonPathById` output, migrate the 5 lessons, loading-model guard test.
2. **Authoring** — scaffolder rewrite (per-type templates, auto-id, opt-in snippets),
   `new-lesson` skill rewrite, content-check.
3. **Cross-links** — `<LessonLink>` + references/prerequisites rendering (small; may fold
   into Phase 1).
4. **Charts** — library decision + flowchart primitive + Phase 1 static resolver fallbacks.

## 11. Open questions

- **Chart library** (Aspect 4) — resolved at the start of Phase 4 per §7 criteria.
- **Practice-repo strategy** (curriculum D2) — out of scope here.
- Whether Phase 3 folds into Phase 1 — decide when planning Phase 1.
