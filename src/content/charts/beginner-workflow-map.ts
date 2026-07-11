import type { ChartDef, LessonRef } from './types'

// The level's navigation hub: each stage of the loop links to the lesson that
// teaches it, so this diagram doubles as a map back into the whole Beginner
// level. Homes are the most precise section, not just the lesson top.
const B2_1: LessonRef = {
  level: 'beginner',
  module: 'sessions-and-context',
  lesson: 'your-first-working-session',
}
const B3_3: LessonRef = {
  level: 'beginner',
  module: 'teaching-claude-your-project',
  lesson: 'permission-modes-and-plan-mode',
}
const B3_5: LessonRef = {
  level: 'beginner',
  module: 'teaching-claude-your-project',
  lesson: 'plan-mode-vs-make-a-plan-vs-just-prompting',
}
const B4_1: LessonRef = {
  level: 'beginner',
  module: 'the-beginner-workflow',
  lesson: 'prompting-an-agent',
}
const B4_3: LessonRef = {
  level: 'beginner',
  module: 'the-beginner-workflow',
  lesson: 'git-and-claude-code',
}
const B4_4: LessonRef = {
  level: 'beginner',
  module: 'the-beginner-workflow',
  lesson: 'course-correcting-and-knowing-when-to-bail',
}

const lesson = (ref: LessonRef, anchor?: string) => ({
  kind: 'lesson' as const,
  ref: anchor ? { ...ref, anchor } : ref,
})

/**
 * The Beginner capstone loop: explore → plan → code → verify → commit, with the
 * failure branch (verify fails → steer → retry) drawn in, because the failure
 * branch is part of the happy path, not an exception to it. Every stage node
 * links to its home lesson so the map is the level's navigation surface.
 */
export const beginnerWorkflowMap: ChartDef = {
  id: 'beginner-workflow-map',
  title: 'The beginner workflow',
  subtitle: 'One repeatable loop. Click any stage to revisit where it was taught.',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      nodes: [
        {
          id: 'explore',
          title: '1 · Explore',
          tone: 'blue',
          lines: ['Ask the codebase questions', 'in plan mode, before changing anything'],
          target: lesson(B3_3, 'what-plan-mode-actually-prevents'),
        },
        {
          id: 'plan',
          title: '2 · Plan',
          tone: 'violet',
          lines: ['Get a plan you can read', 'and fix mistakes while they are cheap'],
          target: lesson(B3_5, 'which-one-as-a-ladder'),
        },
        {
          id: 'code',
          title: '3 · Code',
          tone: 'amber',
          lines: ['Let Claude implement', 'and read each diff before you accept'],
          target: lesson(B2_1, 'move-3-read-the-diff-before-you-accept'),
        },
        {
          id: 'verify',
          title: '4 · Verify',
          tone: 'teal',
          lines: ['Run the check Claude can read', 'tests, build, a screenshot'],
          target: lesson(B4_1, '2-give-it-something-to-verify-against'),
        },
        {
          id: 'commit',
          title: '5 · Commit',
          tone: 'rose',
          lines: ['A small, reviewed commit', 'message drafted from the diff'],
          target: lesson(B4_3),
        },
        {
          id: 'steer',
          title: 'Steer, don’t restart',
          tone: 'neutral',
          lines: ['When verify fails, redirect', 'and only reset when steering stops working'],
          target: lesson(B4_4),
        },
      ],
      edges: [
        { from: 'explore', to: 'plan' },
        { from: 'plan', to: 'code' },
        { from: 'code', to: 'verify' },
        { from: 'verify', to: 'commit', label: 'passes' },
        { from: 'verify', to: 'steer', label: 'fails' },
        { from: 'steer', to: 'code', label: 'retry' },
        { from: 'commit', to: 'explore', label: 'next change' },
      ],
    },
  ],
}
