import {
  Program,
  LetStatement,
  Identifier,
  ReturnStatement,
  ExpressionStatement,
  BlockStatement,
  IntegerLiteral,
  IndexExpression,
  PrefixExpression,
  InfixExpression,
  IfExpression,
  BooleanLiteral,
  FunctionLiteral,
  CallExpression,
  StringLiteral,
  ArrayLiteral,
  HashLiteral,
  MacroLiteral,
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
const INDEX = 8

const precedencesMap = {
  [TokenType.EQ]: EQUALS,
  [TokenType.NOT_EQ]: EQUALS,
  [TokenType.LT]: LESSGREATER,
  [TokenType.GT]: LESSGREATER,
  [TokenType.PLUS]: SUM,
  [TokenType.MINUS]: SUM,
  [TokenType.SLASH]: PRODUCT,
  [TokenType.ASTERISK]: PRODUCT,
  [TokenType.LPAREN]: CALL,
  [TokenType.LBRACKET]: INDEX,
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
    this.registerPrefix(
      TokenType.LPAREN,
      this.parseGroupedExpression.bind(this)
    )
    this.registerPrefix(TokenType.IF, this.parseIfExpression.bind(this))
    this.registerPrefix(
      TokenType.FUNCTION,
      this.parseFunctionLiteral.bind(this)
    )
    this.registerPrefix(TokenType.STRING, this.parseStringLiteral.bind(this))
    this.registerPrefix(TokenType.LBRACKET, this.parseArrayLiteral.bind(this))
    this.registerPrefix(TokenType.LBRACE, this.parseHashLiteral.bind(this))
    this.registerPrefix(TokenType.MACRO, this.parseMacroLiteral.bind(this))

    this.registerInfix(TokenType.PLUS, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.MINUS, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.SLASH, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.ASTERISK, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.NOT_EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.LT, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.GT, this.parseInfixExpression.bind(this))
    this.registerInfix(TokenType.LPAREN, this.parseCallExpression.bind(this))
    this.registerInfix(TokenType.LBRACKET, this.parseIndexExpression.bind(this))

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

    this.nextToken()

    statement.value = this.parseExpression(LOWEST)

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
      this.nextToken()
    }

    return statement
  }

  parseReturnStatement() {
    const statement = new ReturnStatement(this.curToken)

    this.nextToken()

    statement.returnValue = this.parseExpression(LOWEST)

    if (this.peekTokenIs(TokenType.SEMICOLON)) {
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

  parseBlockStatement() {
    const block = new BlockStatement(this.curToken)

    this.nextToken()

    while (
      !this.curTokenIs(TokenType.RBRACE) &&
      !this.curTokenIs(TokenType.EOF)
    ) {
      const statement = this.parseStatement()
      if (statement) {
        block.statements.push(statement)
      }
      this.nextToken()
    }

    return block
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

  parseStringLiteral() {
    return new StringLiteral(this.curToken, this.curToken.literal)
  }

  parseArrayLiteral() {
    const arr = new ArrayLiteral(this.curToken)
    arr.elements = this.parseExpressionList(TokenType.RBRACKET)
    return arr
  }

  parseHashLiteral() {
    const hash = new HashLiteral(this.curToken)

    while (!this.peekTokenIs(TokenType.RBRACE)) {
      this.nextToken()
      const key = this.parseExpression(LOWEST)

      if (!this.expectPeek(TokenType.COLON)) {
        return null
      }

      this.nextToken()
      const value = this.parseExpression(LOWEST)

      hash.pairs.set(key, value)

      if (
        !this.peekTokenIs(TokenType.RBRACE) &&
        !this.expectPeek(TokenType.COMMA)
      ) {
        return null
      }
    }

    if (!this.expectPeek(TokenType.RBRACE)) {
      return null
    }

    return hash
  }

  parseMacroLiteral() {
    const literal = new MacroLiteral(this.curToken)

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null
    }

    literal.parameters = this.parseFunctionParameters()

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null
    }

    literal.body = this.parseBlockStatement()

    return literal
  }

  parseExpressionList(end) {
    const list = []

    if (this.peekTokenIs(end)) {
      this.nextToken()
      return list
    }

    this.nextToken()
    list.push(this.parseExpression(LOWEST))

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken()
      this.nextToken()
      list.push(this.parseExpression(LOWEST))
    }

    if (!this.expectPeek(end)) {
      return null
    }

    return list
  }

  parseFunctionLiteral() {
    const literal = new FunctionLiteral(this.curToken)

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null
    }

    literal.parameters = this.parseFunctionParameters()

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null
    }

    literal.body = this.parseBlockStatement()

    return literal
  }

  parseFunctionParameters() {
    const identifiers = []

    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken()
      return identifiers
    }

    this.nextToken()

    const ident = new Identifier(this.curToken, this.curToken.literal)
    identifiers.push(ident)

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken()
      this.nextToken()
      const newIdent = new Identifier(this.curToken, this.curToken.literal)
      identifiers.push(newIdent)
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null
    }

    return identifiers
  }

  parseIfExpression() {
    const expression = new IfExpression(this.curToken)

    if (!this.expectPeek(TokenType.LPAREN)) {
      return null
    }

    this.nextToken()
    expression.condition = this.parseExpression(LOWEST)

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null
    }

    if (!this.expectPeek(TokenType.LBRACE)) {
      return null
    }

    expression.consequence = this.parseBlockStatement()

    if (this.peekTokenIs(TokenType.ELSE)) {
      this.nextToken()

      if (!this.expectPeek(TokenType.LBRACE)) {
        return null
      }

      expression.alternative = this.parseBlockStatement()
    } else {
      expression.alternative = new BlockStatement()
    }

    return expression
  }

  parseGroupedExpression() {
    this.nextToken()
    const expression = this.parseExpression(LOWEST)
    if (!this.expectPeek(TokenType.RPAREN)) {
      return null
    }
    return expression
  }

  parseCallExpression(functionExpression) {
    const expression = new CallExpression(this.curToken, functionExpression)
    expression.arguments = this.parseExpressionList(TokenType.RPAREN)
    return expression
  }

  parseCallArguments() {
    const args = []

    if (this.peekTokenIs(TokenType.RPAREN)) {
      this.nextToken()
      return args
    }

    this.nextToken()
    args.push(this.parseExpression(LOWEST))

    while (this.peekTokenIs(TokenType.COMMA)) {
      this.nextToken()
      this.nextToken()
      args.push(this.parseExpression(LOWEST))
    }

    if (!this.expectPeek(TokenType.RPAREN)) {
      return null
    }

    return args
  }

  parseIndexExpression(left) {
    const expression = new IndexExpression(this.curToken, left)

    this.nextToken()

    expression.index = this.parseExpression(LOWEST)

    if (!this.expectPeek(TokenType.RBRACKET)) {
      return null
    }

    return expression
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
