export class Program {
  constructor(statements) {
    this.statements = statements || []
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

export class LetStatement {
  constructor(token, name, value) {
    this.token = token
    this.name = name
    this.value = value
  }

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

export class Identifier {
  constructor(token, value) {
    this.token = token
    this.value = value
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.value
  }
}

export class ReturnStatement {
  constructor(token, returnValue) {
    this.token = token
    this.returnValue = returnValue
  }

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

export class ExpressionStatement {
  constructor(token, expression) {
    this.token = token
    this.expression = expression
  }

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

export class BlockStatement {
  constructor(token, statements) {
    this.token = token
    this.statements = statements || []
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    for (const statement of this.statements) {
      out += statement.getString()
    }
    return out
  }
}

export class IntegerLiteral {
  constructor(token) {
    this.token = token
    this.value = parseInt(token.literal)
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.token.literal
  }
}

export class BooleanLiteral {
  constructor(token) {
    this.token = token
    this.value = token.literal === 'true'
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.token.literal
  }
}

export class FunctionLiteral {
  constructor(token, parameters, body) {
    this.token = token
    this.parameters = parameters
    this.body = body
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    const params = this.parameters.map((p) => p.getString())
    let out = ''
    out += this.tokenLiteral()
    out += '('
    out += params.join(', ')
    out += ') '
    out += this.body.getString()
    return out
  }
}

export class StringLiteral {
  constructor(token, value) {
    this.token = token
    this.value = value
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    return this.token.literal
  }
}

export class ArrayLiteral {
  constructor(token, elements) {
    this.token = token
    this.elements = elements
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''

    const elementsStr = []

    for (const el of this.elements) {
      elementsStr.push(el.getString())
    }

    out += '['
    out += elementsStr.join(', ')
    out += ']'

    return out
  }
}

export class HashLiteral {
  constructor(token, pairs) {
    this.token = token
    this.pairs = pairs || new Map()
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = '{"'

    const pairs = []
    for (const [key, value] of this.pairs) {
      pairs.push(key.string() + ':' + value.string())
    }

    out += pairs.join(', ')
    out += '"}'

    return out
  }
}

export class PrefixExpression {
  constructor(token, operator, right) {
    this.token = token
    this.operator = operator
    this.right = right
  }

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

export class InfixExpression {
  constructor(token, left, operator, right) {
    this.token = token
    this.left = left
    this.operator = operator
    this.right = right
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    out += '('
    out += this.left.getString()
    out += ` ${this.operator} `
    out += this.right.getString()
    out += ')'
    return out
  }
}

export class IfExpression {
  constructor(token, condition, consequence, alternative) {
    this.token = token
    this.condition = condition
    this.consequence = consequence
    this.alternative = alternative
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''
    out += 'if'
    out += this.condition.getString()
    out += ' '
    out += this.consequence.getString()
    if (this.alternative) {
      out += 'else '
      out += this.alternative.getString()
    }
    return out
  }
}

export class CallExpression {
  constructor(token, functionExpression, fnArguments) {
    this.token = token
    this.function = functionExpression
    this.arguments = fnArguments
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    const args = this.arguments.map((arg) => arg.getString())
    let out = ''
    out += this.function.getString()
    out += '('
    out += args.join(', ')
    out += ')'
    return out
  }
}

export class IndexExpression {
  constructor(token, left, index) {
    this.token = token
    this.left = left
    this.index = index
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = '('

    out += this.left.getString()
    out += '['
    out += this.index.getString()
    out += '])'

    return out
  }
}

export class MacroLiteral {
  constructor(token, parameters, body) {
    this.token = token
    this.parameters = parameters
    this.body = body
  }

  tokenLiteral() {
    return this.token.literal
  }

  getString() {
    let out = ''

    let params = []
    for (let p of this.parameters) {
      params.push(p.getString())
    }

    out += this.tokenLiteral()
    out += '('
    out += params.join(', ')
    out += ') '
    out += this.body.getString()

    return out
  }
}
