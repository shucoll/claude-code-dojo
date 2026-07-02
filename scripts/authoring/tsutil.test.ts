// @vitest-environment node
import { sq, unquote } from './tsutil.ts'

test('sq escapes single quotes and backslashes', () => {
  expect(sq("it's")).toBe("'it\\'s'")
  expect(sq('a\\b')).toBe("'a\\\\b'")
})

test('sq escapes newlines and carriage returns so the literal stays valid', () => {
  expect(sq('line1\nline2')).toBe("'line1\\nline2'")
  expect(sq('a\rb')).toBe("'a\\rb'")
})

test('unquote strips one layer of surrounding straight quotes', () => {
  expect(unquote("'foo'")).toBe('foo')
  expect(unquote('"bar"')).toBe('bar')
  expect(unquote('baz')).toBe('baz')
})
