export const SymbolScope = {
  GLOBAL: 'GLOBAL',
  LOCAL: 'LOCAL',
}

export class MonkeySymbol {
  constructor(name, scope, index) {
    this.name = name
    this.scope = scope
    this.index = index
  }
}

export class SymbolTable {
  constructor(outer) {
    this.outer = outer
    this.store = {}
    this.numDefinitions = 0
  }

  define(name) {
    const symbol = new MonkeySymbol(
      name,
      this.outer === undefined ? SymbolScope.GLOBAL : SymbolScope.LOCAL,
      this.numDefinitions
    )
    this.store[name] = symbol
    this.numDefinitions++
    return symbol
  }

  resolve(name) {
    let symbol = this.store[name]
    if (!symbol && this.outer !== undefined) {
      symbol = this.outer.resolve(name)
    }
    return symbol
  }
}
