import {
  Program,
  LetStatement,
  Identifier,
  ReturnStatement,
  ExpressionStatement,
  IntegerLiteral,
  PrefixExpression,
  InfixExpression,
  BooleanLiteral,
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

const precedencesMap = {
  [TokenType.EQ]: EQUALS,
  [TokenType.NOT_EQ]: EQUALS,
  [TokenType.LT]: LESSGREATER,
  [TokenType.GT]: LESSGREATER,
  [TokenType.PLUS]: SUM,
  [TokenType.MINUS]: SUM,
  [TokenType.SLASH]: PRODUCT,
  [TokenType.ASTERISK]: PRODUCT,
}

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
    this.registerPrefix(TokenType.INT, this.parseIntegerLiteral.bind(this))
    this.registerPrefix(TokenType.TRUE, this.parseBooleanLiteral.bind(this))
    this.registerPrefix(TokenType.FALSE, this.parseBooleanLiteral.bind(this))
    this.registerPrefix(TokenType.BANG, this.parsePrefixExpression.bind(this))
    this.registerPrefix(TokenType.MINUS, this.parsePrefixExpression.bind(this))
    this.registerInfix(TokenType.PLUS, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.MINUS, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.SLASH, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.ASTERISK, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.NOT_EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.LT, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.GT, this.parseInfixExpression.bind(this))

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

  parseIntegerLiteral() {
    const literal = new IntegerLiteral(this.curToken)
    const value = parseInt(this.curToken.literal)

    if (isNaN(value)) {
      this.errors.push(`could not parse ${this.curToken.literal} as integer`)
      return null
    }

    literal.value = value

    return literal
  }

  parseBooleanLiteral() {
    return new BooleanLiteral(this.curToken)
  }

  parsePrefixExpression() {
    const expression = new PrefixExpression(
      this.curToken,
      this.curToken.literal
    )
    this.nextToken()
    expression.right = this.parseExpression(PREFIX)
    return expression
  }

  parseInfixExpression(left) {
    const expression = new InfixExpression(
      this.curToken,
      left,
      this.curToken.literal
    )
    const precedence = this.curPrecedence()
    this.nextToken()
    expression.right = this.parseExpression(precedence)
    return expression
  }

  parseExpression(precedence) {
    const prefixFn = this.prefixParseFns[this.curToken.type]
    if (!prefixFn) {
      this.noPrefixParseFnError(this.curToken.type)
      return null
    }
    let leftExp = prefixFn()

    while (
      !this.peekTokenIs(TokenType.SEMICOLON) &&
      precedence < this.peekPrecedence()
    ) {
      const infixFn = this.infixParseFns[this.peekToken.type]
      if (!infixFn) {
        return leftExp
      }

      this.nextToken()

      leftExp = infixFn(leftExp)
    }

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

  peekPrecedence() {
    const precedence = precedencesMap[this.peekToken.type]
    return precedence || LOWEST
  }

  curPrecedence() {
    const precedence = precedencesMap[this.curToken.type]
    return precedence || LOWEST
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

  noPrefixParseFnError(tokenType) {
    const msg = `no prefix parse function for ${tokenType} found`
    this.errors.push(msg)
  }
}
