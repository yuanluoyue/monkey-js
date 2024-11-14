import { isEqual } from 'lodash-es'

import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
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
} from '../src/ast.js'
import { Quote, MonkeyEnvironment, Macro } from '../src/object.js'
import { testEval } from './utils.js'
import { TokenType, Token } from '../src/token.js'
import { modify } from '../src/quote.js'
import { defineMacros, expandMacros } from '../src/marco.js'

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
    {
      input: `let foobar = 8;
          quote(foobar)`,
      expected: `foobar`,
    },
    {
      input: `let foobar = 8;
          quote(unquote(foobar))`,
      expected: `8`,
    },
    {
      input: `quote(unquote(true))`,
      expected: `true`,
    },
    {
      input: `quote(unquote(true == false))`,
      expected: `false`,
    },
    {
      input: `quote(unquote(quote(4 + 4)))`,
      expected: `(4 + 4)`,
    },
    {
      input: `let quotedInfixExpression = quote(4 + 4);
      quote(unquote(4 + 4) + unquote(quotedInfixExpression))`,
      expected: `(8 + (4 + 4))`,
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

    if (String(quote.node.getString()) !== tt.expected) {
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

function testParseProgram(input) {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  return program
}

function testDefineMacros() {
  const input = `
  let number = 1;
  let function = fn(x, y) { x + y };
  let mymacro = macro(x, y) { x + y; };
  `

  const env = new MonkeyEnvironment()
  const program = testParseProgram(input)

  defineMacros(program, env)

  // 检查处理后的程序语句数量是否为2
  if (program.statements.length !== 2) {
    console.error('Wrong number of statements. got=', program.statements.length)
    return
  }

  // 检查环境中是否不存在number变量
  const numberObj = env.get('number')
  if (numberObj) {
    console.error('number should not be defined')
    return
  }

  // 检查环境中是否不存在function变量
  const functionObj = env.get('function')
  if (functionObj) {
    console.error('function should not be defined')
    return
  }

  // 检查环境中是否存在mymacro对应的对象
  const obj = env.get('mymacro')
  if (!obj) {
    console.error('macro not in environment.')
    return
  }

  const macro = obj
  // 检查获取到的对象是否为object.Macro类型
  if (!(macro instanceof Macro)) {
    console.error(
      'object is not Macro. got=',
      typeof macro,
      '(',
      JSON.stringify(macro),
      ')'
    )
    return
  }

  // 检查宏对象的参数数量是否为2
  if (macro.parameters.length !== 2) {
    console.error(
      'Wrong number of macro parameters. got=',
      macro.parameters.length
    )
    return
  }

  // 检查宏对象的第一个参数是否为'x'
  if (macro.parameters[0].getString() !== 'x') {
    console.error(
      "parameter is not 'x'. got=",
      JSON.stringify(macro.parameters[0])
    )
    return
  }

  // 检查宏对象的第二个参数是否为'y'
  if (macro.parameters[1].getString() !== 'y') {
    console.error(
      "parameter is not 'y'. got=",
      JSON.stringify(macro.parameters[1])
    )
    return
  }

  const expectedBody = '(x + y)'
  // 检查宏对象的主体代码块的字符串表示是否符合预期
  if (macro.body.getString() !== expectedBody) {
    console.error(
      'body is not ',
      expectedBody,
      '. got=',
      JSON.stringify(macro.body.getString())
    )
    return
  }
}

function testExpandMacros() {
  const tests = [
    {
      input: `
          let infixExpression = macro() { quote(1 + 2); };

          infixExpression();
          `,
      expected: `(1 + 2)`,
    },
    {
      input: `
          let reverse = macro(a, b) { quote(unquote(b) - unquote(a)); };

          reverse(2 + 2, 10 - 5);
          `,
      expected: `(10 - 5) - (2 + 2)`,
    },
    {
      input: `
          let unless = macro(condition, consequence, alternative) {
              quote(if (!(unquote(condition))) {
                  unquote(consequence);
              } else {
                  unquote(alternative);
              });
          };

          unless(10 > 5, puts("not greater"), puts("greater"));
          `,
      expected: `if (!(10 > 5)) { puts("not greater") } else { puts("greater") }`,
    },
  ]

  for (let i = 0; i < tests.length; i++) {
    const tt = tests[i]

    const expected = testParseProgram(tt.expected)
    const program = testParseProgram(tt.input)

    const env = new MonkeyEnvironment()

    defineMacros(program, env)

    const expanded = expandMacros(program, env)

    if (expanded.getString() !== expected.getString()) {
      console.error(
        `not equal. want=${expected.getString()}, got=${expanded.getString()}`
      )
    }
  }
}

const main = () => {
  testQuote()
  testQuoteUnquote()
  testModify()
  testDefineMacros()
  testExpandMacros()
}

main()
