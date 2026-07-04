import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { layoutFlow } from './flowLayout'
import type { FlowEdge, FlowNode } from '../../content/charts/types'

const nodes: FlowNode[] = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B' },
  { id: 'c', title: 'C' },
]

test('lays out a small tree: children rank below the root (TB)', async () => {
  const edges: FlowEdge[] = [
    { from: 'a', to: 'b' },
    { from: 'a', to: 'c' },
  ]
  const layout = await layoutFlow(nodes, edges, 'TB')
  expect(layout.nodes).toHaveLength(3)
  expect(layout.edges).toHaveLength(2)
  const a = layout.nodes.find((n) => n.node.id === 'a')!
  const b = layout.nodes.find((n) => n.node.id === 'b')!
  expect(b.y).toBeGreaterThan(a.y)
  expect(layout.width).toBeGreaterThan(0)
  expect(layout.edges[0].points.length).toBeGreaterThan(0)
})

test('is deterministic (same input => same positions)', async () => {
  const edges: FlowEdge[] = [{ from: 'a', to: 'b' }]
  const two = nodes.slice(0, 2)
  const l1 = await layoutFlow(two, edges)
  const l2 = await layoutFlow(two, edges)
  expect(l1.nodes.map((n) => [n.x, n.y])).toEqual(l2.nodes.map((n) => [n.x, n.y]))
})

test('lays out a cyclic graph without throwing', async () => {
  const edges: FlowEdge[] = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'a', label: 'repeat' },
  ]
  const layout = await layoutFlow(nodes, edges, 'LR')
  expect(layout.nodes).toHaveLength(3)
  expect(layout.edges).toHaveLength(3)
  expect(layout.edges[2].labelPoint).toBeDefined()
})

test('dagre is code-split: dynamic import only, no top-level import', () => {
  const src = readFileSync(join(import.meta.dirname, 'flowLayout.ts'), 'utf8')
  expect(src).toMatch(/import\(\s*['"]@dagrejs\/dagre['"]\s*\)/)
  expect(src).not.toMatch(/^\s*import\s+[^\n]*['"]@dagrejs\/dagre['"]/m)
})
