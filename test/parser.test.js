import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import {
  LetStatement,
  StringLiteral,
  Identifier,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression,
  IfExpression,
  BooleanLiteral,
  FunctionLiteral,
  CallExpression,
} from '../src/ast.js'
import { TokenType } from '../src/token.js'
import {
  checkParserErrors,
  testInfixExpression,
  testIntegerLiteral,
  testBooleanLiteral,
  testIdentifier,
  testLiteralExpression,
} from './utils.js'

const testLetStatement = (statement, name) => {
  if (statement.tokenLiteral() !== 'let') {
    throw new Error(`s.TokenLiteral not 'let'. got=${s.tokenLiteral()}`)
  }

  if (!(statement instanceof LetStatement)) {
    throw new Error(`s not *ast.LetStatement. got=${typeof statement}`)
  }

  if (statement.name.value !== name) {
    throw new Error(
      `letStmt.Name.Value not '${name}'. got=${statement.name.value}`
    )
  }

  if (statement.name.tokenLiteral() !== name) {
    throw new Error(
      `letStmt.Name.TokenLiteral() not '${name}'. got=${statement.name.tokenLiteral()}`
    )
  }

  return true
}

const testLetStatements = () => {
  const tests = [
    { input: 'let x = 5;', expectedIdentifier: 'x', expectedValue: 5 },
    { input: 'let y = true;', expectedIdentifier: 'y', expectedValue: true },
    {
      input: 'let foobar = y;',
      expectedIdentifier: 'foobar',
      expectedValue: 'y',
    },
  ]

  for (const test of tests) {
    const lexer = new Lexer(test.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    checkParserErrors(parser)

    if (program.statements.length !== 1) {
      throw new Error(
        `program.statements does not contain 1 statements. got=${program.statements.length}`
      )
    }

    const stmt = program.statements[0]
    testLetStatement(stmt, test.expectedIdentifier)

    const val = stmt.value
    testLiteralExpression(val, test.expectedValue)
  }
}

const testReturnStatements = () => {
  const input = `
    return 5;
    return 10;
    return 993 + 322;
    `

  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 3) {
    throw new Error(
      `program.Statements does not contain 3 statements. got=${program.statements.length}`
    )
  }

  for (const statement of program.statements) {
    if (statement.tokenLiteral() !== 'return') {
      throw new Error(
        `returnStmt.TokenLiteral not 'return', got ${statement.tokenLiteral()}`
      )
    }
  }
}

const testString = () => {
  const input = `let myVar = anotherVar;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  program.statements = [
    new LetStatement(
      { type: TokenType.LET, literal: 'let' },
      new Identifier({ type: TokenType.IDENT, literal: 'myVar' }, 'myVar'),
      new Identifier(
        { type: TokenType.IDENT, literal: 'anotherVar' },
        'anotherVar'
      )
    ),
  ]

  const expectedString = 'let myVar = anotherVar;'

  if (program.getString() !== expectedString) {
    throw new Error(`program.getString() wrong. got=${program.getString()}`)
  }
}

const testIdentifierExpression = () => {
  const input = `foobar;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program has not enough statements. got=${program.statements.length}`
    )
  }

  let statement
  if (program.statements[0] instanceof ExpressionStatement) {
    statement = program.statements[0]
  } else {
    throw new Error(
      `program.Statements[0] is not ExpressionStatement. got=${typeof program
        .statements[0]}`
    )
  }

  let ident
  if (statement.expression instanceof Identifier) {
    ident = statement.expression
  } else {
    throw new Error(`exp not Identifier. got=${typeof statement.expression}`)
  }
  if (ident.value !== 'foobar') {
    throw new Error(`ident.Value not "foobar". got=${ident.value}`)
  }
  if (ident.tokenLiteral() !== 'foobar') {
    throw new Error(
      `ident.TokenLiteral not "foobar". got=${ident.tokenLiteral()}`
    )
  }
}

const testIntegerLiteralExpression = () => {
  const input = '5;'
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program has not enough statements. got=${program.statements.length}`
    )
  }
  let statement
  if (program.statements[0] instanceof ExpressionStatement) {
    statement = program.statements[0]
  } else {
    throw new Error(
      `program.Statements[0] is not ExpressionStatement. got=${typeof program
        .statements[0]}`
    )
  }

  let literal
  if (statement.expression instanceof IntegerLiteral) {
    literal = statement.expression
  } else {
    throw new Error(
      `exp not IntegerLiteral. got=${typeof statement.expression}`
    )
  }
  if (literal.value !== 5) {
    throw new Error(`literal.Value not 5. got=${literal.value}`)
  }
  if (literal.tokenLiteral() !== '5') {
    throw new Error(
      `literal.TokenLiteral not "5". got=${literal.tokenLiteral()}`
    )
  }
}

