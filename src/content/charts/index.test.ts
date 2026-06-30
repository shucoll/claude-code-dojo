import { getChart } from './index'

test('getChart returns the demo loop chart by id', () => {
  const chart = getChart('loop')
  expect(chart?.id).toBe('loop')
  expect(chart?.nodes).toHaveLength(4)
  expect(chart?.edges).toHaveLength(3)
})

test('getChart returns undefined for an unknown id', () => {
  expect(getChart('nope')).toBeUndefined()
})

test('loop chart exercises all three node kinds', () => {
  const nodes = getChart('loop')!.nodes
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))
  expect(byId.prompt.target?.kind).toBe('popup')
  expect(byId.bash.target?.kind).toBe('popup')
  expect(byId.edit.target?.kind).toBe('lesson')
  expect(byId.agent.target).toBeUndefined() // targetless hub
})
