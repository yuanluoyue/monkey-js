export const SymbolScope = {
  GLOBAL: 'GLOBAL',
}

export class MonkeySymbol {
  constructor(name, scope, index) {
    this.name = name
    this.scope = scope
    this.index = index
  }
}

export class SymbolTable {
  constructor() {
    this.store = {}
    this.numDefinitions = 0
  }

  define(name) {
    const symbol = new MonkeySymbol(
      name,
      SymbolScope.GLOBAL,
      this.numDefinitions
    )
    this.store[name] = symbol
    this.numDefinitions++
    return symbol
  }

  resolve(name) {
    const symbol = this.store[name]
    return symbol
  }
}