const testParsingPrefixExpressions = () => {
  const prefixTests = [
    { input: '!5;', operator: '!', integerValue: 5 },
    { input: '-15;', operator: '-', integerValue: 15 },
    { input: '!true;', operator: '!', integerValue: true },
    { input: '!false;', operator: '!', integerValue: false },
  ]

  for (const testCase of prefixTests) {
    const lexer = new Lexer(testCase.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    checkParserErrors(parser)

    if (program.statements.length !== 1) {
      throw new Error(
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      )
    }

    let statement
    if (program.statements[0] instanceof ExpressionStatement) {
      statement = program.statements[0]
    } else {
      throw new Error(
        `program.Statements[0] is not ExpressionStatement. got=${typeof program
          .statements[0]}`
      )
    }

    let expression
    if (statement.expression instanceof PrefixExpression) {
      expression = statement.expression
    } else {
      throw new Error(
        `stmt is not PrefixExpression. got=${typeof statement.expression}`
      )
    }

    if (expression.operator !== testCase.operator) {
      throw new Error(
        `exp.Operator is not '${testCase.operator}'. got=${expression.operator}`
      )
    }

    if (!testIntegerLiteral(expression.right, testCase.integerValue)) {
      return
    }
  }
}

const testParsingInfixExpressions = () => {
  const infixTests = [
    { input: '5 + 5;', leftValue: 5, operator: '+', rightValue: 5 },
    { input: '5 - 5;', leftValue: 5, operator: '-', rightValue: 5 },
    { input: '5 * 5;', leftValue: 5, operator: '*', rightValue: 5 },
    { input: '5 / 5;', leftValue: 5, operator: '/', rightValue: 5 },
    { input: '5 > 5;', leftValue: 5, operator: '>', rightValue: 5 },
    { input: '5 < 5;', leftValue: 5, operator: '<', rightValue: 5 },
    { input: '5 == 5;', leftValue: 5, operator: '==', rightValue: 5 },
    { input: '5 != 5;', leftValue: 5, operator: '!=', rightValue: 5 },
    {
      input: 'true == true;',
      leftValue: true,
      operator: '==',
      rightValue: true,
    },
    {
      input: 'true != false;',
      leftValue: true,
      operator: '!=',
      rightValue: false,
    },
    {
      input: 'false == false;',
      leftValue: false,
      operator: '==',
      rightValue: false,
    },
  ]

  for (const testCase of infixTests) {
    const lexer = new Lexer(testCase.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    checkParserErrors(parser)

    if (program.statements.length !== 1) {
      throw new Error(
        `program.Statements does not contain 1 statements. got=${program.statements.length}`
      )
    }

    let statement
    if (program.statements[0] instanceof ExpressionStatement) {
      statement = program.statements[0]
    } else {
      throw new Error(
        `program.Statements[0] is not ExpressionStatement. got=${typeof program
          .statements[0]}`
      )
    }

    const expression = statement.expression

    testInfixExpression(
      expression,
      testCase.leftValue,
      expression.operator,
      testCase.rightValue
    )
  }
}

const testOperatorPrecedenceParsing = () => {
  const tests = [
    { input: '-a * b', expected: '((-a) * b)' },
    { input: '!-a', expected: '(!(-a))' },
    { input: 'a + b + c', expected: '((a + b) + c)' },
    { input: 'a + b - c', expected: '((a + b) - c)' },
    { input: 'a * b * c', expected: '((a * b) * c)' },
    { input: 'a * b / c', expected: '((a * b) / c)' },
    { input: 'a + b / c', expected: '(a + (b / c))' },
    {
      input: 'a + b * c + d / e - f',
      expected: '(((a + (b * c)) + (d / e)) - f)',
    },
    { input: '3 + 4; -5 * 5', expected: '(3 + 4)((-5) * 5)' },
    { input: '5 > 4 == 3 < 4', expected: '((5 > 4) == (3 < 4))' },
    { input: '5 < 4 != 3 > 4', expected: '((5 < 4) != (3 > 4))' },
    {
      input: '3 + 4 * 5 == 3 * 1 + 4 * 5',
      expected: '((3 + (4 * 5)) == ((3 * 1) + (4 * 5)))',
    },
    {
      input: 'true;',
      expected: 'true',
    },
    {
      input: 'false;',
      expected: 'false',
    },
    {
      input: '3 > 5 == false;',
      expected: '((3 > 5) == false)',
    },
    {
      input: '3 < 5 == true;',
      expected: '((3 < 5) == true)',
    },
    {
      input: '1 + (2 + 3) + 4;',
      expected: '((1 + (2 + 3)) + 4)',
    },
    {
      input: '(5 + 5) * 2;',
      expected: '((5 + 5) * 2)',
    },
    {
      input: '2 / (5 + 5);',
      expected: '(2 / (5 + 5))',
    },
    {
      input: '-(5 + 5);',
      expected: '(-(5 + 5))',
    },
    {
      input: '!(true == true)',
      expected: '(!(true == true))',
    },
    {
      input: 'a + add(b * c) + d',
      expected: '((a + add((b * c))) + d)',
    },
    {
      input: 'add(a, b, 1, 2 * 3, 4 + 5, add(6, 7 * 8))',
      expected: 'add(a, b, 1, (2 * 3), (4 + 5), add(6, (7 * 8)))',
    },
    {
      input: 'add(a + b + c * d / f + g)',
      expected: 'add((((a + b) + ((c * d) / f)) + g))',
    },
  ]

  for (const testCase of tests) {
    const lexer = new Lexer(testCase.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    checkParserErrors(parser)

    const actual = program.getString()
    if (actual !== testCase.expected) {
      throw new Error(`expected=${testCase.expected}, got=${actual}`)
    }
  }
}

const testBooleanExpression = () => {
  const input = `true;`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    )
  }

  let statement
  if (program.statements[0] instanceof ExpressionStatement) {
    statement = program.statements[0]
  } else {
    throw new Error(
      `program.Statements[0] is not ExpressionStatement. got=${typeof program
        .statements[0]}`
    )
  }

  let expression
  if (statement.expression instanceof BooleanLiteral) {
    expression = statement.expression
  } else {
    throw new Error(`stmt is not Boolean. got=${typeof statement.expression}`)
  }

  if (!testBooleanLiteral(expression, true)) {
    return
  }
}

const testIfExpression = () => {
  const input = `if (x < y) { x } `
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program.Statements does not contain 1 statements. got=${program.statements.length}`
    )
  }

  let statement
  if (program.statements[0] instanceof ExpressionStatement) {
    statement = program.statements[0]
  } else {
    throw new Error(
      `program.statements[0] is not ExpressionStatement. got=${typeof program
        .statements[0]}`
    )
  }

  let expression
  if (statement.expression instanceof IfExpression) {
    expression = statement.expression
  } else {
    throw new Error(
      `stmt.expression is not IfExpression. got=${typeof statement.expression}`
    )
  }

  testInfixExpression(expression.condition, 'x', '<', 'y')

  if (expression.consequence.statements.length !== 1) {
    throw new Error(
      `consequence is not 1 statements. got=${expression.consequence.statements.length}`
    )
  }

  let consequence
  if (expression.consequence.statements[0] instanceof ExpressionStatement) {
    consequence = expression.consequence.statements[0]
  } else {
    throw new Error(
      `Statements[0] for consequence is not ExpressionStatement. got=${typeof expression
        .consequence.statements[0]}`
    )
  }

  testIdentifier(consequence.expression, 'x')

  if (!expression.alternative) {
    throw new Error(
      `exp.Alternative.Statements was not null. got=${expression.alternative}`
    )
  }
}

const testFunctionLiteralParsing = () => {
  const input = `fn(x, y) { x + y; }`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program.statements does not contain 1 statements. got=${program.statements.length}`
    )
  }

  let stmt
  if (program.statements[0] instanceof ExpressionStatement) {
    stmt = program.statements[0]
  } else {
    throw new Error(
      `program.statements[0] is not ExpressionStatement. got=${typeof program
        .statements[0]}`
    )
  }

  let fn
  if (stmt.expression instanceof FunctionLiteral) {
    fn = stmt.expression
  } else {
    throw new Error(
      `stmt.expression is not FunctionLiteral. got=${typeof stmt.expression}`
    )
  }

  if (fn.parameters.length !== 2) {
    throw new Error(
      `function literal parameters wrong. want 2, got=${fn.parameters.length}`
    )
  }

  testLiteralExpression(fn.parameters[0], 'x')
  testLiteralExpression(fn.parameters[1], 'y')

  if (fn.body.statements.length !== 1) {
    throw new Error(
      `fn.Body.Statements has not 1 statements. got=${fn.body.statements.length}`
    )
  }

  let bodyStmt
  if (fn.body.statements[0] instanceof ExpressionStatement) {
    bodyStmt = fn.body.statements[0]
  } else {
    throw new Error(
      `function body stmt is not ExpressionStatement. got=${typeof fn.body
        .statements[0]}`
    )
  }

  testInfixExpression(bodyStmt.expression, 'x', '+', 'y')
}

