import type { ChartDef, LessonRef } from './types'

const B1_2: LessonRef = {
  level: 'beginner',
  module: 'meet-claude-code',
  lesson: 'what-claude-code-is-and-where-it-lives',
}
const B2_1: LessonRef = {
  level: 'beginner',
  module: 'sessions-and-context',
  lesson: 'your-first-working-session',
}
const B2_2: LessonRef = {
  level: 'beginner',
  module: 'sessions-and-context',
  lesson: 'the-context-window',
}
const B2_4: LessonRef = {
  level: 'beginner',
  module: 'sessions-and-context',
  lesson: 'clear-vs-compact-vs-new-session',
}
const B2_5: LessonRef = {
  level: 'beginner',
  module: 'sessions-and-context',
  lesson: 'sessions-resume-name-branch',
}
const B3_1: LessonRef = {
  level: 'beginner',
  module: 'teaching-claude-your-project',
  lesson: 'claude-md-fundamentals',
}
const B3_4: LessonRef = {
  level: 'beginner',
  module: 'teaching-claude-your-project',
  lesson: 'checkpoints-your-undo-button',
}

const lesson = (ref: LessonRef, anchor?: string) => ({
  kind: 'lesson' as const,
  ref: anchor ? { ...ref, anchor } : ref,
})

/**
 * The command belt: a reference grid, not a narrative. Grid rows never draw
 * connecting arrows, because these commands have no order. Tone carries the
 * grouping: blue = memorize it, neutral = look it up, teal = not a command.
 *
 * Every entry links to the lesson that teaches it, so the grid doubles as a
 * navigation surface. The three with no home lesson open a popup instead.
 */
export const commandBeltReference: ChartDef = {
  id: 'command-belt-reference',
  title: 'The command belt',
  subtitle: 'Click any entry to jump to where it is taught.',
  rows: [
    {
      kind: 'grid',
      label: 'The daily seven',
      columns: 2,
      items: [
        {
          id: 'help',
          title: '/help',
          tone: 'blue',
          lines: ['List every command available right now'],
          target: { kind: 'popup', title: '/help', content: () => import('./popups/cmd-help.mdx') },
        },
        {
          id: 'context',
          title: '/context',
          tone: 'blue',
          lines: ['See what is filling your context window'],
          target: lesson(B2_2, 'watching-a-session-fill'),
        },
        {
          id: 'compact',
          title: '/compact',
          tone: 'blue',
          lines: ['Summarize the conversation to free space'],
          target: lesson(B2_4),
        },
        {
          id: 'clear',
          title: '/clear',
          tone: 'blue',
          lines: ['Start a fresh conversation, empty context'],
          target: lesson(B2_4),
        },
        {
          id: 'resume',
          title: '/resume',
          tone: 'blue',
          lines: ['Pick up an earlier conversation'],
          target: lesson(B2_5),
        },
        {
          id: 'rewind',
          title: '/rewind',
          tone: 'blue',
          lines: ['Undo code, conversation, or both'],
          target: lesson(B3_4),
        },
        {
          id: 'model',
          title: '/model',
          tone: 'blue',
          lines: ['Switch which Claude model you are using'],
          target: lesson(B1_2, 'faq'),
        },
      ],
    },
    {
      kind: 'grid',
      label: 'Worth knowing, look them up',
      columns: 2,
      items: [
        {
          id: 'init',
          title: '/init',
          lines: ['Generate a CLAUDE.md for this project'],
          target: lesson(B3_1),
        },
        {
          id: 'memory',
          title: '/memory',
          lines: ['Edit CLAUDE.md and inspect auto memory'],
          target: lesson(B3_1),
        },
        {
          id: 'usage',
          title: '/usage',
          lines: ['Check token usage and cost'],
          target: { kind: 'popup', title: '/usage', content: () => import('./popups/cmd-usage.mdx') },
        },
        {
          id: 'recap',
          title: '/recap',
          lines: ['Summarize this session in one line'],
          target: { kind: 'popup', title: '/recap', content: () => import('./popups/cmd-recap.mdx') },
        },
      ],
    },
    {
      kind: 'grid',
      label: 'Not commands at all',
      columns: 3,
      items: [
        {
          id: 'esc',
          title: 'Esc',
          tone: 'teal',
          lines: ['Interrupt Claude mid-turn'],
          target: lesson(B2_1, 'steer-while-claude-works'),
        },
        {
          id: 'bang',
          title: '!',
          tone: 'teal',
          lines: ['Run a shell command directly'],
          // Introduced alongside `! git diff`, not in the steering section.
          target: lesson(B2_1, 'move-3-read-the-diff-before-you-accept'),
        },
        {
          id: 'at',
          title: '@',
          tone: 'teal',
          lines: ['Hand Claude an exact file'],
          target: lesson(B2_1, 'steer-while-claude-works'),
        },
      ],
      caption:
        'These three are typed into the prompt, not invoked as commands, and you will reach for them more than most of the slash commands above.',
    },
  ],
}
