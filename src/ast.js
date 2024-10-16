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
}
