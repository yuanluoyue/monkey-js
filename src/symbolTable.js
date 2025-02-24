export const SymbolScope = {
  GLOBAL: 'GLOBAL',
  LOCAL: 'LOCAL',
  BUILTIN: 'BUILTIN',
  FREE: 'FREE',
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
    this.freeSymbols = []
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

  defineBuiltin(name, index) {
    const symbol = new MonkeySymbol(name, SymbolScope.BUILTIN, index)
    this.store[name] = symbol
    return symbol
  }

  defineFree(original) {
    this.freeSymbols.push(original)

    const symbol = new MonkeySymbol(
      original.name,
      SymbolScope.FREE,
      this.freeSymbols.length - 1
    )

    this.store[original.name] = symbol
    return symbol
  }

  resolve(name) {
    let symbol = this.store[name]
    if (!symbol && this.outer !== undefined) {
      symbol = this.outer.resolve(name)

      if (
        symbol.scope === SymbolScope.GLOBAL ||
        symbol.scope === SymbolScope.BUILTIN
      ) {
        return symbol
      }

      const free = this.defineFree(symbol)
      return free
    }
    return symbol
  }
}
