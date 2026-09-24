import type { ComponentType } from 'react'

import type { ChartDef, LessonRef } from './types'

const lesson = (ref: LessonRef) => ({ kind: 'lesson' as const, ref })

const home = (module: string, lesson: string): LessonRef => ({ level: 'advanced', module, lesson })

const popup = (title: string, content: () => Promise<{ default: ComponentType }>) =>
  ({ kind: 'popup' as const, title, content })

/**
 * The Advanced level's signature resolver, built on the three decision
 * questions the official `agents` page poses rather than on a feature list.
 *
 * Question order is the reconciliation. Coordination is asked first because it
 * is the only question that rules a mechanism in rather than out: workers that
 * must claim shared work and challenge each other leave one answer. Who holds
 * the plan comes next, separating a script from turn-by-turn judgment. File
 * contention is asked last because it changes how you run the chosen mechanism
 * more often than it changes which one you pick, and it is where worktrees
 * enter the decision.
 *
 * Deviation from the spec's Interactive row, recorded per the chart-reuse rule:
 * the row asked for the tree alone. The two rows after it carry the "not a
 * fifth option" disambiguation and the out-of-scope note, which the curriculum
 * requires the lesson to make and which belong beside the tree rather than
 * buried in prose, since a learner who reads the `agents` page sees five rows
 * where this shows four.
 */
export const orchestrationDecisionTree: ChartDef = {
  id: 'orchestration-decision-tree',
  title: 'Which way of running more than one Claude?',
  subtitle: 'Three questions: who coordinates, who holds the plan, and whether the work collides.',
  rows: [
    {
      kind: 'flow',
      direction: 'TB',
      guided: true,
      nodes: [
        {
          id: 'q-coordinate',
          title: 'Do the workers need to coordinate?',
          lines: [
            'Claiming work off a shared list and challenging each other,',
            'without the caller in the loop.',
          ],
          role: 'question',
        },
        {
          id: 'q-plan',
          title: 'Who holds the plan?',
          lines: ['Claude deciding turn by turn, or a script holding the loop.'],
          role: 'question',
        },
        {
          id: 'q-handoff',
          title: 'Do you want to hand it off and check back?',
          lines: ['You steering each turn, or collecting a finished result later.'],
          role: 'question',
        },

        {
          id: 'teams',
          title: 'Agent team',
          role: 'leaf',
          tone: 'rose',
          lines: [
            'A lead assigns, teammates claim and message each other directly.',
            'No worktree isolation, so partition the files yourself.',
          ],
          target: lesson(home('orchestration-and-parallel-work', 'agent-teams-deep-dive')),
        },
        {
          id: 'workflow',
          title: 'Dynamic workflow',
          role: 'leaf',
          tone: 'violet',
          lines: [
            'A script Claude wrote runs dozens to hundreds of subagents.',
            'Results live in script variables, so only the answer reaches you.',
          ],
          target: lesson(home('orchestration-and-parallel-work', 'dynamic-workflows')),
        },
        {
          id: 'agent-view',
          title: 'Agent view',
          role: 'leaf',
          tone: 'blue',
          lines: [
            'Background sessions you dispatch and monitor from one screen.',
            'Each isolates itself in a worktree before it edits.',
          ],
          target: lesson(home('orchestration-and-parallel-work', 'agent-view-and-dispatch')),
        },
        {
          id: 'subagents',
          title: 'Subagents',
          role: 'leaf',
          tone: 'teal',
          lines: [
            'Delegated workers inside one session, returning a summary.',
            'The cheapest answer, and usually the right one.',
          ],
          target: lesson({ level: 'intermediate', module: 'subagents', lesson: 'subagents-context-isolation-and-delegation' }),
        },
      ],
      edges: [
        { from: 'q-coordinate', to: 'teams', label: 'yes, they work as peers' },
        { from: 'q-coordinate', to: 'q-plan', label: 'no, they report back' },

        { from: 'q-plan', to: 'workflow', label: 'a script, at scale' },
        { from: 'q-plan', to: 'q-handoff', label: 'Claude, turn by turn' },

        { from: 'q-handoff', to: 'agent-view', label: 'hand off, check back' },
        { from: 'q-handoff', to: 'subagents', label: 'stay in the conversation' },
      ],
    },
    { kind: 'connector', label: 'worktrees are the isolation layer under all four' },
    {
      kind: 'grid',
      columns: 2,
      label: 'Things that look like a fifth option',
      items: [
        {
          id: 'batch',
          title: '/batch',
          lines: ['a skill over subagents and worktrees'],
          tone: 'neutral',
          target: popup('/batch', () => import('./popups/not-fifth-batch.mdx')),
        },
        {
          id: 'forked-subagent',
          title: 'A forked subagent',
          lines: ['a subagent that inherits your context'],
          tone: 'neutral',
          target: popup('A forked subagent', () => import('./popups/not-fifth-forked-subagent.mdx')),
        },
        {
          id: 'background-bash',
          title: 'A background bash command',
          lines: ['no agent is spawned at all'],
          tone: 'neutral',
          target: popup('A background bash command', () => import('./popups/not-fifth-background-bash.mdx')),
        },
        {
          id: 'routine',
          title: 'A routine',
          lines: ['a schedule for one session'],
          tone: 'neutral',
          target: popup('A routine', () => import('./popups/not-fifth-routine.mdx')),
        },
      ],
    },
    {
      kind: 'cards',
      cards: [
        {
          id: 'projects',
          title: 'Projects: a real fifth mechanism, deliberately out of scope',
          lines: ['Cloud threads for work that outlives your machine being on. Named here for orientation.'],
          tone: 'amber',
          target: popup('Projects', () => import('./popups/orchestration-projects.mdx')),
        },
      ],
    },
  ],
}
