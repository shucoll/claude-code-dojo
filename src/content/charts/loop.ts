import type { ChartDef } from './types'

/**
 * Demo chart for the interactive-charts machinery. Exercises all three node
 * kinds: popup (prompt, bash), lesson target (edit), and targetless hub (agent).
 * Positions are hand-authored in the 0–100 viewBox space.
 */
export const loop: ChartDef = {
  id: 'loop',
  title: 'The Claude Code loop',
  nodes: [
    {
      id: 'prompt',
      label: 'Prompt',
      x: 50,
      y: 12,
      target: { kind: 'popup', title: 'Prompt', content: () => import('./popups/prompt.mdx') },
    },
    { id: 'agent', label: 'Agent', x: 50, y: 45 },
    {
      id: 'edit',
      label: 'Edit',
      x: 26,
      y: 80,
      target: { kind: 'lesson', ref: { level: 'beginner', module: 'basics', lesson: 'first-edit' } },
    },
    {
      id: 'bash',
      label: 'Bash',
      x: 74,
      y: 80,
      target: { kind: 'popup', title: 'Bash', content: () => import('./popups/bash.mdx') },
    },
  ],
  edges: [
    { from: 'prompt', to: 'agent' },
    { from: 'agent', to: 'edit' },
    { from: 'agent', to: 'bash' },
  ],
}
