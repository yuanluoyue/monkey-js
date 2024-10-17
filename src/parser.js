import {
  Program,
  LetStatement,
  Identifier,
  ReturnStatement,
  ExpressionStatement,
} from './ast.js'
import { TokenType } from './token.js'

const _ = 0
const LOWEST = 1
const EQUALS = 2
const LESSGREATER = 3
const SUM = 4
const PRODUCT = 5
const PREFIX = 6
const CALL = 7

export class Parser {
  lexer = null
  curToken = null
  peekToken = null
  prefixParseFns = {}
  infixParseFns = {}
  errors = []

  constructor(lexerInstance) {
    this.lexer = lexerInstance

    this.registerPrefix(TokenType.IDENT, this.parseIdentifier.bind(this))

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
        return this.parseExpressionStatement()
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

  parseExpressionStatement() {
    const statement = new ExpressionStatement(this.curToken)
    statement.expression = this.parseExpression(LOWEST)
    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken()
    }
    return statement
  }

  parseIdentifier() {
    return new Identifier(this.curToken, this.curToken.literal)
  }

  parseExpression(precedence) {
    const prefixFn = this.prefixParseFns[this.curToken.type]
    if (!prefixFn) {
      return null
    }
    const leftExp = prefixFn()
    return leftExp
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

  registerPrefix(tokenType, fn) {
    this.prefixParseFns[tokenType] = fn
  }

  registerInfix(tokenType, fn) {
    this.infixParseFns[tokenType] = fn
  }

  getErrors() {
    return this.errors
  }

  peekError(tokenType) {
    const msg = `expected next token to be ${tokenType}, got ${this.peekToken.type} instead`
    this.errors.push(msg)
  }
}
