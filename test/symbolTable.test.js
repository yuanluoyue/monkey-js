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
    c: new MonkeySymbol('c', SymbolScope.LOCAL, 0),
    d: new MonkeySymbol('d', SymbolScope.LOCAL, 1),
    e: new MonkeySymbol('e', SymbolScope.LOCAL, 0),
    f: new MonkeySymbol('f', SymbolScope.LOCAL, 1),
  }

  const global = new SymbolTable()

  const a = global.define('a')
  if (!symbolEquals(a, expected.a)) {
    console.error(
      `expected a=${JSON.stringify(expected.a)}, got=${JSON.stringify(a)}`
    )
  }

  const b = global.define('b')
  if (!symbolEquals(b, expected.b)) {
    console.error(
      `expected b=${JSON.stringify(expected.b)}, got=${JSON.stringify(b)}`
    )
  }

  const firstLocal = new SymbolTable(global)

  const c = firstLocal.define('c')
  if (!symbolEquals(c, expected.c)) {
    console.error(
      `expected c=${JSON.stringify(expected.c)}, got=${JSON.stringify(c)}`
    )
  }

  const d = firstLocal.define('d')
  if (!symbolEquals(d, expected.d)) {
    console.error(
      `expected d=${JSON.stringify(expected.d)}, got=${JSON.stringify(d)}`
    )
  }

  const secondLocal = new SymbolTable(firstLocal)

  const e = secondLocal.define('e')
  if (!symbolEquals(e, expected.e)) {
    console.error(
      `expected e=${JSON.stringify(expected.e)}, got=${JSON.stringify(e)}`
    )
  }

  const f = secondLocal.define('f')
  if (!symbolEquals(f, expected.f)) {
    console.error(
      `expected f=${JSON.stringify(expected.f)}, got=${JSON.stringify(f)}`
    )
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

function testResolveLocal() {
  const global = new SymbolTable()
  global.define('a')
  global.define('b')

  const local = new SymbolTable(global)
  local.define('c')
  local.define('d')

  const expected = [
    new MonkeySymbol('a', SymbolScope.GLOBAL, 0),
    new MonkeySymbol('b', SymbolScope.GLOBAL, 1),
    new MonkeySymbol('c', SymbolScope.LOCAL, 0),
    new MonkeySymbol('d', SymbolScope.LOCAL, 1),
  ]

  for (const sym of expected) {
    const result = local.resolve(sym.name)
    if (!result) {
      console.error(`name ${sym.name} not resolvable`)
      continue
    }
    if (
      result.name !== sym.name ||
      result.scope !== sym.scope ||
      result.index !== sym.index
    ) {
      console.error(`expected ${sym.name} to resolve to`, sym, `, got=`, result)
    }
  }
}

function testResolveNestedLocal() {
  const global = new SymbolTable()
  global.define('a')
  global.define('b')

  const firstLocal = new SymbolTable(global)
  firstLocal.define('c')
  firstLocal.define('d')

  const secondLocal = new SymbolTable(firstLocal)
  secondLocal.define('e')
  secondLocal.define('f')

  const tests = [
    {
      table: firstLocal,
      expectedSymbols: [
        new MonkeySymbol('a', SymbolScope.GLOBAL, 0),
        new MonkeySymbol('b', SymbolScope.GLOBAL, 1),
        new MonkeySymbol('c', SymbolScope.LOCAL, 0),
        new MonkeySymbol('d', SymbolScope.LOCAL, 1),
      ],
    },
    {
      table: secondLocal,
      expectedSymbols: [
        new MonkeySymbol('a', SymbolScope.GLOBAL, 0),
        new MonkeySymbol('b', SymbolScope.GLOBAL, 1),
        new MonkeySymbol('e', SymbolScope.LOCAL, 0),
        new MonkeySymbol('f', SymbolScope.LOCAL, 1),
      ],
    },
  ]

  for (let tt of tests) {
    for (let sym of tt.expectedSymbols) {
      const result = tt.table.resolve(sym.name)
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
}

function main() {
  testDefine()
  testResolveGlobal()
  testResolveLocal()
  testResolveNestedLocal()
}

main()
