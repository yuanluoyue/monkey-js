import {
  LetStatement,
  MacroLiteral,
  CallExpression,
  Identifier,
} from './ast.js'
import { Macro, Quote } from './object.js'
import { modify } from './quote.js'
import { newEnclosedEnvironment, evalMonkey } from './evaluator.js'

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

export function expandMacros(program, env) {
  return modify(program, (node) => {
    let callExpression = node
    if (!(callExpression instanceof CallExpression)) {
      return node
    }

    if (!isMacroCall(callExpression, env)) {
      return node
    }

    const macro = env.get(callExpression.function.value)
    const args = quoteArgs(callExpression)
    const evalEnv = extendMacroEnv(macro, args)

    const evaluated = evalMonkey(macro.body, evalEnv)

    const quote = evaluated

    if (!(quote instanceof Quote)) {
      throw new Error('we only support returning AST-nodes from macros')
    }

    return quote.node
  })
}

function isMacroCall(exp, env) {
  const identifier = exp.function
  if (!(identifier instanceof Identifier)) {
    return false
  }

  const obj = env.get(identifier.value)
  if (!obj) {
    return false
  }

  const macro = obj
  if (!(macro instanceof Macro)) {
    return false
  }

  return true
}

function quoteArgs(exp) {
  const args = []

  for (let a of exp.arguments) {
    args.push(new Quote(a))
  }

  return args
}

function extendMacroEnv(macro, args) {
  const extended = newEnclosedEnvironment(macro.Env)

  for (let i = 0; i < macro.parameters.length; i++) {
    const param = macro.parameters[i]
    extended.set(param.value, args[i])
  }

  return extended
}
