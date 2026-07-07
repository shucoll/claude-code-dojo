import type { ChartDef } from './types'

/** Loop dogfood: gather → act → verify → (repeat). Proves cycle layout. */
export const agenticLoopDiagram: ChartDef = {
  id: 'agentic-loop-diagram',
  title: 'The agentic loop',
  subtitle: 'gather context → take action → verify, then repeat',
  rows: [
    {
      kind: 'flow',
      direction: 'LR',
      nodes: [
        {
          id: 'gather',
          title: 'Gather context',
          lines: ['read files, search the repo'],
          tone: 'blue',
          target: { kind: 'popup', title: 'Gather context', content: () => import('./popups/agentic-gather.mdx') },
        },
        {
          id: 'act',
          title: 'Take action',
          lines: ['edit code, run commands'],
          tone: 'violet',
          target: { kind: 'popup', title: 'Take action', content: () => import('./popups/agentic-act.mdx') },
        },
        {
          id: 'verify',
          title: 'Verify',
          lines: ['run tests, review the diff'],
          tone: 'teal',
          target: { kind: 'popup', title: 'Verify results', content: () => import('./popups/agentic-verify.mdx') },
        },
      ],
      edges: [
        { from: 'gather', to: 'act' },
        { from: 'act', to: 'verify' },
        { from: 'verify', to: 'gather', label: 'repeat' },
      ],
    },
  ],
}
