import type { Level } from '../content/curriculum'
import { resolveLandingPath } from './landing'

const noop = () => Promise.resolve({ default: () => null })
const levels: Level[] = [
  { id: 'beginner', title: 'Beginner', modules: [
    { id: 'basics', title: 'Basics', lessons: [{ id: 'what-is-cc', title: 'W', content: noop }] },
  ] },
  { id: 'intermediate', title: 'Intermediate', modules: [
    { id: 'workflows', title: 'Workflows', lessons: [{ id: 'slash-commands', title: 'S', content: noop }] },
  ] },
]

test('not onboarded → /onboarding', () => {
  expect(resolveLandingPath(levels, { onboarded: false, level: null, lastLesson: null })).toBe('/onboarding')
})

test('onboarded with a lastLesson → that path', () => {
  expect(
    resolveLandingPath(levels, { onboarded: true, level: 'beginner', lastLesson: '/learn/intermediate/workflows/slash-commands' }),
  ).toBe('/learn/intermediate/workflows/slash-commands')
})

test('onboarded, no lastLesson, with level → first lesson of that level', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: 'intermediate', lastLesson: null })).toBe(
    '/learn/intermediate/workflows/slash-commands',
  )
})

test('onboarded, no lastLesson, no level → global first lesson', () => {
  expect(resolveLandingPath(levels, { onboarded: true, level: null, lastLesson: null })).toBe(
    '/learn/beginner/basics/what-is-cc',
  )
})

test('onboarded but no lessons exist → null', () => {
  expect(resolveLandingPath([], { onboarded: true, level: null, lastLesson: null })).toBeNull()
})
