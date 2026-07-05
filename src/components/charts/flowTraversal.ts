import type { FlowNode, FlowEdge } from '../../content/charts/types'

/** The entry node: the one that never appears as an edge target. Expected role 'question'. */
export function findRoot(nodes: FlowNode[], edges: FlowEdge[]): FlowNode {
  const targets = new Set(edges.map((e) => e.to))
  return nodes.find((n) => !targets.has(n.id)) ?? nodes[0]
}

/** Outgoing edges of a node, in authored array order (= option order). */
export function optionsAt(nodeId: string, edges: FlowEdge[]): FlowEdge[] {
  return edges.filter((e) => e.from === nodeId)
}

/** A terminus: role 'leaf', or (defensively) a node with no outgoing edges. */
export function isLeaf(node: FlowNode, edges: FlowEdge[]): boolean {
  return node.role === 'leaf' || optionsAt(node.id, edges).length === 0
}

/** The chosen answer labels, in order, for the path-summary strip. */
export function pathSummary(steps: FlowEdge[]): string[] {
  return steps.map((e) => e.label ?? '…')
}
