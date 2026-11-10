# Changelog

Notable changes to Claude Code Dojo, newest first. Entries are grouped as
**Added**, **Changed**, **Fixed**, and **Lessons** (freshness refreshes and
content revisions).

## 2026-11-09

### Fixed

- The hook decision-control lesson's npm auto-approve hook no longer approves a
  chained command such as `npm test && …`; anything with a shell operator falls
  through to the normal permission prompt.
- The headless mode lesson's CI risk gate stops the build when a run returns no
  structured result, instead of letting it through.
- The sandboxing walkthrough no longer relies on `strictAllowlist` in project
  settings, where Claude Code ignores it, and explains what changes when you set
  it in user settings.
- The autonomous maintenance workflow keeps the GitHub token out of the test
  step's reach, refuses to run test scripts the job changed, and treats a run
  that reports an error as a failure.
- The cost and observability walkthrough sets the telemetry variables in user
  settings, since Claude Code ignores them in a repository's settings files.
- The large codebases Try It now puts its deny rule in the directory you start
  Claude from. Project settings are not inherited from parent directories, so
  with the old setup the `dist/` check failed.
- The prompt injection lesson's revoke step logs out of an MCP server before
  removing it, since removing a server only deletes the tokens stored on your
  machine.
- The MCP vs CLI lesson's example permission rule names
  `mcp__github__create_pull_request`, a tool the GitHub server actually has.
- The feature sprint milestone no longer claims its Stop hook catches an
  endpoint with no test; the hook only fails on a red suite.
- The settings and scopes Try It says its precedence step writes to the
  committed `.claude/settings.json` and tells you to remove the key afterward.
- Lessons that check whether `CLAUDE.md` loaded use `/context all`, since plain
  `/context` hides the per-file list in the default fullscreen view.
- From chat to agent no longer says every action is reviewed: in auto mode, file
  edits inside your project run without a prompt or a classifier check.
- The built-in tool belt no longer says reading a file sends nothing off your
  machine. A file Claude reads goes into the conversation, so keeping `.env`
  private takes a `Read(.env)` deny rule.

### Lessons

- Refreshed against current Claude Code documentation:
  - Beginner: From chat to agent; What Claude Code is and where it lives; What
    Claude can see and touch; Install and authenticate; Your first working
    session; The context window; The essential command belt; /clear vs /compact
    vs starting a new session; CLAUDE.md fundamentals; CLAUDE.md vs auto memory;
    Permission modes and plan mode; Checkpoints: your undo button; Plan mode vs
    "make a plan" vs just prompting; Prompting an agent, not a chatbot; Explore,
    Plan, Code, Verify, Commit; Git and Claude Code; Course-correcting and
    knowing when to bail; Break it, rewind it; Verify-driven feature; Context
    management under pressure.
  - Intermediate: Where you are, where you're going; The built-in tool belt;
    Permission rules; Settings, scopes, and the .claude directory; Where does
    this config go?; What loads at startup (and what it costs); CLAUDE.md at
    scale: rules and imports; Output styles; Skills: teachable procedures;
    Building and invoking skills; Skill patterns; Hooks: deterministic
    automation; Hook input, output, and decision control; Hook recipes;
    Prompt-based and agent-based hooks; Hook vs CLAUDE.md instruction vs skill;
    MCP: giving Claude new tools; MCP scopes, auth, and team sharing; MCP in
    practice (and its costs); MCP server vs CLI tool via Bash vs skill;
    Subagents: context isolation and delegation; Custom subagents; Delegation
    patterns; Plugins and marketplaces; Packaging your setup as a plugin; How it
    all layers; Agent teams: preview; Intermediate self-assessment; Environment
    first; Connect GitHub via MCP; Skills for the repeatable stuff; Hooks as
    quality gates; Subagent review board; Feature sprint using everything;
    Package it.
  - Advanced: Worktrees and parallel sessions; Agent view and dispatch;
    Cross-session messaging; Agent teams (deep dive); Dynamic workflows;
    Subagents vs agent teams vs parallel sessions vs workflows; Headless mode;
    Claude Code in CI; Automated code review, layered; Scheduled and autonomous
    operation; Prompt injection and the agent threat model; Sandboxing;
    Org-scale controls; Data handling; Prompt caching: why session hygiene is
    money; Model strategy and effort; Monitoring and observability; Large
    codebases and monorepos; Plugin development; Marketplaces and distribution;
    Advanced hooks engineering; When to graduate from Claude Code to the SDK;
    Building a custom agent; Deploying agents safely; Advanced self-assessment;
    Parallel sprint with an agent team; CI integration; Autonomous maintenance;
    Governance pack; Cost and observability; SDK capstone.
- Interactive charts and their pop-up cards were checked with their lessons and
  updated where they had drifted: the Claude Code system map, the startup cost
  ledger, the context window simulator, the permission rule shapes, the cache
  invalidation board, and the pop-ups behind the agentic loop, automation
  spectrum, command belt, hook lifecycle, orchestration decision tree, and
  sandbox layers charts.

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
