import { SymbolScope, MonkeySymbol, SymbolTable } from '../src/symbolTable.js'

function symbolEquals(sym1, sym2) {
  return (
    sym1.name === sym2.name &&
    sym1.scope === sym2.scope &&
    sym1.index === sym2.index
  )
}

// 测试 Define 方法
function testDefine() {
  const expected = {
    a: new MonkeySymbol('a', SymbolScope.GLOBAL, 0),
    b: new MonkeySymbol('b', SymbolScope.GLOBAL, 1),
  }

  const global = new SymbolTable()

  const a = global.define('a')
  if (!symbolEquals(a, expected.a)) {
    console.error(
      `expected a=${JSON.stringify(expected.a)}, got=${JSON.stringify(a)}`
    )
    return
  }

  const b = global.define('b')
  if (!symbolEquals(b, expected.b)) {
    console.error(
      `expected b=${JSON.stringify(expected.b)}, got=${JSON.stringify(b)}`
    )
    return
  }
}

// 测试 ResolveGlobal 方法
function testResolveGlobal() {
  const global = new SymbolTable()
  global.define('a')
  global.define('b')

  const expected = [
    new MonkeySymbol('a', SymbolScope.GLOBAL, 0),
    new MonkeySymbol('b', SymbolScope.GLOBAL, 1),
  ]

  for (let sym of expected) {
    const result = global.resolve(sym.name)
    if (!result) {
      console.error(`name ${sym.name} not resolvable`)
      continue
    }
    if (!symbolEquals(result, sym)) {
      console.error(
        `expected ${sym.name} to resolve to ${JSON.stringify(
          sym
        )}, got=${JSON.stringify(result)}`
      )
      continue
    }
  }
}

function main() {
  testDefine()
  testResolveGlobal()
}

main()
