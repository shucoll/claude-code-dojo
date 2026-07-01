/** Single-quoted, escaped string-literal text for insertion into generated TS. */
export function sq(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/** Strip a single layer of surrounding straight quotes from a property name. */
export function unquote(name: string): string {
  return name.replace(/^['"]|['"]$/g, '')
}
