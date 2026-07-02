---
description: Report snippet/prompt reference errors and language-pack gaps
---

Run `npm run check-snippets` and summarize the result: list any ERRORs (broken
references — these fail CI) first, then group the warnings (fallback gaps and leftover
TODO stubs). If there are zero errors and zero warnings, say so plainly.
