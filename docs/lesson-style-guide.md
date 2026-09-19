# Lesson style guide

Canonical writing and content-style rules for Claude Code Dojo lessons. This file
is the single source of truth: the **`new-lesson`** skill points authors here, and
the **`lesson-style`** subagent checks a lesson against it. Edit the rules here,
not in either consumer.

Three groups: **prose rules** (judgment calls about voice, grouped into five
families), **content mechanics** (near-deterministic conventions about fences,
links, and ids), and **what not to flag** (false positives that keep the checker
honest).

The prose rules absorb the patterns from the `humanizer` skill, which is built on
Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).
Where that skill and this guide disagree, this guide wins: it is tuned for
technical teaching prose, not for encyclopedia articles or personal essays.

Each rule carries a **slug** in backticks. The subagent cites those slugs, so
renaming one is a breaking change to its reports.

## Scope and exemptions

The prose rules apply to **lesson prose**. Three things are exempt:

- **Fenced content.** Anything inside a ` ```text `, ` ```bash `, ` ```prompt `,
  ` ```markdown `, or sample-config block is showing the reader realistic
  content. Em-dashes, emoji, `✔`/`✘` glyphs, curly quotes, title case, and odd
  phrasing inside a fence are showing the reader what they will actually see.
  Judge fenced content for accuracy and fence type, not for voice.
- **Frontmatter.** `id`, `slug`, `title`, `teaches`, `docsSources`, and the rest
  are metadata. Title-case rules and prose rules do not apply.
