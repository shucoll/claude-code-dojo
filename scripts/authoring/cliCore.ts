import fs from 'node:fs'
import { scaffoldLesson, scaffoldOutline, type Outline, type ScaffoldReport } from './scaffold.ts'
import { scaffoldLanguage } from './language.ts'
import { checkSnippets } from './check.ts'

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--')) continue
    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      out[arg.slice(2)] = next
      i++
    } else {
      out[arg.slice(2)] = ''
    }
  }
  return out
}

function titleCase(id: string): string {
  return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function report(r: ScaffoldReport): void {
  for (const f of r.created) console.log(`created ${f}`)
  for (const f of r.changed) console.log(`changed ${f}`)
}

function requireFlags(flags: Record<string, string>, names: string[], command: string): void {
  const missing = names.filter((n) => !flags[n])
  if (missing.length > 0) {
    throw new Error(`${command}: missing required flag(s): ${missing.map((n) => `--${n}`).join(', ')}`)
  }
}

export function run(argv: string[]): number {
  const [command, ...rest] = argv
  const flags = parseFlags(rest)
  try {
    switch (command) {
      case 'lesson': {
        requireFlags(flags, ['level', 'module', 'id', 'title'], 'lesson')
        report(
          scaffoldLesson({
            level: { id: flags.level, title: flags['level-title'] || titleCase(flags.level) },
            module: { id: flags.module, title: flags['module-title'] || titleCase(flags.module) },
            id: flags.id,
            title: flags.title,
            snippets: flags.snippets ? flags.snippets.split(',') : undefined,
            prompts: flags.prompts ? flags.prompts.split(',') : undefined,
          }),
        )
        return 0
      }
      case 'outline': {
        requireFlags(flags, ['file'], 'outline')
        const outline = JSON.parse(fs.readFileSync(flags.file, 'utf8')) as Outline
        report(scaffoldOutline(outline))
        return 0
      }
      case 'language': {
        requireFlags(flags, ['id', 'label'], 'language')
        report(scaffoldLanguage({ id: flags.id, label: flags.label, icon: flags.icon || undefined }))
        return 0
      }
      case 'check': {
        const { errors, warnings } = checkSnippets()
        for (const w of warnings) console.log(`warn  ${w}`)
        for (const e of errors) console.error(`ERROR ${e}`)
        console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
        return errors.length > 0 ? 1 : 0
      }
      default:
        console.error(`Unknown command: ${command ?? '(none)'}. Use: lesson | outline | language | check`)
        return 2
    }
  } catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
    return 2
  }
}
