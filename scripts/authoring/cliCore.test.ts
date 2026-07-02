// @vitest-environment node
import { run } from './cliCore.ts'

let logSpy: ReturnType<typeof vi.spyOn>
let errSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  logSpy.mockRestore()
  errSpy.mockRestore()
})

test('check returns 0 on the clean repo', () => {
  expect(run(['check'])).toBe(0)
})

test('lesson with missing required flags returns 2 and prints a clean error (no crash)', () => {
  expect(run(['lesson'])).toBe(2)
  expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('missing required flag'))
})

test('an unknown command returns 2', () => {
  expect(run(['bogus'])).toBe(2)
})
