import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })
const popup = (title: string, content: () => Promise<{ default: React.ComponentType }>) => ({
  kind: 'popup' as const,
  title,
  content,
})

const B3_1: LessonRef = {
  level: 'beginner',
  module: 'teaching-claude-your-project',
  lesson: 'claude-md-fundamentals',
}
const I2_2: LessonRef = { level: 'intermediate', module: 'context-engineering', lesson: 'claude-md-at-scale' }
const I3_1: LessonRef = { level: 'intermediate', module: 'skills', lesson: 'skills-teachable-procedures' }
const I5_1: LessonRef = { level: 'intermediate', module: 'mcp-servers', lesson: 'mcp-giving-claude-new-tools' }
const I6_1: LessonRef = {
  level: 'intermediate',
  module: 'subagents',
  lesson: 'subagents-context-isolation-and-delegation',
}

/**
 * The filesystem tour that makes the rest of the level legible, and a reference
 * the learner returns to all level long. Grouped by who sees the file, because
 * that is the commit-vs-gitignore question the lesson has to settle.
 *
 * Tone carries that grouping: blue = committed (the team gets it), amber =
 * gitignored (just you), neutral = your home directory. Rose marks the one
 * genuine trap, `~/.claude.json`.
 *
 * Following `command-belt-reference`: an entry whose feature has a home lesson
 * links there, so the map doubles as the level's navigation surface. The
 * settings files, which this lesson owns, open a popup instead.
 */
export const dotClaudeDirectoryMap: ChartDef = {
  id: 'dot-claude-directory-map',
  title: 'The .claude directory',
  subtitle: 'Click an entry to open what it holds, or to jump to the lesson that teaches it.',
  rows: [
    {
      kind: 'grid',
      label: 'In your project, committed: your team gets these',
      columns: 2,
      items: [
        {
          id: 'claude-md',
          title: 'CLAUDE.md',
          tone: 'blue',
          lines: ['Project instructions, read every session'],
          target: lesson(B3_1),
        },
        {
          id: 'settings-json',
          title: '.claude/settings.json',
          tone: 'blue',
          lines: ['Permissions, hooks, env, plugins'],
          target: popup('.claude/settings.json', () => import('./popups/dir-settings-json.mdx')),
        },
        {
          id: 'rules',
          title: '.claude/rules/',
          tone: 'blue',
          lines: ['Topic-scoped instructions'],
          target: lesson(I2_2),
        },
        {
          id: 'skills',
          title: '.claude/skills/',
          tone: 'blue',
          lines: ['Procedures Claude can invoke'],
          target: lesson(I3_1),
        },
        {
          id: 'agents',
          title: '.claude/agents/',
          tone: 'blue',
          lines: ['Custom subagents'],
          target: lesson(I6_1),
        },
        {
          id: 'mcp-json',
          title: '.mcp.json',
          tone: 'blue',
          lines: ['Project MCP servers'],
          target: lesson(I5_1),
        },
      ],
      caption: '.mcp.json is the odd one: it sits at the repository root, not inside .claude/.',
    },
    {
      kind: 'grid',
      label: 'In your project, gitignored: just you',
      columns: 2,
      items: [
        {
          id: 'settings-local-json',
          title: '.claude/settings.local.json',
          tone: 'amber',
          lines: ['Your overrides for this one project'],
          target: popup('.claude/settings.local.json', () => import('./popups/dir-settings-local-json.mdx')),
        },
      ],
    },
    {
      kind: 'grid',
      label: 'In your home directory: every project',
      columns: 2,
      items: [
        {
          id: 'user-settings',
          title: '~/.claude/settings.json',
          lines: ['Your defaults everywhere'],
          target: popup('~/.claude/settings.json', () => import('./popups/dir-user-settings-json.mdx')),
        },
        {
          id: 'user-claude-md',
          title: '~/.claude/CLAUDE.md',
          lines: ['Personal preferences everywhere'],
          target: lesson(B3_1),
        },
        {
          id: 'user-skills',
          title: '~/.claude/skills/',
          lines: ['Personal skills, every project'],
          target: lesson(I3_1),
        },
        {
          id: 'user-agents',
          title: '~/.claude/agents/',
          lines: ['Personal subagents, every project'],
          target: lesson(I6_1),
        },
        {
          id: 'claude-json',
          title: '~/.claude.json',
          tone: 'rose',
          lines: ['App state, not settings'],
          target: popup('~/.claude.json', () => import('./popups/dir-claude-json.mdx')),
        },
      ],
      caption:
        'The same shapes as your project, one scope wider. ~/.claude.json is the exception, and the classic trap.',
    },
  ],
}
