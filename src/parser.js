import { Program, LetStatement, Identifier, ReturnStatement } from './ast.js'
import { TokenType } from './token.js'

export class Parser {
  lexer = null
  curToken = null
  peekToken = null
  errors = []

  constructor(lexerInstance) {
    this.lexer = lexerInstance
    this.nextToken()
    this.nextToken()
  }

  nextToken() {
    this.curToken = this.peekToken
    this.peekToken = this.lexer.nextToken()
  }

  parseProgram() {
    const program = new Program()

    while (!this.curTokenIs(TokenType.EOF)) {
      const statement = this.parseStatement()
      if (statement !== null) {
        program.statements.push(statement)
      }
      this.nextToken()
    }

    return program
  }

  parseStatement() {
    switch (this.curToken.type) {
      case TokenType.LET:
        return this.parseLetStatement()
      case TokenType.RETURN:
        return this.parseReturnStatement()
      default:
        return null
    }
  }

  parseLetStatement() {
    const statement = new LetStatement(this.curToken, null, null)

    if (!this.expectPeek(TokenType.IDENT)) {
      return null
    }

    const name = new Identifier(this.curToken, this.curToken.literal)
    statement.name = name

    if (!this.expectPeek(TokenType.ASSIGN)) {
      return null
    }

    while (!this.curTokenIs(TokenType.SEMICOLON)) {
      this.nextToken()
    }

    return statement
  }

  parseReturnStatement() {
    const statement = new ReturnStatement(this.curToken)
    while (!this.curTokenIs(TokenType.SEMICOLON)) {
      this.nextToken()
    }
    return statement
  }

  curTokenIs(tokenType) {
    return this.curToken.type === tokenType
  }

  peekTokenIs(tokenType) {
    return this.peekToken.type === tokenType
  }

  expectPeek(tokenType) {
    if (this.peekTokenIs(tokenType)) {
      this.nextToken()
      return true
    } else {
      this.peekError(tokenType)
      return false
    }
  }

  getErrors() {
    return this.errors
  }

  peekError(tokenType) {
    const msg = `expected next token to be ${tokenType}, got ${this.peekToken.type} instead`
    this.errors.push(msg)
  }
}
