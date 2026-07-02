import { Node, SyntaxKind } from 'ts-morph'
import type { ArrayLiteralExpression, ObjectLiteralExpression, SourceFile } from 'ts-morph'
import { sq } from './tsutil.ts'

function getStringProp(obj: ObjectLiteralExpression, name: string): string | undefined {
  const prop = obj.getProperty(name)
  if (!prop || !Node.isPropertyAssignment(prop)) return undefined
  const init = prop.getInitializer()
  return init && Node.isStringLiteral(init) ? init.getLiteralText() : undefined
}

function getArrayProp(obj: ObjectLiteralExpression, name: string): ArrayLiteralExpression {
  return obj
    .getPropertyOrThrow(name)
    .asKindOrThrow(SyntaxKind.PropertyAssignment)
    .getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

function findById(arr: ArrayLiteralExpression, id: string): ObjectLiteralExpression | undefined {
  return arr
    .getElements()
    .filter(Node.isObjectLiteralExpression)
    .find((el) => getStringProp(el, 'id') === id)
}

function curriculumArray(sf: SourceFile): ArrayLiteralExpression {
  return sf.getVariableDeclarationOrThrow('curriculum').getInitializerIfKindOrThrow(SyntaxKind.ArrayLiteralExpression)
}

export function ensureLevel(sf: SourceFile, level: { id: string; title: string }): ObjectLiteralExpression {
  const arr = curriculumArray(sf)
  const existing = findById(arr, level.id)
  if (existing) return existing
  arr.addElement(`{ id: ${sq(level.id)}, title: ${sq(level.title)}, modules: [] }`)
  return findById(arr, level.id)!
}

export function ensureModule(levelObj: ObjectLiteralExpression, module: { id: string; title: string }): ObjectLiteralExpression {
  const modules = getArrayProp(levelObj, 'modules')
  const existing = findById(modules, module.id)
  if (existing) return existing
  modules.addElement(`{ id: ${sq(module.id)}, title: ${sq(module.title)}, lessons: [] }`)
  return findById(modules, module.id)!
}

export function addLesson(moduleObj: ObjectLiteralExpression, lesson: { id: string; title: string; importPath: string }): boolean {
  const lessons = getArrayProp(moduleObj, 'lessons')
  if (findById(lessons, lesson.id)) return false
  lessons.addElement(`{ id: ${sq(lesson.id)}, title: ${sq(lesson.title)}, content: () => import(${sq(lesson.importPath)}) }`)
  return true
}
