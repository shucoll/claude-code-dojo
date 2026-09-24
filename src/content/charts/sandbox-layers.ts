import type { ComponentType } from 'react'

import type { ChartDef } from './types'

const popup = (title: string, content: () => Promise<{ default: ComponentType }>) =>
  ({ kind: 'popup' as const, title, content })

/**
 * The isolation ladder for A3.2, ordered by what sits inside the boundary
 * rather than by how hard each one is to set up.
 *
 * The connectors carry the argument. The first rung isolates shell commands
 * and their children, which leaves file tools, MCP servers, and hooks running
 * on the host: that gap is exactly what A3.1's config payload exploits, and
 * the second rung closes it by wrapping the whole Claude Code process in the
 * same Seatbelt or bubblewrap primitives. The third rung adds an operating
 * system around the process, and the fourth adds a kernel.
 *
 * A2.4 reuses this chart for the sandboxing non-negotiable, so every popup
 * states what the tier isolates and what it still lets through, readable on
 * its own without the lesson around it.
 */
export const sandboxLayers: ChartDef = {
  id: 'sandbox-layers',
  title: 'What is inside the boundary?',
  subtitle: 'Six isolation options, ordered by how much of the session the boundary encloses.',
  rows: [
    {
      kind: 'cards',
      cards: [
        {
          id: 'bash-sandbox',
          title: 'Sandboxed Bash tool',
          lines: ['Bash, PowerShell, Monitor, and their children', 'built in · no Docker'],
          tone: 'blue',
          target: popup('Sandboxed Bash tool', () => import('./popups/sandbox-bash-tool.mdx')),
        },
      ],
    },
    {
      kind: 'connector',
      label: 'file tools, MCP servers, and hooks are still on the host; wrapping the whole process brings them in',
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'sandbox-runtime',
          title: 'Sandbox runtime',
          lines: ['every tool, hook, and MCP server in the session', 'beta research preview · no Docker'],
          tone: 'teal',
          target: popup('Sandbox runtime', () => import('./popups/sandbox-runtime.mdx')),
        },
      ],
    },
    { kind: 'connector', label: 'add an operating system around the process' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'dev-container',
          title: 'Dev container',
          lines: ['a full development environment', 'Docker · one config per repository'],
          tone: 'violet',
          target: popup('Dev container', () => import('./popups/sandbox-dev-container.mdx')),
        },
        {
          id: 'custom-container',
          title: 'Custom container',
          lines: ['a full development environment', 'Docker · your image, your policies'],
          tone: 'violet',
          target: popup('Custom container', () => import('./popups/sandbox-custom-container.mdx')),
        },
      ],
    },
    { kind: 'connector', label: 'add a kernel' },
    {
      kind: 'cards',
      cards: [
        {
          id: 'virtual-machine',
          title: 'Virtual machine',
          lines: ['a full operating system you run', 'strongest separation · highest setup'],
          tone: 'amber',
          target: popup('Virtual machine', () => import('./popups/sandbox-virtual-machine.mdx')),
        },
        {
          id: 'cloud-session',
          title: 'Cloud session',
          lines: ['a full operating system Anthropic runs', 'no setup · needs a subscription'],
          tone: 'amber',
          target: popup('Cloud session', () => import('./popups/sandbox-cloud-session.mdx')),
        },
      ],
    },
  ],
}
