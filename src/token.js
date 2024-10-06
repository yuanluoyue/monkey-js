export const TokenType = {
  ILLEGAL: 'ILLEGAL',
  EOF: 'EOF',

  IDENT: 'IDENT',
  INT: 'INT',

  ASSIGN: '=',
  PLUS: '+',

  COMMA: ',',
  SEMICOLON: ';',

  LPAREN: '(',
  RPAREN: ')',
  LBRACE: '{',
  RBRACE: '}',

  FUNCTION: 'FUNCTION',
  LET: 'LET',
}

const keywordIdentMap = {
  fn: 'FUNCTION',
  let: 'LET',
}

export class Token {
  type = ''
  literal = ''

  constructor(type, literal) {
    this.type = type
    this.literal = literal
  }
}

export const lookupIdent = (ident) => {
  if (keywordIdentMap[ident]) {
    return keywordIdentMap[ident]
  }

  return 'IDENT'
}
