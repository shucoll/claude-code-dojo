import { findRoot, optionsAt, isLeaf, pathSummary } from './flowTraversal'
import type { FlowNode, FlowEdge } from '../../content/charts/types'

const nodes: FlowNode[] = [
  { id: 'root', title: 'Root', role: 'question' },
  { id: 'mid', title: 'Mid', role: 'question' },
  { id: 'a', title: 'Leaf A', role: 'leaf' },
  { id: 'b', title: 'Leaf B', role: 'leaf' },
]
const edges: FlowEdge[] = [
  { from: 'root', to: 'mid', label: 'deeper' },
  { from: 'root', to: 'b', label: 'shortcut' },
  { from: 'mid', to: 'a', label: 'pick A' },
]

test('findRoot returns the single node with no incoming edges', () => {
  expect(findRoot(nodes, edges).id).toBe('root')
})

test('findRoot falls back to the first node when every node has an incoming edge', () => {
  const cyclic: FlowEdge[] = [
    { from: 'root', to: 'mid' },
    { from: 'mid', to: 'root' },
  ]
  expect(findRoot([nodes[0], nodes[1]], cyclic).id).toBe('root')
})

test('optionsAt returns outgoing edges in authored array order', () => {
  const opts = optionsAt('root', edges)
  expect(opts.map((e) => e.label)).toEqual(['deeper', 'shortcut'])
})

test('isLeaf is true for role leaf and for a node with no outgoing edges', () => {
  expect(isLeaf(nodes[2], edges)).toBe(true) // role leaf
  expect(isLeaf({ id: 'mid', title: 'Mid', role: 'question' }, [])).toBe(true) // no outgoing
})

test('isLeaf is false for a question with outgoing edges', () => {
  expect(isLeaf(nodes[0], edges)).toBe(false)
})

test('pathSummary maps chosen edge labels in order, with a fallback for missing labels', () => {
  expect(pathSummary([edges[0], edges[2]])).toEqual(['deeper', 'pick A'])
  expect(pathSummary([{ from: 'x', to: 'y' }])).toEqual(['…'])
})
