import {
  InfixExpression,
  IntegerLiteral,
  BooleanLiteral,
  Identifier,
} from '../src/ast.js'
import { MonkeyInteger, MonkeyBoolean, MonkeyNull } from '../src/object.js'

export const checkParserErrors = (parser) => {
  const errors = parser.getErrors()
  if (errors.length === 0) {
    return
  }

  errors.forEach((msg) => console.error(`parser error: ${msg}`))
  throw new Error(`parser has ${errors.length} errors`)
}

export const testIntegerLiteral = (literal, value) => {
  if (!literal instanceof IntegerLiteral) {
    throw new Error(`literal not IntegerLiteral. got=${typeof literal}`)
  }

  if (literal.value !== value) {
    throw new Error(`integ.Value not ${value}. got=${literal.value}`)
  }

  if (literal.tokenLiteral() !== value.toString()) {
    throw new Error(
      `integ.TokenLiteral not ${value}. got=${literal.tokenLiteral()}`
    )
  }

  return true
}

export const testIdentifier = (expression, value) => {
  let identifier
  if (expression instanceof Identifier) {
    identifier = expression
  } else {
    throw new Error(`exp not Identifier. got=${typeof expression}`)
  }

  if (identifier.value !== value) {
    throw new Error(`ident.Value not ${value}. got=${identifier.value}`)
  }

  if (identifier.tokenLiteral() !== value) {
    throw new Error(
      `ident.TokenLiteral not ${value}. got=${identifier.tokenLiteral()}`
    )
  }

  return true
}

export const testBooleanLiteral = (expression, value) => {
  let booleanExpression
  if (expression instanceof BooleanLiteral) {
    booleanExpression = expression
  } else {
    throw new Error(`exp is not Boolean. got=${typeof expression}`)
  }

  if (booleanExpression.value !== value) {
    throw new Error(
      `boolean.Value not ${value}. got=${booleanExpression.value}`
    )
  }

  if (booleanExpression.tokenLiteral() !== (value ? 'true' : 'false')) {
    throw new Error(
      `boolean.TokenLiteral not ${
        value ? 'true' : 'false'
      }. got=${booleanExpression.tokenLiteral()}`
    )
  }

  return true
}

export const testLiteralExpression = (expression, expected) => {
  switch (typeof expected) {
    case 'number':
      return testIntegerLiteral(expression, expected)
    case 'string':
      return testIdentifier(expression, expected)
    case 'boolean':
      return testBooleanLiteral(expression, expected)
    default:
      throw new Error(`type of exp not handled. got=${typeof expression}`)
  }
}

export const testInfixExpression = (expression, left, operator, right) => {
  let operatorExpression
  if (expression instanceof InfixExpression) {
    operatorExpression = expression
  } else {
    throw new Error(`exp is not InfixExpression. got=${typeof expression}`)
  }

  if (!testLiteralExpression(operatorExpression.left, left)) {
    return false
  }

  if (operatorExpression.operator !== operator) {
    throw new Error(
      `exp.Operator is not '${operator}'. got=${operatorExpression.operator}`
    )
  }

  if (!testLiteralExpression(operatorExpression.right, right)) {
    return false
  }

  return true
}

export const testIntegerObject = (obj, expected) => {
  if (!(obj instanceof MonkeyInteger)) {
    console.log(obj, expected)
    throw new Error(`object is not Integer. got=${typeof obj} (${obj})`)
  }
  if (obj.value !== expected) {
    throw new Error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
  }
  return true
}

export const testBooleanObject = (obj, expected) => {
  if (!(obj instanceof MonkeyBoolean)) {
    throw new Error(`object is not Boolean. got=${typeof obj} (${obj})`)
  }
  if (obj.value !== expected) {
    throw new Error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
  }
  return true
}

export const testNullObject = (obj) => {
  if (!(obj instanceof MonkeyNull)) {
    throw new Error(`object is not NULL. got=${typeof obj} (${obj})`)
  }
  return true
}
