import type { ComponentType } from 'react'

import type { ChartDef } from './types'

const popup = (title: string, content: () => Promise<{ default: ComponentType }>) =>
  ({ kind: 'popup' as const, title, content })

/**
 * The cache board for A4.1, sorted by what each action does to the prefix
 * rather than by how it feels to run.
 *
 * The middle band is the point of the chart. Three of the actions developers
 * are most often told to avoid mid-session (connecting an MCP server, toggling
 * a plugin, denying a tool by bare name) cost nothing in the default
 * configuration, because tool search defers MCP tool definitions and leaves the
 * request's tool list alone. They only cost something when tool definitions
 * load into the prefix. Effort sits in the same band for a different reason:
 * Opus 5.5 and Fable 5.1 keep the cache on an API key or a subscription, and
 * every other model rebuilds.
 */
export const cacheInvalidationBoard: ChartDef = {
  id: 'cache-invalidation-board',
  title: 'What survives the prefix?',
  subtitle:
    'Every action sorted by what it does to the cached prefix. The middle band depends on whether tool definitions sit in the prefix at all.',
  rows: [
    {
      kind: 'grid',
      label: 'Keeps the cache',
      columns: 2,
      items: [
        {
          id: 'edit-repo-files',
          title: 'Editing repository files',
          tone: 'teal',
          lines: ['A change notice appends; the earlier read stays as it was'],
        },
        {
          id: 'edit-claude-md',
          title: 'Editing CLAUDE.md mid-session',
          tone: 'teal',
          lines: ['Kept for the same reason the edit does not apply yet'],
          target: popup('Editing CLAUDE.md mid-session', () => import('./popups/cache-claude-md-mid-session.mdx')),
        },
        {
          id: 'permission-mode',
          title: 'Changing permission mode',
          tone: 'teal',
          lines: ['Plan mode included, unless the model setting is opusplan'],
          target: popup('Changing permission mode', () => import('./popups/cache-permission-mode.mdx')),
        },
        {
          id: 'output-style',
          title: 'Changing output style',
          tone: 'teal',
          lines: ['The new instructions arrive as a conversation message'],
        },
        {
          id: 'skills-and-commands',
          title: 'Invoking skills and commands',
          tone: 'teal',
          lines: ['Injected as user messages at the point of invocation'],
        },
        {
          id: 'recap',
          title: 'Running /recap',
          tone: 'teal',
          lines: ['Appends the summary rather than replacing the history'],
        },
        {
          id: 'rewind',
          title: 'Running /rewind',
          tone: 'teal',
          lines: ['Truncates back to a prefix that is already warm'],
          target: popup('Running /rewind', () => import('./popups/cache-rewind.mdx')),
        },
        {
          id: 'subagents',
          title: 'Spawning a subagent',
          tone: 'teal',
          lines: ['Its own cache, and the parent prefix is untouched'],
          target: popup('Spawning a subagent', () => import('./popups/cache-subagents.mdx')),
        },
      ],
    },
    {
      kind: 'connector',
      label: 'these four cost nothing in the default configuration, and everything when tool definitions load into the prefix',
    },
    {
      kind: 'grid',
      label: 'Depends on the configuration',
      columns: 2,
      items: [
        {
          id: 'mcp-server',
          title: 'Connecting or disconnecting an MCP server',
          tone: 'amber',
          lines: ['Free while tool search defers the server tools'],
          target: popup('Connecting or disconnecting an MCP server', () => import('./popups/cache-mcp-server.mdx')),
        },
        {
          id: 'plugin-toggle',
          title: 'Enabling or disabling a plugin',
          tone: 'amber',
          lines: ['Free unless the plugin provides MCP servers'],
          target: popup('Enabling or disabling a plugin', () => import('./popups/cache-plugin-toggle.mdx')),
        },
        {
          id: 'deny-tool',
          title: 'Denying a tool by bare name',
          tone: 'amber',
          lines: ['Free while tool search is active; scoped rules always free'],
          target: popup('Denying a tool by bare name', () => import('./popups/cache-deny-tool.mdx')),
        },
        {
          id: 'effort-level',
          title: 'Changing effort level',
          tone: 'amber',
          lines: ['Free on Opus 5.5 and Fable 5.1 with an API key or subscription'],
          target: popup('Changing effort level', () => import('./popups/cache-effort-level.mdx')),
        },
      ],
    },
    {
      kind: 'connector',
      label: 'below this line the next request reads the conversation with no cache hits',
    },
    {
      kind: 'grid',
      label: 'Rebuilds the cache',
      columns: 2,
      items: [
        {
          id: 'model-switch',
          title: 'Switching models',
          tone: 'rose',
          lines: ['Including opusplan, model fallback, and a skill naming a model'],
          target: popup('Switching models', () => import('./popups/cache-model-switch.mdx')),
        },
        {
          id: 'fast-mode',
          title: 'Turning on fast mode',
          tone: 'rose',
          lines: ['Once per conversation, billed at fast mode rates'],
          target: popup('Turning on fast mode', () => import('./popups/cache-fast-mode.mdx')),
        },
        {
          id: 'compaction',
          title: 'Compacting the conversation',
          tone: 'rose',
          lines: ['The conversation layer by design; cheap while the cache is warm'],
          target: popup('Compacting the conversation', () => import('./popups/cache-compaction.mdx')),
        },
        {
          id: 'images',
          title: 'Accumulating many images',
          tone: 'rose',
          lines: ['One slower turn each time a batch of old images is dropped'],
          target: popup('Accumulating many images', () => import('./popups/cache-images.mdx')),
        },
        {
          id: 'upgrade',
          title: 'Upgrading Claude Code',
          tone: 'rose',
          lines: ['Applies on the next launch, so the first turn after a restart'],
        },
      ],
    },
  ],
}
