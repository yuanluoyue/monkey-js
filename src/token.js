export const TokenType = {
  ILLEGAL: 'ILLEGAL',
  EOF: 'EOF',

  IDENT: 'IDENT',
  INT: 'INT',

  ASSIGN: '=',
  PLUS: '+',
  MINUS: '-',
  BANG: '!',
  ASTERISK: '*',
  SLASH: '/',

  LT: '<',
  GT: '>',

  EQ: '==',
  NOT_EQ: '!=',

  COMMA: ',',
  SEMICOLON: ';',

  LPAREN: '(',
  RPAREN: ')',
  LBRACE: '{',
  RBRACE: '}',

  FUNCTION: 'FUNCTION',
  LET: 'LET',
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  IF: 'IF',
  ELSE: 'ELSE',
  RETURN: 'RETURN',

  STRING: 'STRING',

  LBRACKET: '[',
  RBRACKET: ']',

  COLON: ':',
}

const keywordIdentMap = {
  fn: 'FUNCTION',
  let: 'LET',
  true: 'TRUE',
  false: 'FALSE',
  if: 'IF',
  else: 'ELSE',
  return: 'RETURN',
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
