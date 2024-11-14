import {
  ExpressionStatement,
  Program,
  InfixExpression,
  PrefixExpression,
  IndexExpression,
  IfExpression,
  BlockStatement,
  ReturnStatement,
  LetStatement,
  FunctionLiteral,
  ArrayLiteral,
  HashLiteral,
  CallExpression,
  IntegerLiteral,
  BooleanLiteral,
} from '../src/ast.js'
import { MonkeyBoolean, MonkeyInteger, Quote } from './object.js'
import { evalMonkey } from './evaluator.js'
import { TokenType, Token } from './token.js'

export function modify(node, modifier) {
  if (node instanceof Program) {
    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i]
      node.statements[i] = modify(statement, modifier)
    }
  } else if (node instanceof ExpressionStatement) {
    node.expression = modify(node.expression, modifier)
  } else if (node instanceof InfixExpression) {
    node.left = modify(node.left, modifier)
    node.right = modify(node.right, modifier)
  } else if (node instanceof PrefixExpression) {
    node.right = modify(node.right, modifier)
  } else if (node instanceof IndexExpression) {
    node.left = modify(node.left, modifier)
    node.index = modify(node.index, modifier)
  } else if (node instanceof IfExpression) {
    node.condition = modify(node.condition, modifier)
    node.consequence = modify(node.consequence, modifier)
    if (node?.alternative?.token) {
      node.alternative = modify(node.alternative, modifier)
    }
  } else if (node instanceof BlockStatement) {
    for (let i = 0; i < node.statements.length; i++) {
      const statement = node.statements[i]
      node.statements[i] = modify(statement, modifier)
    }
  } else if (node instanceof ReturnStatement) {
    node.returnValue = modify(node.returnValue, modifier)
  } else if (node instanceof LetStatement) {
    node.value = modify(node.value, modifier)
  } else if (node instanceof FunctionLiteral) {
    node.body = modify(node.body, modifier)
  } else if (node instanceof ArrayLiteral) {
    for (let i = 0; i < node.elements.length; i++) {
      const element = node.elements[i]
      node.elements[i] = modify(element, modifier)
    }
  } else if (node instanceof HashLiteral) {
    for (let [keyNode, valueNode] of node.pairs) {
      modifier(keyNode)
      modifier(valueNode)
    }
  }

  return modifier(node)
}

export function quote(node, env) {
  node = evalUnquoteCalls(node, env)
  return new Quote(node)
}

function evalUnquoteCalls(quoted, env) {
  return modify(quoted, (node) => {
    if (!isUnquoteCall(node)) {
      return node
    }

    if (!(node instanceof CallExpression)) {
      return node
    }

    if (node.arguments.length !== 1) {
      return node
    }

    const unquoted = evalMonkey(node.arguments[0], env)

    return convertObjectToASTNode(unquoted)
  })
}

function isUnquoteCall(node) {
  let callExpression = node
  if (!(callExpression instanceof CallExpression)) {
    return false
  }

  return callExpression.function.tokenLiteral() === 'unquote'
}

function convertObjectToASTNode(obj) {
  if (obj instanceof MonkeyInteger) {
    let t = new Token(TokenType.INT, obj.value)
    return new IntegerLiteral(t)
  } else if (obj instanceof MonkeyBoolean) {
    let t = null
    if (obj.value) {
      t = new Token(TokenType.TRUE, 'true')
    } else {
      t = new Token(TokenType.FALSE, 'false')
    }
    return new BooleanLiteral(t)
  } else if (obj instanceof Quote) {
    return obj.node
  }

  return null
}
