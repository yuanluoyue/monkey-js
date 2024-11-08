import {
  IntegerLiteral,
  BooleanLiteral,
  ExpressionStatement,
  Program,
} from './ast.js'

const MonkeyObjectType = {
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
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
}

export class MonkeyNull extends MonkeyObject {
  type() {
    return MonkeyObjectType.NULL
  }

  inspect() {
    return 'null'
  }
}

const nativeTrue = new MonkeyBoolean(true)
const nativeFalse = new MonkeyBoolean(false)

function nativeBoolToBooleanObject(bool) {
  return bool ? nativeTrue : nativeFalse
}

function evalStatements(statements) {
  let result
  for (const statement of statements) {
    result = evalMonkey(statement)
  }
  return result
}

export function evalMonkey(node) {
  switch (true) {
    case node instanceof Program:
      return evalStatements(node.statements)
    case node instanceof ExpressionStatement:
      return evalMonkey(node.expression)
    case node instanceof IntegerLiteral:
      return new MonkeyInteger(node.value)
    case node instanceof BooleanLiteral:
      return nativeBoolToBooleanObject(node.value)
  }

  return new MonkeyNull()
}