const testFunctionParameterParsing = () => {
  const tests = [
    { input: 'fn() {};', expectedParams: [] },
    { input: 'fn(x) {};', expectedParams: ['x'] },
    { input: 'fn(x, y, z) {};', expectedParams: ['x', 'y', 'z'] },
  ]

  for (const test of tests) {
    const lexer = new Lexer(test.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    checkParserErrors(parser)

    const stmt = program.statements[0]

    if (!(stmt instanceof ExpressionStatement)) {
      throw new Error(
        `program.Statements[0] is not ExpressionStatement. got=${typeof program
          .statements[0]}`
      )
    }

    const fn = stmt.expression

    if (!(fn instanceof FunctionLiteral)) {
      throw new Error(
        `stmt.Expression is not FunctionLiteral. got=${typeof stmt.expression}`
      )
    }

    if (fn.parameters.length !== test.expectedParams.length) {
      throw new Error(
        `length parameters wrong. want ${test.expectedParams.length}, got=${fn.parameters.length}`
      )
    }

    for (let i = 0; i < test.expectedParams.length; i++) {
      testLiteralExpression(fn.parameters[i], test.expectedParams[i])
    }
  }
}

const testCallExpressionParsing = () => {
  const input = 'add(1, 2 * 3, 4 + 5);'
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (program.statements.length !== 1) {
    throw new Error(
      `program.statements does not contain 1 statements. got=${program.statements.length}`
    )
  }

  let stmt
  if (program.statements[0] instanceof ExpressionStatement) {
    stmt = program.statements[0]
  } else {
    throw new Error(
      `stmt is not ExpressionStatement. got=${typeof program.statements[0]}`
    )
  }

  let exp
  if (stmt.expression instanceof CallExpression) {
    exp = stmt.expression
  } else {
    throw new Error(
      `stmt.expression is not CallExpression. got=${typeof stmt.expression}`
    )
  }

  if (!testIdentifier(exp.function, 'add')) {
    return
  }

  if (exp.arguments.length !== 3) {
    throw new Error(`wrong length of arguments. got=${exp.arguments.length}`)
  }

  testLiteralExpression(exp.arguments[0], 1)
  testInfixExpression(exp.arguments[1], 2, '*', 3)
  testInfixExpression(exp.arguments[2], 4, '+', 5)
}

function testStringLiteralExpression() {
  const input = '"hello world";'

  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  const stmt = program.statements[0]
  if (!(stmt instanceof ExpressionStatement)) {
    console.error('First statement is not an ExpressionStatement.')
    return
  }

  const literal = stmt.expression
  if (!(literal instanceof StringLiteral)) {
    console.error('Expression is not a StringLiteral.')
    return
  }

  if (literal.value !== 'hello world') {
    console.error(`literal.Value is not "hello world". got=${literal.value}`)
  }
}

const main = () => {
  testLetStatements()
  testReturnStatements()
  testString()
  testIdentifierExpression()
  testIntegerLiteralExpression()
  testParsingPrefixExpressions()
  testParsingInfixExpressions()
  testOperatorPrecedenceParsing()
  testBooleanExpression()
  testIfExpression()
  testFunctionLiteralParsing()
  testFunctionParameterParsing()
  testCallExpressionParsing()
  testStringLiteralExpression()
}

main()
