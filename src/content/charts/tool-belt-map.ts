import type { ChartDef } from './types'

/**
 * The built-in tool belt, grouped by risk tier. A reference grid, not a
 * narrative: grid rows draw no connecting arrows, because the tiers have no
 * order. Tone carries the grouping and the risk gradient — teal runs free,
 * blue/amber/violet each ask before a different kind of side effect, neutral
 * delegation defers the asking to the subagent's own calls.
 *
 * Cards are inert: individual tools have no home lesson. The chart's job is to
 * make the tier → prompt mapping legible at a glance, which is the bridge into
 * permission rules (I1.2).
 */
export const toolBeltMap: ChartDef = {
  id: 'tool-belt-map',
  title: 'The tool belt, by risk tier',
  subtitle: 'The tier predicts the prompt: read-only runs free; anything with a side effect asks first.',
  rows: [
    {
      kind: 'grid',
      label: 'Read-only: runs without asking',
      columns: 2,
      items: [
        { id: 'read', title: 'Read', tone: 'teal', lines: ['Open a file and read its contents'] },
        { id: 'grep', title: 'Grep', tone: 'teal', lines: ['Search inside files (ripgrep)'] },
        { id: 'glob', title: 'Glob', tone: 'teal', lines: ['Find files by name pattern'] },
        { id: 'lsp', title: 'LSP', tone: 'teal', lines: ['Definitions, references, type errors'] },
      ],
      caption:
        'These still prompt when a path is outside your project folder: the read boundary from B1.3, now enforced tool by tool.',
    },
    {
      kind: 'grid',
      label: 'Writes files: asks first',
      columns: 3,
      items: [
        { id: 'edit', title: 'Edit', tone: 'blue', lines: ['Exact find-and-replace in one file'] },
        { id: 'write', title: 'Write', tone: 'blue', lines: ['Create or overwrite a whole file'] },
        { id: 'notebookedit', title: 'NotebookEdit', tone: 'blue', lines: ['Edit Jupyter notebook cells'] },
      ],
    },
    {
      kind: 'grid',
      label: 'Runs commands: asks first',
      columns: 3,
      items: [
        { id: 'bash', title: 'Bash', tone: 'amber', lines: ['Run any shell command'] },
        { id: 'powershell', title: 'PowerShell', tone: 'amber', lines: ['Run PowerShell (Windows / opt-in)'] },
        { id: 'monitor', title: 'Monitor', tone: 'amber', lines: ['Watch a log or process in the background'] },
      ],
      caption:
        'Bash sits in this tier, but its built-in read-only commands (ls, cat, git status) run without a prompt.',
    },
    {
      kind: 'grid',
      label: 'Leaves your machine: asks first',
      columns: 2,
      items: [
        { id: 'webfetch', title: 'WebFetch', tone: 'violet', lines: ['Fetch a URL, summarized by a fast model'] },
        { id: 'websearch', title: 'WebSearch', tone: 'violet', lines: ['Search the web for titles and links'] },
      ],
    },
    {
      kind: 'grid',
      label: 'Delegates the work',
      columns: 2,
      items: [
        { id: 'agent', title: 'Agent', tone: 'neutral', lines: ['Hand a task to a subagent with its own context'] },
      ],
      caption:
        'Launching a subagent never prompts on its own; each tool the subagent then uses is checked against your rules just like your own calls.',
    },
  ],
}
