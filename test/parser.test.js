import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import { LetStatement } from '../src/ast.js'

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

const main = () => {
  testLetStatements()
}

main()
