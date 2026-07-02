import fs from 'node:fs'
import { SyntaxKind } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, packFile, packsIndexFile } from './paths.ts'
import { formatAndSave, newProject, sq } from './tsutil.ts'
import type { ScaffoldReport } from './scaffold.ts'

export interface LanguageSpec {
  id: string
  label: string
  icon?: string
}

const IDENTIFIER = /^[a-zA-Z_$][\w$]*$/

// Words that pass the identifier regex but would produce invalid TS as a
// `const <id>` binding (reserved / strict-mode-reserved), or are unsafe as an
// object-literal property name on LANGUAGE_PACKS.
const RESERVED = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'let', 'static', 'yield', 'await', 'implements', 'interface',
  'package', 'private', 'protected', 'public', '__proto__', 'constructor', 'prototype',
])

export function scaffoldLanguage(spec: LanguageSpec, contentDir: string = DEFAULT_CONTENT_DIR): ScaffoldReport {
  if (!IDENTIFIER.test(spec.id) || RESERVED.has(spec.id)) {
    throw new Error(`language id "${spec.id}" is not a usable identifier`)
  }
  const file = packFile(contentDir, spec.id)
  if (fs.existsSync(file)) throw new Error(`pack already exists: ${spec.id}`)

  const iconLine = spec.icon ? `, icon: ${sq(spec.icon)}` : ''
  const body = `import type { LanguagePack } from '../types'

const ${spec.id}: LanguagePack = {
  meta: { id: ${sq(spec.id)}, label: ${sq(spec.label)}${iconLine} },
  snippets: {},
  prompts: {},
}

export default ${spec.id}
`

  const project = newProject()
  const index = project.addSourceFileAtPath(packsIndexFile(contentDir))
  index.addImportDeclaration({ defaultImport: spec.id, moduleSpecifier: `./${spec.id}` })
  index
    .getVariableDeclarationOrThrow('LANGUAGE_PACKS')
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
    .addShorthandPropertyAssignment({ name: spec.id })

  fs.writeFileSync(file, body)
  formatAndSave(index)

  return { created: [file], changed: [packsIndexFile(contentDir)] }
}
