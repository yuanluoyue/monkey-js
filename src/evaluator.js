import {
  IntegerLiteral,
  BooleanLiteral,
  ExpressionStatement,
  Program,
  PrefixExpression,
  InfixExpression,
} from './ast.js'

import { TokenType } from './token.js'

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

const singleTrue = new MonkeyBoolean(true)
const singleFalse = new MonkeyBoolean(false)
const singleNull = new MonkeyNull(false)

function nativeBoolToBooleanObject(bool) {
  return bool ? singleTrue : singleFalse
}

function evalStatements(statements) {
  let result
  for (const statement of statements) {
    result = evalMonkey(statement)
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
    return singleNull
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
      return singleNull
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
      return singleNull
  }
}

function evalInfixExpression(operator, left, right) {
  if (
    left.type() === MonkeyObjectType.INTEGER &&
    right.type() === MonkeyObjectType.INTEGER
  ) {
    return evalIntegerInfixExpression(operator, left, right)
  }

  switch (operator) {
    case TokenType.EQ:
      return nativeBoolToBooleanObject(left === right)
    case TokenType.NOT_EQ:
      return nativeBoolToBooleanObject(left !== right)
    default:
      return singleNull
  }
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
    case node instanceof PrefixExpression:
      const right = evalMonkey(node.right)
      return evalPrefixExpression(node.operator, right)
    case node instanceof InfixExpression: {
      const left = evalMonkey(node.left)
      const right = evalMonkey(node.right)
      return evalInfixExpression(node.operator, left, right)
    }
  }

  return singleNull
}
