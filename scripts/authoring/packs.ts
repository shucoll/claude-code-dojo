import { Node, SyntaxKind } from 'ts-morph'
import type { ObjectLiteralExpression, SourceFile } from 'ts-morph'
import { STUB } from './paths.ts'

function sq(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function unquote(name: string): string {
  return name.replace(/^['"]|['"]$/g, '')
}

function packObject(sf: SourceFile): ObjectLiteralExpression {
  const decl = sf.getVariableDeclarations().find((d) => d.getTypeNode()?.getText() === 'LanguagePack')
  if (!decl) throw new Error('no `: LanguagePack` declaration found in pack file')
  return decl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
}

function sectionObject(sf: SourceFile, section: 'snippets' | 'prompts'): ObjectLiteralExpression {
  return packObject(sf)
    .getPropertyOrThrow(section)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression)
}

function hasKey(obj: ObjectLiteralExpression, key: string): boolean {
  return obj.getProperties().some((p) => Node.isPropertyAssignment(p) && unquote(p.getName()) === key)
}

function readSection(sf: SourceFile, section: 'snippets' | 'prompts'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const p of sectionObject(sf, section).getProperties()) {
    if (Node.isPropertyAssignment(p)) out[unquote(p.getName())] = p.getInitializerOrThrow().getText()
  }
  return out
}

export function readPack(sf: SourceFile): { snippets: Record<string, string>; prompts: Record<string, string> } {
  return { snippets: readSection(sf, 'snippets'), prompts: readSection(sf, 'prompts') }
}

export function addSnippetStub(sf: SourceFile, key: string): boolean {
  const snippets = sectionObject(sf, 'snippets')
  if (hasKey(snippets, key)) return false
  snippets.addPropertyAssignment({
    name: sq(key),
    initializer: `{ filename: ${sq(key)}, code: ${sq(`// ${STUB} snippet: ${key}`)} }`,
  })
  return true
}

export function addPromptStub(sf: SourceFile, key: string): boolean {
  const prompts = sectionObject(sf, 'prompts')
  if (hasKey(prompts, key)) return false
  prompts.addPropertyAssignment({ name: sq(key), initializer: sq(`${STUB} prompt: ${key}`) })
  return true
}
