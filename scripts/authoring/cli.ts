import fs from 'node:fs'
import { scaffoldLesson, scaffoldOutline, type Outline, type ScaffoldReport } from './scaffold.ts'
import { scaffoldLanguage } from './language.ts'
import { checkSnippets } from './check.ts'

function parseFlags(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      out[arg.slice(2)] = argv[i + 1] ?? ''
      i++
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

const [command, ...rest] = process.argv.slice(2)
const flags = parseFlags(rest)

switch (command) {
  case 'lesson': {
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
    break
  }
  case 'outline': {
    const outline = JSON.parse(fs.readFileSync(flags.file, 'utf8')) as Outline
    report(scaffoldOutline(outline))
    break
  }
  case 'language': {
    report(scaffoldLanguage({ id: flags.id, label: flags.label, icon: flags.icon || undefined }))
    break
  }
  case 'check': {
    const { errors, warnings } = checkSnippets()
    for (const w of warnings) console.log(`warn  ${w}`)
    for (const e of errors) console.error(`ERROR ${e}`)
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s)`)
    if (errors.length > 0) process.exit(1)
    break
  }
  default:
    console.error(`Unknown command: ${command ?? '(none)'}. Use: lesson | outline | language | check`)
    process.exit(2)
}
