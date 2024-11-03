import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import {
  LetStatement,
  ReturnStatement,
  Identifier,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  BooleanLiteral,
} from '../src/ast.js'
import { TokenType } from '../src/token.js'
import {
  checkParserErrors,
  testInfixExpression,
  testIntegerLiteral,
  testBooleanLiteral,
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
  const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `

  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  checkParserErrors(parser)

  if (!program) {
    throw new Error('parseProgram() returned null')
  }

  if (program.statements.length !== 3) {
    throw new Error(
      `program.Statements does not contain 3 statements. got=${program.statements.length}`
    )
  }

  const tests = [
    { expectedIdentifier: 'x' },
    { expectedIdentifier: 'y' },
    { expectedIdentifier: 'foobar' },
  ]

  for (let i = 0; i < tests.length; i++) {
    const statement = program.statements[i]
    if (!testLetStatement(statement, tests[i].expectedIdentifier)) {
      return
    }
  }
}

const testReturnStatements = () => {
  const input = `
    return 5;
    return 10;
    return 993 322;
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
}

main()
