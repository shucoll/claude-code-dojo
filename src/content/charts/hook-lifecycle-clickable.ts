import type { ChartDef } from './types'

/**
 * The session → turn → tool-call lifecycle with the main hookable events as
 * clickable nodes. Each event node opens a popup describing when it fires and
 * what you would bind to it; the two loops (the tool loop and the turn loop)
 * are labeled edges. Phase 1: a static diagram, not a guided traversal.
 */
export const hookLifecycleClickable: ChartDef = {
  id: 'hook-lifecycle-clickable',
  title: 'Where hooks fire',
  subtitle: 'the session, turn, and tool-call lifecycle. Click an event to see what you can bind to it',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      nodes: [
        {
          id: 'session-start',
          title: 'SessionStart',
          lines: ['a session begins or resumes'],
          tone: 'blue',
          target: { kind: 'popup', title: 'SessionStart', content: () => import('./popups/hook-session-start.mdx') },
        },
        {
          id: 'user-prompt',
          title: 'UserPromptSubmit',
          lines: ['you send a prompt'],
          tone: 'blue',
          target: { kind: 'popup', title: 'UserPromptSubmit', content: () => import('./popups/hook-user-prompt-submit.mdx') },
        },
        {
          id: 'pre-tool',
          title: 'PreToolUse',
          lines: ['before a tool runs; can block'],
          tone: 'amber',
          target: { kind: 'popup', title: 'PreToolUse', content: () => import('./popups/hook-pre-tool-use.mdx') },
        },
        {
          id: 'tool-runs',
          title: 'the tool runs',
          lines: ['Bash, Edit, Read, an MCP tool…'],
          tone: 'neutral',
        },
        {
          id: 'post-tool',
          title: 'PostToolUse',
          lines: ['after a tool succeeds'],
          tone: 'violet',
          target: { kind: 'popup', title: 'PostToolUse', content: () => import('./popups/hook-post-tool-use.mdx') },
        },
        {
          id: 'stop',
          title: 'Stop',
          lines: ['Claude finishes the turn; can refuse'],
          tone: 'teal',
          target: { kind: 'popup', title: 'Stop', content: () => import('./popups/hook-stop.mdx') },
        },
        {
          id: 'notification',
          title: 'Notification',
          lines: ['Claude needs your input'],
          tone: 'amber',
          target: { kind: 'popup', title: 'Notification', content: () => import('./popups/hook-notification.mdx') },
        },
        {
          id: 'pre-compact',
          title: 'PreCompact',
          lines: ['the window fills, before it compacts'],
          tone: 'neutral',
          target: { kind: 'popup', title: 'PreCompact', content: () => import('./popups/hook-pre-compact.mdx') },
        },
        {
          id: 'session-end',
          title: 'SessionEnd',
          lines: ['the session ends'],
          tone: 'neutral',
          target: { kind: 'popup', title: 'SessionEnd', content: () => import('./popups/hook-session-end.mdx') },
        },
      ],
      edges: [
        { from: 'session-start', to: 'user-prompt', label: 'you type' },
        { from: 'user-prompt', to: 'pre-tool', label: 'Claude acts' },
        { from: 'pre-tool', to: 'tool-runs', label: 'allowed' },
        { from: 'pre-tool', to: 'notification', label: 'needs you' },
        { from: 'tool-runs', to: 'post-tool' },
        { from: 'post-tool', to: 'pre-tool', label: 'more tools' },
        { from: 'post-tool', to: 'pre-compact', label: 'window fills' },
        { from: 'post-tool', to: 'stop', label: 'turn done' },
        { from: 'stop', to: 'user-prompt', label: 'next prompt' },
        { from: 'stop', to: 'session-end', label: 'you quit' },
      ],
    },
  ],
}
