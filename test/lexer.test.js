import { Lexer } from '../src/lexer.js'
import { TokenType } from '../src/token.js'

const testNextToken = () => {
  const input = `=+(){},;`
  const tests = [
    { expectedType: TokenType.ASSIGN, expectedLiteral: '=' },
    { expectedType: TokenType.PLUS, expectedLiteral: '+' },
    { expectedType: TokenType.LPAREN, expectedLiteral: '(' },
    { expectedType: TokenType.RPAREN, expectedLiteral: ')' },
    { expectedType: TokenType.LBRACE, expectedLiteral: '{' },
    { expectedType: TokenType.RBRACE, expectedLiteral: '}' },
    { expectedType: TokenType.COMMA, expectedLiteral: ',' },
    { expectedType: TokenType.SEMICOLON, expectedLiteral: ';' },
    { expectedType: TokenType.EOF, expectedLiteral: '' },
  ]

  const lexer = new Lexer(input)

  for (let i = 0; i < tests.length; i++) {
    const token = lexer.nextToken()
    const testCase = tests[i]

    if (token.type !== testCase.expectedType) {
      throw new Error(`tests[${i}] - tokentype wrong. expected=${testCase.expectedType}, got=${token.type}`)
    }

    if (token.literal !== testCase.expectedLiteral) {
      throw new Error(`tests[${i}] - literal wrong. expected=${testCase.expectedLiteral}, got=${token.literal}`)
    }
  }
}

const main = () => {
  testNextToken()
}

main()
