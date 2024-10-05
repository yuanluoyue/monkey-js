import { Token, TokenType } from './token.js'

export class Lexer {
  input = ''
  position = 0
  nextPosition = 0
  ch = ''

  constructor(input) {
    this.input = input
    this.readChar()
  }

  nextToken() {
    let token = null

    switch (this.ch) {
      case '=':
        token = new Token(TokenType.ASSIGN, this.ch)
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
        token = new Token(TokenType.ILLEGAL, this.ch)
        break
    }

    this.readChar()

    return token
  }

  readChar() {
    if (this.position >= this.input.length) {
      this.ch = 0
    } else {
      this.ch = this.input[this.nextPosition]
    }

    this.position = this.nextPosition
    this.nextPosition += 1
  }
}
