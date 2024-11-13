import {
  IntegerLiteral,
  BooleanLiteral,
  ExpressionStatement,
  Program,
  PrefixExpression,
  InfixExpression,
  BlockStatement,
  IfExpression,
  ReturnStatement,
  LetStatement,
  Identifier,
  FunctionLiteral,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  IndexExpression,
  HashLiteral,
} from './ast.js'

import { TokenType } from './token.js'

const MonkeyObjectType = {
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  RETURN_VALUE: 'RETURN_VALUE',
  ERROR: 'ERROR',
  FUNCTION: 'FUNCTION',
  STRING: 'STRING',
  BUILTIN: 'BUILTIN',
  ARRAY: 'ARRAY',
  HASH: 'HASH',
}

class MonkeyObject {
  type() {
    throw new Error('Object type method must be implemented.')
  }
  inspect() {
    throw new Error('Object inspect method must be implemented.')
  }
}

export class MonkeyInteger extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.INTEGER
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyBoolean extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.BOOLEAN
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyString extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.STRING
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyNull extends MonkeyObject {
  type() {
    return MonkeyObjectType.NULL
  }

  inspect() {
    return 'null'
  }
}

export class MonkeyReturnValue extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.RETURN_VALUE
  }

  inspect() {
    return this.value.toString()
  }
}

export class MonkeyError extends MonkeyObject {
  constructor(message) {
    super()
    this.message = message
  }
  type() {
    return MonkeyObjectType.ERROR
  }
  inspect() {
    return 'ERROR: ' + this.message
  }
}

export class MonkeyFunction {
  constructor(parameters, body, env) {
    this.parameters = parameters
    this.body = body
    this.env = env
  }
  type() {
    return MonkeyObjectType.FUNCTION
  }
  inspect() {
    let params = []
    for (const p of this.parameters) {
      params.push(p.getString())
    }
    let out = `fn(${params.join(', ')}) {\n${this.body.getString()}\n}`
    return out
  }
}

export class MonkeyArray {
  constructor(elements) {
    this.elements = elements
  }

  type() {
    return MonkeyObjectType.ARRAY
  }

  inspect() {
    let out = ''

    const elementsStr = []
    for (const e of this.elements) {
      elementsStr.push(e.inspect())
    }

    out += '['
    out += elementsStr.join(', ')
    out += ']'

    return out
  }
}

export class MonkeyHash {
  constructor(pairs) {
    this.pairs = pairs
  }

  type() {
    return MonkeyObjectType.HASH
  }

  inspect() {
    let out = ''

    const elementsStr = []
    for (const key in this.pairs) {
      const keyObj = JSON.parse(key)

      elementsStr.push(`${keyObj.value}: ${this.pairs[key].inspect()}`)
    }

    out += '{'
    out += elementsStr.join(', ')
    out += '}'

    return out
  }
}

class MonkeyBuiltin {
  constructor(fn) {
    this.fn = fn
  }

  type() {
    return MonkeyObjectType.BUILTIN
  }

  inspect() {
    return 'builtin function'
  }
}

class MonkeyEnvironment {
  constructor(outer = null) {
    this.store = {}
    this.outer = outer
  }

  get(name) {
    let obj = this.store?.[name]
    if (!obj && this.outer) {
      return this.outer.get(name)
    }
    return obj
  }

  set(name, val) {
    this.store[name] = val
    return val
  }
}

const singleTrue = new MonkeyBoolean(true)
const singleFalse = new MonkeyBoolean(false)
const singleNull = new MonkeyNull(false)

