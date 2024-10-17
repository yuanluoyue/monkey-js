import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import {
  LetStatement,
  ReturnStatement,
  Identifier,
  ExpressionStatement,
} from '../src/ast.js'
import { TokenType } from '../src/token.js'

const checkParserErrors = (parser) => {
  const errors = parser.getErrors()
  if (errors.length === 0) {
    return
  }

  errors.forEach((msg) => console.error(`parser error: ${msg}`))
  throw new Error(`parser has ${errors.length} errors`)
}

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

const main = () => {
  testLetStatements()
  testReturnStatements()
  testString()
  testIdentifierExpression()
}

main()
