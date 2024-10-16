import { Token, TokenType, lookupIdent } from './token.js'

export class Lexer {
  input = ''
  position = 0
  nextPosition = 0
  ch = ''

  constructor(input) {
    this.input = input + ' '
    this.readChar()
  }

  nextToken() {
    let token = new Token(null, null)

    this.skipWhitespace()

    switch (this.ch) {
      case '=':
        if (this.peekChar() === '=') {
          const ch = this.ch
          this.readChar()
          const literal = ch + this.ch
          token = new Token(TokenType.EQ, literal)
        } else {
          token = new Token(TokenType.ASSIGN, this.ch)
        }
        break
      case ';':
        token = new Token(TokenType.SEMICOLON, this.ch)
        break
      case '(':
        token = new Token(TokenType.LPAREN, this.ch)
        break
      case ')':
        token = new Token(TokenType.RPAREN, this.ch)
        break
      case ',':
        token = new Token(TokenType.COMMA, this.ch)
        break
      case '+':
        token = new Token(TokenType.PLUS, this.ch)
        break
      case '-':
        token = new Token(TokenType.MINUS, this.ch)
        break
      case '!':
        if (this.peekChar() === '=') {
          const ch = this.ch
          this.readChar()
          const literal = ch + this.ch
          token = new Token(TokenType.NOT_EQ, literal)
        } else {
          token = new Token(TokenType.BANG, this.ch)
        }
        break
      case '*':
        token = new Token(TokenType.ASTERISK, this.ch)
        break
      case '/':
        token = new Token(TokenType.SLASH, this.ch)
        break
      case '<':
        token = new Token(TokenType.LT, this.ch)
        break
      case '>':
        token = new Token(TokenType.GT, this.ch)
        break
      case '{':
        token = new Token(TokenType.LBRACE, this.ch)
        break
      case '}':
        token = new Token(TokenType.RBRACE, this.ch)
        break
      case undefined:
        token = new Token(TokenType.EOF, '')
        break
      default:
        if (this.isLetter(this.ch)) {
          token.literal = this.readIdentifier()
          token.type = lookupIdent(token.literal)
          return token
        } else if (this.isDigit(this.ch)) {
          token.literal = this.readNumber()
          token.type = TokenType.INT
          return token
        } else {
          token = new Token(TokenType.ILLEGAL, this.ch)
        }
        break
    }

    this.readChar()

    return token
  }

  skipWhitespace() {
    while (this.ch === ' ' || this.ch === '\t' || this.ch === '\n' || this.ch === '\r') {
      this.readChar()
    }
  }

  readChar() {
    if (this.position >= this.input.length) {
      this.ch = undefined
    } else {
      this.ch = this.input[this.nextPosition]
    }

    this.position = this.nextPosition
    this.nextPosition += 1
  }

  isLetter(ch) {
    return /[a-z]/i.test(ch) || ch === '_'
  }

  isDigit(ch) {
    return !isNaN(parseInt(ch)) && ch !== ''
  }

  readIdentifier() {
    let start = this.position
    while (this.isLetter(this.ch)) {
      this.readChar()
    }
    return this.input.substring(start, this.position)
  }

  readNumber() {
    let start = this.position
    while (this.isDigit(this.ch)) {
      this.readChar()
    }
    return this.input.substring(start, this.position)
  }

  peekChar() {
    if (this.nextPosition >= this.input.length) {
      return
    } else {
      return this.input[this.nextPosition]
    }
  }
}