const builtins = {
  len: new MonkeyBuiltin((arg, ...residueArgs) => {
    if (residueArgs.length > 0) {
      return newMonkeyError(
        'wrong number of arguments. got=' +
          (residueArgs.length + 1) +
          ', want=1'
      )
    }

    if (arg instanceof MonkeyString) {
      return new MonkeyInteger(arg.value.length)
    } else if (arg instanceof MonkeyArray) {
      return new MonkeyInteger(arg.elements.length)
    } else {
      return newMonkeyError(
        'argument to `len` not supported, got ' + arg.type()
      )
    }
  }),

  first: new MonkeyBuiltin((arg, ...residueArgs) => {
    if (residueArgs.length > 0) {
      return newMonkeyError(
        'wrong number of arguments. got=' +
          (residueArgs.length + 1) +
          ', want=1'
      )
    }

    if (arg.type() !== MonkeyObjectType.ARRAY) {
      return newError('argument to `first` must be ARRAY, got ' + arg.type())
    }

    if (arg.elements.length > 0) {
      return arg.elements[0]
    }

    return singleNull
  }),

  last: new MonkeyBuiltin((arg, ...residueArgs) => {
    if (residueArgs.length > 0) {
      return newMonkeyError(
        'wrong number of arguments. got=' +
          (residueArgs.length + 1) +
          ', want=1'
      )
    }

    if (arg.type() !== MonkeyObjectType.ARRAY) {
      return newError('argument to `first` must be ARRAY, got ' + arg.type())
    }

    const len = arg.elements.length
    if (len > 0) {
      return arg.elements[len - 1]
    }

    return singleNull
  }),

  rest: new MonkeyBuiltin((arg, ...residueArgs) => {
    if (residueArgs.length > 0) {
      return newMonkeyError(
        'wrong number of arguments. got=' +
          (residueArgs.length + 1) +
          ', want=1'
      )
    }

    if (arg.type() !== MonkeyObjectType.ARRAY) {
      return newError('argument to `first` must be ARRAY, got ' + arg.type())
    }

    const len = arg.elements.length
    if (len > 0) {
      const newElements = []
      for (let i = 1; i < len; i++) {
        newElements.push(arg.elements[i])
      }
      return new MonkeyArray(newElements)
    }

    return singleNull
  }),

  push: new MonkeyBuiltin((arg, ...residueArgs) => {
    if (residueArgs.length > 1) {
      return newMonkeyError(
        'wrong number of arguments. got=' +
          (residueArgs.length + 1) +
          ', want=1'
      )
    }

    if (arg.type() !== MonkeyObjectType.ARRAY) {
      return newError('argument to `first` must be ARRAY, got ' + arg.type())
    }

    const len = arg.elements.length
    const newElements = []

    for (let i = 0; i < len; i++) {
      newElements.push(arg.elements[i])
    }

    newElements.push(...residueArgs)

    return new MonkeyArray(newElements)
  }),
}

function newMonkeyError(format, ...a) {
  return new MonkeyError(
    format.replace(/%[sd]/g, (match) => {
      const arg = a.shift()
      return typeof arg === 'string' || typeof arg === 'number'
        ? arg.toString()
        : match
    })
  )
}

export function newEnvironment() {
  return new MonkeyEnvironment()
}

function newEnclosedEnvironment(outer) {
  return new MonkeyEnvironment(outer)
}

function nativeBoolToBooleanObject(bool) {
  return bool ? singleTrue : singleFalse
}

function isError(obj) {
  return obj && obj.type() === MonkeyObjectType.ERROR
}

function isTruthy(obj) {
  if (obj instanceof MonkeyInteger && obj.value !== 0) {
    return true
  }

  switch (obj) {
    case singleTrue:
      return true
    case singleNull:
    case singleFalse:
    default:
      return false
  }
}

function unwrapReturnValue(obj) {
  if (obj instanceof MonkeyReturnValue) {
    return obj.value
  }
  return obj
}

function evalProgram(program, env) {
  let result
  for (const statement of program) {
    result = evalMonkey(statement, env)
    if (result instanceof MonkeyError) {
      return result
    } else if (result instanceof MonkeyReturnValue) {
      return result.value
    }
  }
  return result
}

function evalBlockStatement(statements, env) {
  let result
  for (const statement of statements) {
    result = evalMonkey(statement, env)
    const type = result.type()
    if (
      result &&
      (type === MonkeyObjectType.RETURN_VALUE ||
        type === MonkeyObjectType.ERROR)
    ) {
      return result
    }
  }
  return result
}

function evalBangOperatorExpression(right) {
  switch (right.value) {
    case true:
      return singleFalse
    case false:
      return singleTrue
    case null:
    case undefined:
      return singleTrue
    default:
      return singleFalse
  }
}

function evalMinusPrefixOperatorExpression(right) {
  if (right.type() !== MonkeyObjectType.INTEGER) {
    return newMonkeyError(`unknown operator: -${right.type()}`)
  }
  const value = right.value
  return new MonkeyInteger(-value)
}

