import { IndentationText, Project, QuoteKind } from 'ts-morph'
import type { SourceFile } from 'ts-morph'

/**
 * A ts-morph Project tuned to match the codebase style, so inserted nodes come
 * out with 2-space indentation, single quotes, and trailing commas.
 */
export function newProject(): Project {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
      indentationText: IndentationText.TwoSpaces,
      useTrailingCommas: true,
    },
  })
}

/** Normalise whitespace to the codebase's 2-space style, then persist to disk. */
export function formatAndSave(sf: SourceFile): void {
  sf.formatText({ indentSize: 2, tabSize: 2, convertTabsToSpaces: true })
  sf.saveSync()
}

/**
 * Single-quoted, escaped string-literal text for insertion into generated TS.
 * Escapes backslashes, single quotes, and newlines so the emitted literal is
 * always syntactically valid, even for multi-line input.
 */
export function sq(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
  return `'${escaped}'`
}

/** Strip a single layer of surrounding straight quotes from a property name. */
export function unquote(name: string): string {
  return name.replace(/^['"]|['"]$/g, '')
}
