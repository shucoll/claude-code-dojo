import fs from 'node:fs'
import path from 'node:path'
import { Project } from 'ts-morph'
import { DEFAULT_CONTENT_DIR, DEFAULT_LANGUAGE, STUB, lessonsDir, packFile, snippetsDir } from './paths.ts'
import { readPack } from './packs.ts'

export interface CheckResult {
  errors: string[]
  warnings: string[]
}

function listPackIds(contentDir: string): string[] {
  return fs
    .readdirSync(snippetsDir(contentDir))
    .filter((f) => f.endsWith('.ts') && !f.startsWith('index.') && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''))
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

function scanLessonRefs(dir: string): { snippets: Set<string>; prompts: Set<string> } {
  const snippets = new Set<string>()
  const prompts = new Set<string>()
  for (const file of walk(dir)) {
    if (!file.endsWith('.mdx')) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const m of text.matchAll(/<Snippet\s+id=["']([^"']+)["']/g)) snippets.add(m[1])
    for (const m of text.matchAll(/<TryPrompt\s+id=["']([^"']+)["']/g)) prompts.add(m[1])
  }
  return { snippets, prompts }
}

export function checkSnippets(contentDir: string = DEFAULT_CONTENT_DIR): CheckResult {
  const errors: string[] = []
  const warnings: string[] = []
  const project = new Project({ skipAddingFilesFromTsConfig: true })

  const packs: Record<string, { snippets: Record<string, string>; prompts: Record<string, string> }> = {}
  for (const id of listPackIds(contentDir)) packs[id] = readPack(project.addSourceFileAtPath(packFile(contentDir, id)))
  const def = packs[DEFAULT_LANGUAGE]
  if (!def) throw new Error(`default pack "${DEFAULT_LANGUAGE}" not found`)

  const refs = scanLessonRefs(lessonsDir(contentDir))
  for (const id of refs.snippets) {
    if (!(id in def.snippets)) errors.push(`Snippet id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }
  for (const id of refs.prompts) {
    if (!(id in def.prompts)) errors.push(`Prompt id "${id}" is referenced in a lesson but missing from the default pack (${DEFAULT_LANGUAGE}).`)
  }

  for (const [id, pack] of Object.entries(packs)) {
    if (id !== DEFAULT_LANGUAGE) {
      for (const key of Object.keys(def.snippets)) {
        if (!(key in pack.snippets)) warnings.push(`${id}: missing snippet "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
      for (const key of Object.keys(def.prompts)) {
        if (!(key in pack.prompts)) warnings.push(`${id}: missing prompt "${key}" (falls back to ${DEFAULT_LANGUAGE}).`)
      }
    }
    for (const [key, value] of Object.entries(pack.snippets)) {
      if (value.includes(STUB)) warnings.push(`${id}: snippet "${key}" is still a TODO stub.`)
    }
    for (const [key, value] of Object.entries(pack.prompts)) {
      if (value.includes(STUB)) warnings.push(`${id}: prompt "${key}" is still a TODO stub.`)
    }
  }

  return { errors, warnings }
}