function evalPrefixExpression(operator, right) {
  switch (operator) {
    case TokenType.BANG:
      return evalBangOperatorExpression(right)
    case TokenType.MINUS:
      return evalMinusPrefixOperatorExpression(right)
    default:
      return newMonkeyError(`unknown operator: ${operator}${right.type()}`)
  }
}

function evalIntegerInfixExpression(operator, left, right) {
  const leftVal = left.value
  const rightVal = right.value

  switch (operator) {
    case TokenType.PLUS:
      return new MonkeyInteger(leftVal + rightVal)
    case TokenType.MINUS:
      return new MonkeyInteger(leftVal - rightVal)
    case TokenType.ASTERISK:
      return new MonkeyInteger(leftVal * rightVal)
    case TokenType.SLASH:
      return new MonkeyInteger(leftVal / rightVal)
    case TokenType.LT:
      return new nativeBoolToBooleanObject(leftVal < rightVal)
    case TokenType.GT:
      return new nativeBoolToBooleanObject(leftVal > rightVal)
    case TokenType.EQ:
      return new nativeBoolToBooleanObject(leftVal === rightVal)
    case TokenType.NOT_EQ:
      return new nativeBoolToBooleanObject(leftVal !== rightVal)
    default:
      return newMonkeyError(
        `type mismatch: ${left.type()} ${operator} ${right.type()}`
      )
  }
}

function evalStringInfixExpression(operator, left, right) {
  if (operator !== TokenType.PLUS) {
    return newMonkeyError(
      'unknown operator: ' + left.type() + ' ' + operator + ' ' + right.type()
    )
  }

  const leftVal = left.value
  const rightVal = right.value
  return new MonkeyString(leftVal + rightVal)
}

function evalInfixExpression(operator, left, right) {
  if (
    left.type() === MonkeyObjectType.INTEGER &&
    right.type() === MonkeyObjectType.INTEGER
  ) {
    return evalIntegerInfixExpression(operator, left, right)
  }

  if (
    left.type() === MonkeyObjectType.STRING &&
    right.type() === MonkeyObjectType.STRING
  ) {
    return evalStringInfixExpression(operator, left, right)
  }

  switch (true) {
    case operator === TokenType.EQ:
      return nativeBoolToBooleanObject(left === right)
    case operator === TokenType.NOT_EQ:
      return nativeBoolToBooleanObject(left !== right)
    case left.type !== right.type:
      return newMonkeyError(
        `type mismatch: ${left.type()} ${operator} ${right.type()}`
      )
    default:
      return newMonkeyError(
        `unknown operator: ${left.type()} ${operator} ${right.type()}`
      )
  }
}

function evalIfExpression(ifExpression, env) {
  const condition = evalMonkey(ifExpression.condition, env)

  if (isError(condition)) {
    return condition
  }

  if (isTruthy(condition)) {
    return evalMonkey(ifExpression.consequence, env)
  } else if (ifExpression.alternative && ifExpression.alternative.token) {
    return evalMonkey(ifExpression.alternative, env)
  } else {
    return singleNull
  }
}

function evalIdentifier(node, env) {
  const val = env.get(node?.value)

  if (val) {
    return val
  }

  const builtin = builtins[node?.value]

  if (builtin) {
    return builtin
  }

  return newMonkeyError(`identifier not found: ${node?.value}`)
}

function evalExpressions(expressions, env) {
  const result = []
  for (const expression of expressions) {
    const evaluated = evalMonkey(expression, env)
    if (isError(evaluated)) {
      return [evaluated]
    }
    result.push(evaluated)
  }
  return result
}

function extendFunctionEnv(fn, args) {
  const env = newEnclosedEnvironment(fn.env)
  for (let paramIdx = 0; paramIdx < fn.parameters.length; paramIdx++) {
    env.set(fn.parameters[paramIdx].value, args[paramIdx])
  }
  return env
}

function applyFunction(fnObj, args) {
  switch (true) {
    case fnObj instanceof MonkeyFunction:
      const extendedEnv = extendFunctionEnv(fnObj, args)
      const evaluated = evalMonkey(fnObj.body, extendedEnv)
      return unwrapReturnValue(evaluated)

    case fnObj instanceof MonkeyBuiltin:
      return fnObj.fn(...args)

    default:
      return newError('not a function: ' + fn.type())
  }
}

