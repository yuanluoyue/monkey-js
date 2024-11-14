import { LetStatement, MacroLiteral } from './ast.js'
import { Macro } from './object.js'

function isMacroDefinition(node) {
  let letStatement = node
  if (!(letStatement instanceof LetStatement)) {
    return false
  }

  let macroLiteral = letStatement.value
  if (!(macroLiteral instanceof MacroLiteral)) {
    return false
  }

  return true
}

function addMacro(stmt, env) {
  let letStatement = stmt
  if (!(letStatement instanceof LetStatement)) {
    throw new Error('Expected LetStatement type')
  }

  let macroLiteral = letStatement.value
  if (!(macroLiteral instanceof MacroLiteral)) {
    throw new Error('Expected MacroLiteral type')
  }

  let macro = new Macro(macroLiteral.parameters, macroLiteral.body, env)

  env.set(letStatement.name.value, macro)
}

export function defineMacros(program, env) {
  let definitions = []

  for (let i = 0; i < program.statements.length; i++) {
    let statement = program.statements[i]
    if (isMacroDefinition(statement)) {
      addMacro(statement, env)
      definitions.push(i)
    }
  }

  for (let i = definitions.length - 1; i >= 0; i--) {
    let definitionIndex = definitions[i]
    program.statements = program.statements
      .slice(0, definitionIndex)
      .concat(program.statements.slice(definitionIndex + 1))
  }
}
