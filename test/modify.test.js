import { isEqual } from 'lodash-es'

import {
  ExpressionStatement,
  IntegerLiteral,
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
  modify,
} from '../src/ast.js'
import { Quote } from '../src/object.js'
import { testEval } from './utils.js'
import { TokenType, Token } from '../src/token.js'

function testQuote() {
  const tests = [
    {
      input: 'quote(5)',
      expected: '5',
    },
    {
      input: 'quote(5 + 8)',
      expected: '(5 + 8)',
    },
    {
      input: 'quote(foobar)',
      expected: 'foobar',
    },
    {
      input: 'quote(foobar + barfoo)',
      expected: '(foobar + barfoo)',
    },
  ]

  for (let tt of tests) {
    const evaluated = testEval(tt.input)
    const quote = evaluated
    if (!(quote instanceof Quote)) {
      console.error(
        `expected *object.Quote. got=${typeof evaluated} (${evaluated})`
      )
      return
    }

    if (!quote.node) {
      console.error('quote.Node is nil')
      return
    }

    if (quote.node.getString() !== tt.expected) {
      console.error(
        `not equal. got=${quote.node.getString()}, want=${tt.expected}`
      )
    }
  }
}

function testQuoteUnquote() {
  const tests = [
    {
      input: 'quote(unquote(4))',
      expected: '4',
    },
    {
      input: 'quote(unquote(4 + 4))',
      expected: '8',
    },
    {
      input: 'quote(8 + unquote(4 + 4))',
      expected: '(8 + 8)',
    },
    {
      input: 'quote(unquote(4 + 4) + 8)',
      expected: '(8 + 8)',
    },
  ]

  for (let tt of tests) {
    const evaluated = testEval(tt.input)
    const quote = evaluated
    if (!(quote instanceof Quote)) {
      console.error(
        `expected *object.Quote. got=${typeof evaluated} (${evaluated})`
      )
      return
    }

    if (!quote.node) {
      console.error('quote.Node is nil')
      return
    }

    if (quote.node.getString() !== tt.expected) {
      console.error(
        `not equal. got=${quote.node.getString()}, want=${tt.expected}`
      )
    }
  }
}

function testModify() {
  const one = () => {
    const int = new IntegerLiteral(new Token(TokenType.INT, 1))
    int.token = null
    return int
  }
  const two = () => {
    const int = new IntegerLiteral(new Token(TokenType.INT, 2))
    int.token = null
    return int
  }

  const turnOneIntoTwo = (node) => {
    if (node instanceof IntegerLiteral) {
      if (node.value !== 1) {
        return node
      }

      node.value = 2
      return node
    }

    return node
  }

  const tests = [
    {
      input: one(),
      expected: two(),
    },
    {
      input: new Program([new ExpressionStatement(null, one())]),
      expected: new Program([new ExpressionStatement(null, two())]),
    },
    {
      input: new InfixExpression(null, one(), '+', two()),
      expected: new InfixExpression(null, two(), '+', two()),
    },
    {
      input: new InfixExpression(null, two(), '+', one()),
      expected: new InfixExpression(null, two(), '+', two()),
    },
    {
      input: new PrefixExpression(null, '-', one()),
      expected: new PrefixExpression(null, '-', two()),
    },
    {
      input: new IndexExpression(null, one(), one()),
      expected: new IndexExpression(null, two(), two()),
    },
    {
      input: new IfExpression(
        null,
        one(),
        new BlockStatement(null, [new ExpressionStatement(null, one())]),
        new BlockStatement(new Token(), [new ExpressionStatement(null, one())])
      ),
      expected: new IfExpression(
        null,
        two(),
        new BlockStatement(null, [new ExpressionStatement(null, two())]),
        new BlockStatement(new Token(), [new ExpressionStatement(null, two())])
      ),
    },
    {
      input: new ReturnStatement(null, one()),
      expected: new ReturnStatement(null, two()),
    },
    {
      input: new LetStatement(null, null, one()),
      expected: new LetStatement(null, null, two()),
    },
    {
      input: new FunctionLiteral(
        null,
        [],
        new BlockStatement(null, [new ExpressionStatement(null, one())])
      ),
      expected: new FunctionLiteral(
        null,
        [],
        new BlockStatement(null, [new ExpressionStatement(null, two())])
      ),
    },
    {
      input: new ArrayLiteral(null, [one(), one()]),
      expected: new ArrayLiteral(null, [two(), two()]),
    },
  ]

  for (let tt of tests) {
    const modified = modify(tt.input, turnOneIntoTwo)

    const equal = isEqual(modified, tt.expected)
    if (!equal) {
      console.error(
        `not equal. got=${JSON.stringify(modified)}, want=${JSON.stringify(
          tt.expected
        )}`
      )
    }
  }

  const hashMap = new Map()
  hashMap.set(one(), one())
  hashMap.set(one(), one())
  const hashLiteral = new HashLiteral(null, hashMap)
  const modified = modify(hashLiteral, turnOneIntoTwo)

  for (let [keyNode, valueNode] of modified.pairs) {
    if (keyNode instanceof IntegerLiteral) {
      if (keyNode.value !== 2) {
        console.error(`value is not 2, got=${keyNode.value}`)
      }
    }

    if (valueNode instanceof IntegerLiteral) {
      if (valueNode.value !== 2) {
        console.error(`value is not 2, got=${valueNode.value}`)
      }
    }
  }
}

const main = () => {
  testQuote()
  testQuoteUnquote()
  testModify()
}

main()