function evalArrayIndexExpression(array, index) {
  const arrayObject = array
  const idx = index.value
  const max = arrayObject.elements.length - 1

  if (idx < 0 || idx > max) {
    return singleNull
  }

  return arrayObject.elements[idx]
}

function evalHashIndexExpression(hash, index) {
  const hashObject = hash

  if (
    !(
      index instanceof MonkeyString ||
      index instanceof MonkeyBoolean ||
      index instanceof MonkeyInteger
    )
  ) {
    return newMonkeyError('unusable as hash key: ' + index.type())
  }

  const key = index
  const pair = hashObject.pairs[key.hashKey()]

  if (!pair) {
    return singleNull
  }

  return pair
}

function evalIndexExpression(left, index) {
  if (
    left.type() === MonkeyObjectType.ARRAY &&
    index.type() === MonkeyObjectType.INTEGER
  ) {
    return evalArrayIndexExpression(left, index)
  } else if (left.type() === MonkeyObjectType.HASH) {
    return evalHashIndexExpression(left, index)
  } else {
    return newMonkeyError('index operator not supported: ' + left.type())
  }
}

function evalHashLiteral(node, env) {
  const pairs = {}
  for (let [keyNode, valueNode] of node.pairs) {
    const key = evalMonkey(keyNode, env)
    if (isError(key)) {
      return key
    }

    const value = evalMonkey(valueNode, env)
    if (isError(value)) {
      return value
    }

    let hashed = key.hashKey()
    pairs[hashed] = value
  }

  return new MonkeyHash(pairs)
}

export function evalMonkey(node, env = newEnvironment()) {
  switch (true) {
    case node instanceof Program:
      return evalProgram(node.statements, env)
    case node instanceof ExpressionStatement:
      return evalMonkey(node.expression, env)
    case node instanceof IntegerLiteral:
      return new MonkeyInteger(node.value)
    case node instanceof StringLiteral:
      return new MonkeyString(node.value)
    case node instanceof BooleanLiteral:
      return nativeBoolToBooleanObject(node.value)
    case node instanceof PrefixExpression:
      const right = evalMonkey(node.right, env)
      if (isError(right)) {
        return right
      }
      return evalPrefixExpression(node.operator, right)
    case node instanceof InfixExpression: {
      const left = evalMonkey(node.left, env)
      if (isError(left)) {
        return left
      }
      const right = evalMonkey(node.right, env)

      if (isError(right)) {
        return right
      }
      return evalInfixExpression(node.operator, left, right)
    }
    case node instanceof BlockStatement:
      return evalBlockStatement(node.statements, env)
    case node instanceof IfExpression:
      return evalIfExpression(node, env)
    case node instanceof ReturnStatement:
      const val = evalMonkey(node.returnValue, env)
      if (isError(val)) {
        return val
      }
      return new MonkeyReturnValue(val)
    case node instanceof LetStatement: {
      const val = evalMonkey(node.value, env)
      if (isError(val)) {
        return val
      }
      env.set(node.name.value, val)
      return val
    }
    case node instanceof Identifier:
      return evalIdentifier(node, env)
    case node instanceof FunctionLiteral: {
      const params = node.parameters
      const body = node.body
      return new MonkeyFunction(params, body, env)
    }
    case node instanceof CallExpression:
      const functionObj = evalMonkey(node.function, env)
      if (isError(functionObj)) {
        return functionObj
      }

      const args = evalExpressions(node.arguments, env)
      if (args.length === 1 && isError(args[0])) {
        return args[0]
      }
      return applyFunction(functionObj, args)
    case node instanceof ArrayLiteral:
      const elements = evalExpressions(node.elements, env)
      if (elements.length === 1 && isError(elements[0])) {
        return elements[0]
      }
      return new MonkeyArray(elements)
    case node instanceof IndexExpression:
      const left = evalMonkey(node.left, env)
      if (isError(left)) {
        return left
      }
      const index = evalMonkey(node.index, env)
      if (isError(index)) {
        return index
      }
      return evalIndexExpression(left, index)
    case node instanceof HashLiteral:
      return evalHashLiteral(node, env)
  }

  return singleNull
}