- **Canonical section headings.** The `## …` headings come from
  `scripts/authoring/lessonTemplate.ts` ("The problem", "Try It", "FAQ", "Where
  next", and so on). They are fixed by the template. The heading-case rule applies
  only to author-written `###` subheadings.

## The lesson voice

Lessons are technical reference and instruction. Plain, direct, and neutral **is**
the correct human voice here, so do not inject personality, opinion, first-person
color, or narrative drama to make prose feel less machine-authored. The humanizer
skill's "personality and soul" guidance is deliberately **not** adopted: it is
scoped to essays and blog posts.

What replaces personality in this register is precision. Concrete file paths, real
command output, exact flag names, and the specific failure a learner will see do
more to make prose read as human-written than any amount of voice. When a sentence
feels flat, the fix is a sharper fact, not a flourish.

## Prose rules

### Emphasis and significance

- **No em-dashes or en-dashes** (`em-dash`). Not "minimally": the finished lesson
  prose contains zero `—` and zero `–`. Replace each, in rough order of
  preference, with a period (start a new sentence), a comma (a tight aside), a
  colon (introducing an explanation), or parentheses (a true aside); restructure
  if none fit. Also catch the spaced form ` — ` and the double-hyphen ` -- `. Scan
  for both characters before calling a lesson done.
- **No self-referential emphasis** (`self-referential-emphasis`). Never announce
  that something is important; state it plainly and let it carry itself. Banned
  shapes: "that is exactly what X resolves", "this is the whole point / the whole
  answer / the entire point", "is exactly why/what", "and it matters", "worth
  slowing down for", "hold onto it", "that is the whole game". Also drop filler
  `exactly`/`precisely` before a comparison ("exactly the shape from B4.1" → "the
  shape from B4.1"); precise-equality uses are fine ("back exactly where it
  started").
- **No inflated significance** (`inflated-significance`). Do not puff a feature up
  by tying it to a broader arc. Words to watch: stands/serves as, is a
  testament/reminder, a vital/crucial/pivotal/key role, underscores/highlights its
  importance, reflects broader, marks a shift, key turning point, evolving
  landscape, setting the stage for, deeply rooted.
  - Before: "Hooks marked a pivotal moment in the evolution of agent control,
    reflecting a broader shift toward deterministic guardrails."
  - After: "Hooks run shell commands at fixed points in Claude's loop, so a check
    fires whether or not the model decides to run it."
- **No persuasive authority tropes** (`authority-trope`). Phrases that pretend to
  cut through noise before restating an ordinary point: "the real question is",
  "at its core", "in reality", "what really matters", "fundamentally", "the deeper
  issue", "the heart of the matter". Delete the ceremony and keep the claim.
- **No aphorism formulas** (`aphorism`). "X is the Y of Z", "X becomes a trap", "X
  is not a tool but a mirror", "the language of", "the currency of", "the
  architecture of". Replace the formula with the concrete claim it gestures at.
  - Before: "`CLAUDE.md` is the constitution of your repository."
  - After: "`CLAUDE.md` loads into context on every session in that directory, so
    the rules you put there apply without being repeated."
- **No promotional language** (`promotional`). Lessons teach a tool; they do not
  sell it. Words to watch: powerful, seamless, robust, elegant, game-changing,
  effortless, boasts, vibrant, rich (figurative), profound, groundbreaking
  (figurative), stunning, unlock, supercharge. Cost and limits belong in the same
  paragraph as the capability.

### Sentence shapes

- **No flourish clauses** (`flourish-clause`). Cut the extra clever clause that
  adds no information and often reads as aggressive or arch. It is usually a
  trailing "not X" antithesis or a cute metaphor payoff tacked onto a sentence
  that was already complete. Banned shapes: "so the room is on your map, not so
  you furnish it yet", "and nothing more, which for most people is the correct
  amount", "not one clever session". A frequent offender is the "X is not
  [dismissive little picture]; it is Y" shape, e.g. "The connection is not a thing
  you set up on your laptop and describe to teammates in a wiki. It is
  configuration in the repository". Drop the dismissive-picture sentence and state
  Y plainly ("The connection is configuration in the repository: teammates get it
  by cloning"). Also watch defensive / presuming-the-reader asides that add no
  content: "not busywork", "not a straw man", "not hiding it", "and they are easy
  to conflate", "that is not a nicety", "a consequence worth naming". And cut
  self-referential importance tags: "its design is the lesson", "that absence is
  the feature", "the point of X is". If a clause only re-states the sentence with
  attitude or announces that something matters, delete it; keep the plain version.
- **No negative parallelisms or tailing negations** (`negative-parallelism`). "Not
  only… but…", "it's not just about X, it's Y", and clipped negation fragments
  bolted onto the end of a sentence: "no guessing", "no wasted motion", "no
  surprises", "no config required".
  - Before: "The hook fires on every write, no exceptions."
  - After: "The hook fires on every write, including writes Claude makes without
    asking."
- **No "this, not that" antithesis** (`this-not-that`). State the positive claim
  and stop. The short comma form is the one that slips past review: "Isolation is
  enforced, not advisory", "The test is scale, not determinism", "a schedule, not
  a way to parallelize", "Named here, not taught", "Three teammates, not
  fifteen". It is the compact sibling of `flourish-clause`'s "X is not
  [dismissive picture]; it is Y", and the same fix applies: delete the negated
  half, which carries no information the positive half does not.
  - Before: "Isolation is enforced, not advisory."
  - After: "Claude Code enforces the isolation."
  - Before: "worktrees decide how the chosen mechanism runs, not which one you
    pick."
  - After: "worktrees are the isolation layer under all four."
  - **When fixing a flagged antithesis, check the replacement is not another
    one.** The second example above was itself a repair for a flagged
    "not a fifth answer", and reintroduced the pattern it was meant to remove.
  - This rule targets the rhetorical shape. Three kinds of negation stay:
    an enumerated exclusion where the list is the content ("not its files, not
    its tool results"), a corrective fact the learner needs ("the command is
    `claude agents`, not a slash command"), and `rather than` comparatives that
    genuinely compare two real options.
- **No manufactured punchlines or staccato drama** (`staccato`). One short
  sentence for emphasis is fine. A run of clipped fragments engineered to build
  tension is not.
  - Before: "Then the hook fired. No prompt. No confirmation. No way to skip it.
    The commit was already blocked."
  - After: "The hook fired before the commit and blocked it, without prompting
    first."
- **No superficial `-ing` pile-ons** (`ing-pileup`). Present-participle phrases
  tacked onto a finished sentence to add fake depth: highlighting…, underscoring…,
  ensuring…, reflecting…, contributing to…, fostering…, showcasing…,
  demonstrating…. Either cut the phrase or promote it to a real clause with a
  subject and a verb.
  - Before: "Subagents run in their own context window, ensuring the main thread
    stays clean and enabling deeper exploration."
  - After: "Subagents run in their own context window. The main thread only
    receives the final report, so a long search does not fill it."
- **Use "is" and "are"** (`copula-avoidance`). Do not swap a plain copula for
  serves as / stands as / represents / constitutes / boasts / features / offers
  when "is" or "has" says it.
  - Before: "`settings.json` serves as the configuration surface for the harness
    and features three scopes."
  - After: "`settings.json` is where harness configuration lives. It has three
    scopes."
- **No subjectless fragments or hidden actors** (`passive-fragment`). Name who or
  what acts. "No configuration file needed" → "You do not need a configuration
  file." "The results are preserved automatically" → "Claude Code writes the
  results to `…` when the run ends." Passive voice is fine when the actor is
  genuinely unknown or irrelevant; it is a defect when it hides which side (you,
  Claude, the harness, the hook) is doing the thing, which in a teaching lesson is
  usually the fact the learner needs.
- **No false ranges** (`false-range`). "From X to Y" only when X and Y sit on one
  real scale. "From a typo fix to a full refactor" works (scale: size of change).
  "From hooks to subagents to MCP" does not; it is a list, so write it as one.
- **No forced rule of three** (`rule-of-three`). Groups of three appear constantly
  in AI prose because they sound complete. Use the number of items the content
  actually has. If a list has two real members and a third that repeats the
  second, cut the third.

### Word choice

- **Avoid AI-vocabulary words** (`ai-vocabulary`). These cluster in machine-written
  text: delve, leverage (verb), robust, seamless, crucial, pivotal, key
  (adjective), vital, intricate/intricacies, interplay, tapestry, landscape
  (abstract), realm, testament, underscore (verb), highlight (verb), showcase,
  foster, garner, align with, enhance, streamline, empower, harness (verb, outside
  the literal Claude Code sense), navigate (figurative), embark, myriad, plethora,
  additionally, moreover, furthermore. One of these is not a violation on its own;
  a cluster is. Prefer the plain word: "use" over "leverage", "important" over
  "crucial", "handle" over "navigate".
  - Note: `harness` and `landscape` have literal, correct uses in this project
    (the Claude Code harness; a terminal landscape orientation). Judge in context.
- **Cut filler phrases** (`filler-phrase`). "In order to" → "to". "Due to the fact
  that" → "because". "At this point in time" → "now". "In the event that" → "if".
  "Has the ability to" → "can". "It is important to note that" → delete the
  preamble and keep the sentence. "It is worth noting that" → same.
- **Do not over-hedge** (`hedging`). "Could potentially possibly" and stacked
  qualifiers make a lesson unusable. State the behavior; where behavior genuinely
  varies (by model, version, or config), say what it depends on instead of
  hedging: "the exact prompt wording varies by version" beats "this might
  potentially look somewhat different".
- **Hyphenate attributively only** (`hyphen-pair`). "A high-quality report" keeps
  its hyphen; "the report is high quality" drops it. Same for real-time,
  long-term, end-to-end, data-driven, decision-making, third-party, well-known.
  Uniform hyphenation in predicate position is a tell.
- **Keep terminology stable** (`elegant-variation`). Synonym cycling is
  actively harmful in technical writing: a hook is a hook in every sentence, never
  a "handler", "trigger", or "listener" for variety. Same for subagent, skill,
  slash command, MCP server, tool, permission rule. Repeating the exact term is
  correct, not a repetition problem.
- **No conversational rhetorical openers** (`rhetorical-opener`). The theatrical
  pause before an ordinary point: "Honestly?", "Look,", "Here's the thing", "The
  thing is", "Let's be honest", "Real talk". "Honestly" as a filler adverb is the
  most common instance in this repo and is banned outright. A person being direct
  just says the thing.

### Structure and framing

- **No meta-narration or signposting** (`meta-narration`). Cut sentences that
  describe the shape of what follows rather than teaching it. Banned shapes: "No
  chart here, just an if/then walk", "here's a table", "what follows is", "in this
  section we", "let's dive in", "let's explore", "let's break this down", "here's
  what you need to know", "now let's look at". Present the ladder, table, or
  example directly.
- **No fragmented headers** (`fragmented-header`). A heading followed by a
  one-line restatement of the heading, then the real content. The template's
  section headings already say what the section is; open with substance.
  - Before: "## The problem\n\nContext runs out.\n\nOn a long session, Claude
    starts forgetting…"
  - After: "## The problem\n\nOn a long session, Claude starts forgetting…"
- **Say each point once** (`say-once`). Don't repeat an insight or a cross-link in
  two sections (e.g. a body step and the recap). Put it where it lands best. This
  is about repeated *ideas*, not repeated terminology (see `elegant-variation`).
- **No generic positive conclusions** (`generic-conclusion`). "Where next" points
  at specific lessons and specific next capabilities. It does not end on "you are
  now well-equipped to tackle any workflow" or "exciting possibilities await". End
  on the last concrete fact or the actual link.
- **No chatbot artifacts or servile tone** (`chatbot-artifact`). Assistant
  correspondence must never survive into lesson text: "I hope this helps",
  "Certainly!", "Of course!", "Great question!", "You're absolutely right",
  "Would you like me to…", "Let me know if…", "Here is a…". FAQ answers state the
  answer; they do not praise the question.
- **Describe the tool as it is, not as it changed** (`diff-anchored`). A lesson
  should read coherently without knowing what shipped last month: "Claude Code
  recently added X", "this used to require Y", "the new way to do this" all rot on
  contact. Migration and comparison lessons that are explicitly about a change are
  exempt, and so is a dated, sourced note about a genuine behavior change.
- **Never speculate past the docs** (`speculation`). If official docs do not
  establish a behavior, either verify it by running the tool or leave it out.
  Banned shapes: "as of this writing", "based on available information", "while
  specific details are limited", "it is believed that", "presumably", "likely
  behaves like", plus vague attributions ("experts argue", "many developers find",
  "industry reports suggest", "it is generally recommended"). Attribute a claim to
  a real source in `docsSources`, state it as observed behavior, or cut it. Never
  invent a version number, flag, path, or output shape to fill a gap.

### Formatting

- **Bold sparingly** (`boldface`). Bold marks a defined term on first use or a
  standing label the template establishes (for example `**Environment:**` in a
  milestone). It does not mark whichever phrase felt important mid-sentence.
  Mechanical mid-paragraph bolding is one of the loudest AI tells.
- **Prefer prose to inline-header lists** (`inline-header-list`). A run of
  `- **Label:** sentence` bullets that could be two sentences of prose should be
  those two sentences. The pattern is legitimate when each label is a real term,
  option, or file the learner will look up (a pitfalls list, a flag reference); it
  is padding when the labels are invented categories.
- **Sentence case in author-written headings** (`heading-case`). "### Wiring the
  hook", not "### Wiring The Hook". Canonical `##` template headings are exempt
  (see Scope).
- **No emoji in prose** (`emoji`). Terminal glyphs inside fences (`✔`, `✘`, `❯`)
  are content and are exempt. Table cells that reproduce a status the learner sees
  on screen are also fine. Decorative emoji in headings or bullets are not.
- **Straight quotes only** (`straight-quotes`). Use `"` and `'`, never `“ ” ‘ ’`.
  Curly quotes usually mean text was pasted from a chat or a word processor.

## Content mechanics

- **Fence discipline** (`fence-discipline`). Use a ` ```prompt ` fence for
  anything the learner types into Claude (natural-language prompts, `@`-mentions,
  `!` shell passthrough, slash commands); it renders as a "Prompt:" card. Use
  ` ```bash ` for a command the learner runs in their own shell, and ` ```text `
  for terminal or UI output they only read (a permission dialog, sample output).
  The fence type tells the learner *where* the thing goes, so a typed prompt in a
  ` ```bash ` fence, or a runnable command in a ` ```text ` fence, is a bug.
- **Never leave a bare dotted id as plain text** (`bare-id`). A lesson reference
  written literally in prose ("from I8.1", "the rule I4.2 built", "you learned in
  I1.3") must be a `<LessonLink>`, not inert text. When the sentence reads better
  with the id showing than the title, keep the id as the visible label
  (`<LessonLink id="I8.1">I8.1</LessonLink>`, possessives too:
  `<LessonLink id="I8.1">I8.1</LessonLink>'s deny rule`). Otherwise use the
  default title form (`<LessonLink id="I8.1" />`).
- **Every inline external URL must be in `docsSources`**
  (`external-url-not-in-docsSources`). Inline links that leave the platform
  (official docs, pricing, anthropic.com, any `http(s)://` URL) are normal
  markdown links `[text](url)`; the renderer opens them in a new tab and appends
  `↗`. Each such URL must also appear in the lesson's `docsSources` frontmatter
  (the auto "Official docs" footer is the canonical outbound list; inline links
  are a subset). Internal navigation uses `<LessonLink>`, never a raw link.

## What not to flag

These rules exist to catch machine-authored habits, not to flatten good technical
writing. The following are **not** violations:

- **Repeated technical terms.** Saying "hook" nine times in a section is correct.
  Only repeated *ideas* trip `say-once`.
- **Plain, dry prose.** Lessons are reference material. Dryness without a specific
  tell is not a finding.
- **A single transition word.** One "however" or "also" is ordinary. Only a pileup
  reads as machine-authored.
- **One short emphatic sentence.** Clipped sentences land points. `staccato` needs
  a run of them.
- **Precise language that happens to sound formal.** "Deterministic",
  "idempotent", "ephemeral" are the right words when they are the right words.
  `ai-vocabulary` targets a specific list, not vocabulary in general.
- **Anything inside a fence.** Em-dashes, emoji, curly quotes, title case, and
  marketing phrasing in sample output or a quoted doc are content (see Scope).
- **A watched phrase being discussed rather than used.** A lesson that quotes a
  bad prompt in order to fix it is using the phrase correctly.
- **A negation that is the content.** `this-not-that` targets the rhetorical
  shape. An enumerated exclusion list, a correction the learner specifically
  needs, and a `rather than` comparative between two real options are all fine.
- **Bold on a genuine defined term** or a template label such as
  `**Environment:**`.
- **Hyphenated compounds in attributive position.** "A real-time preview" is
  correct English; only the predicate form ("the preview is real-time") trips
  `hyphen-pair`.
- **Product names and quoted doc text** that carry title case, promotional
  wording, or an em-dash of their own.

When in doubt, look for **clusters**. One watched word means nothing; a watched
word plus a rule of three plus an `-ing` pile-on plus a generic closing paragraph
is a finding.

## Grep verification commands

Run these against a finished lesson before calling it done. They catch the
mechanical rules and the most common prose offenders; the judgment rules still
need a read. Every hit needs judging in context, and hits inside fences are
exempt.

```bash
# Dashes: em, en, spaced em, double hyphen. Any prose hit is a violation.
grep -nE "—|–| -- " <file>

# Self-referential emphasis, authority tropes, rhetorical openers
grep -niE "exactly (what|why|the)|the whole (point|answer|game)|and it matters|honestly|the real question|at its core|what really matters|here'?s the thing|let'?s (dive|explore|break)" <file>

# AI vocabulary cluster (judge density, not single hits)
grep -niE "\b(delve|leverage|robust|seamless|crucial|pivotal|vital|intricate|interplay|tapestry|realm|testament|underscore|showcase|foster|garner|streamline|empower|myriad|plethora|moreover|furthermore)\b" <file>

# Promotional and filler
grep -niE "\b(powerful|effortless|game-chang|unlock|supercharge)\b|in order to|due to the fact|at this point in time|has the ability to|it is (important|worth) (to note|noting)" <file>

# Speculation and vague attribution
grep -niE "as of this writing|based on available information|it is believed|presumably|experts (say|argue)|many developers|industry reports|generally recommended" <file>

# Chatbot artifacts
grep -niE "great question|i hope this helps|let me know if|would you like me|certainly!|of course!" <file>

# "This, not that" antithesis — judge each hit; keep enumerated exclusions,
# corrective facts, and genuine `rather than` comparatives
grep -nE ", not [a-z]|\bis not a \b|\bare not a \b" <file>

# Curly quotes and stray emoji in prose (check each hit is inside a fence)
grep -nP "[\x{2018}\x{2019}\x{201C}\x{201D}]|[\x{1F300}-\x{1FAFF}]" <file>

# Bare dotted ids in prose — every hit outside frontmatter and code fences
# must sit inside a <LessonLink>
grep -nE "[^\"/=]\b[IBA][0-9]+\.[0-9]+" <file>
```
