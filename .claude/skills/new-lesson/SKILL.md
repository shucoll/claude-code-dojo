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
