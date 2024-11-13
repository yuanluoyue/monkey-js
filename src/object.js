export const MonkeyObjectType = {
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
  RETURN_VALUE: 'RETURN_VALUE',
  ERROR: 'ERROR',
  FUNCTION: 'FUNCTION',
  STRING: 'STRING',
  BUILTIN: 'BUILTIN',
  ARRAY: 'ARRAY',
  HASH: 'HASH',
}

class MonkeyObject {
  type() {
    throw new Error('Object type method must be implemented.')
  }
  inspect() {
    throw new Error('Object inspect method must be implemented.')
  }
}

export class MonkeyInteger extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.INTEGER
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyBoolean extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.BOOLEAN
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyString extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.STRING
  }

  inspect() {
    return this.value.toString()
  }

  hashKey() {
    const hash = {
      type: this.type(),
      value: this.value,
    }
    return JSON.stringify(hash)
  }
}

export class MonkeyNull extends MonkeyObject {
  type() {
    return MonkeyObjectType.NULL
  }

  inspect() {
    return 'null'
  }
}

export class MonkeyReturnValue extends MonkeyObject {
  constructor(value) {
    super()
    this.value = value
  }

  type() {
    return MonkeyObjectType.RETURN_VALUE
  }

  inspect() {
    return this.value.toString()
  }
}

export class MonkeyError extends MonkeyObject {
  constructor(message) {
    super()
    this.message = message
  }
  type() {
    return MonkeyObjectType.ERROR
  }
  inspect() {
    return 'ERROR: ' + this.message
  }
}

export class MonkeyFunction {
  constructor(parameters, body, env) {
    this.parameters = parameters
    this.body = body
    this.env = env
  }
  type() {
    return MonkeyObjectType.FUNCTION
  }
  inspect() {
    let params = []
    for (const p of this.parameters) {
      params.push(p.getString())
    }
    let out = `fn(${params.join(', ')}) {\n${this.body.getString()}\n}`
    return out
  }
}

export class MonkeyArray {
  constructor(elements) {
    this.elements = elements
  }

  type() {
    return MonkeyObjectType.ARRAY
  }

  inspect() {
    let out = ''

    const elementsStr = []
    for (const e of this.elements) {
      elementsStr.push(e.inspect())
    }

    out += '['
    out += elementsStr.join(', ')
    out += ']'

    return out
  }
}

export class MonkeyHash {
  constructor(pairs) {
    this.pairs = pairs
  }

  type() {
    return MonkeyObjectType.HASH
  }

  inspect() {
    let out = ''

    const elementsStr = []
    for (const key in this.pairs) {
      const keyObj = JSON.parse(key)

      elementsStr.push(`${keyObj.value}: ${this.pairs[key].inspect()}`)
    }

    out += '{'
    out += elementsStr.join(', ')
    out += '}'

    return out
  }
}

export class MonkeyBuiltin {
  constructor(fn) {
    this.fn = fn
  }

  type() {
    return MonkeyObjectType.BUILTIN
  }

  inspect() {
    return 'builtin function'
  }
}

export class MonkeyEnvironment {
  constructor(outer = null) {
    this.store = {}
    this.outer = outer
  }

  get(name) {
    let obj = this.store?.[name]
    if (!obj && this.outer) {
      return this.outer.get(name)
    }
    return obj
  }

  set(name, val) {
    this.store[name] = val
    return val
  }
}
