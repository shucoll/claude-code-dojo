# Changelog

Notable changes to Claude Code Dojo, newest first. Entries are grouped as
**Added**, **Changed**, **Fixed**, and **Lessons** (freshness refreshes and
content revisions).

## 1.0.0 (2026-09-27)

### Added

- Advanced pathway, second half: the remaining 17 lessons across modules A4 to
  A7, covering performance, cost, and scale; building and distributing
  extensions; the Agent SDK; and Ship It Like a Team, a six-milestone guided
  project that takes PulseBoard from one developer's machine to a team's
  production setup. With these, all 32 Advanced lessons are available.
- The Advanced level is open in onboarding and on the homepage, with a full
  description in place of the "Coming soon" badge.
- The Agent SDK module and the Advanced guided project follow your language
  choice: TypeScript or Python for the SDK lessons, JavaScript or Python for
  PulseBoard.
- A cache invalidation board for the prompt caching lesson, sorting session
  actions by what each one does to the cached prompt. Every card opens an
  explanation.

### Fixed

- The org-scale controls lesson's MCP allowlist example uses the object
  entries the documentation requires.

### Lessons

- The Advanced self-assessment's guardrail rubric accepts whichever surface
  runs a scheduled job's timer, matching the autonomous maintenance milestone.

## 2026-09-24

### Added

- Advanced pathway, first half: 15 lessons across modules A0 to A3, covering
  orchestration and parallel work, automation and CI/CD, and production safety
  and governance. The remaining modules A4 to A7 are scaffolded and in progress.
- Three interactive charts for the new lessons: an orchestration decision tree
  that walks you from a task to the right parallelism mechanism, an automation
  spectrum ordering six mechanisms by how much of your attention each needs, and
  a sandbox ladder ordering isolation options by how much of a session sits
  inside the boundary. Every node opens a card explaining that option.

### Changed

- Typed slash commands render as prompt cards, so it is clear where each one
  goes.
- Lesson prose follows an expanded style guide, so voice and formatting stay
  consistent across the three pathways. Two rules were added while the Advanced
  lessons were written: text typed into a surface outside Claude Code is marked
  as such rather than as a prompt, and prose avoids the "X, not Y" antithesis.

### Fixed

- The intro crawl no longer clips its text on small screens.
- The header stays usable on small screens.

### Lessons

- Every Beginner and Intermediate lesson verified against current Claude Code
  documentation, in three passes by how fast each topic changes.

## 0.1.0 (2026-07-22)

Initial baseline: the state of the platform at the point this log begins.

### Added

- Beginner and Intermediate learning pathways, with the Advanced pathway in progress.
- Guided projects that you build end to end: Shelf (Beginner) and PulseBoard (Intermediate).
- Language selection for the guided projects, with JavaScript and Python packs.
- Interactive lesson charts: linear card-flows and branching flowcharts for decision trees and loops.
- Onboarding flow with an animated intro, and a landing page.
- Progress tracking saved in the browser, so you resume where you left off.
- Light and dark themes.
