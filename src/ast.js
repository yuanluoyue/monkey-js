class Node {
  constructor() {
    if (new.target === Node) {
      throw new Error(
        'Node is an abstract class and cannot be instantiated directly.'
      )
    }
  }

  tokenLiteral() {
    throw new Error('TokenLiteral method must be implemented by subclasses.')
  }

  getString() {
    throw new Error('String method must be implemented by subclasses.')
  }
}

class Statement extends Node {
  statementNode() {}
}

class Expression extends Node {
  expressionNode() {}
}

export class Program extends Node {
  statements = []

  constructor() {
    super()
  }

  tokenLiteral() {
    if (this.statements.length > 0) {
      return this.statements[0].tokenLiteral()
    } else {
      return ''
    }
  }

  getString() {
    let out = ''
    for (const s of this.statements) {
      out += s.getString()
    }
    return out
  }
}

export class LetStatement extends Node {
  constructor(token, name, value) {
    super()
    this.token = token
    this.name = name
    this.value = value
  }

  statementNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    out += this.token.literal + ' '
    out += this.name.getString()
    out += ' = '
    if (this.value !== null) {
      out += this.value.getString()
    }
    out += ';'
    return out
  }
}

export class Identifier extends Node {
  constructor(token, value) {
    super()
    this.token = token
    this.value = value
  }

  expressionNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.value
  }
}

export class ReturnStatement extends Node {
  constructor(token, returnValue) {
    super()
    this.token = token
    this.returnValue = returnValue
  }

  statementNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    out += this.token.literal + ' '
    if (this.returnValue !== null) {
      out += this.returnValue.getString()
    }
    out += ';'
    return out
  }
}

export class ExpressionStatement extends Node {
  constructor(token, expression) {
    super()
    this.token = token
    this.expression = expression
  }

  statementNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    if (this.expression !== null) {
      return this.expression.getString()
    }
    return ''
  }
}

export class IntegerLiteral extends Node {
  constructor(token) {
    super()
    this.token = token
    this.value = parseInt(token.literal)
  }

  expressionNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.token.literal
  }
}

export class PrefixExpression extends Node {
  constructor(token, operator, right) {
    super()
    this.token = token
    this.operator = operator
    this.right = right
  }

  expressionNode() {}

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    out += '('
    out += this.operator
    out += this.right.getString()
    out += ')'
    return out
  }
}
