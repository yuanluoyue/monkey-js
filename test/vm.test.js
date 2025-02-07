import { Compiler } from '../src/compiler.js'
import { MonkeyInteger } from '../src/object.js'
import { VM } from '../src/vm.js'

import {
  testIntegerObject,
  testBooleanObject,
  testNullObject,
  testStringObject,
  testArrayObject,
  testHashObject,
  parse,
} from './utils.js'

function testExpectedObject(expected, actual) {
  if (typeof expected === 'number') {
    testIntegerObject(actual, expected)
  } else if (typeof expected === 'boolean') {
    testBooleanObject(actual, expected)
  } else if (expected === null) {
    testNullObject(actual)
  } else if (typeof expected === 'string') {
    testStringObject(actual, expected)
  } else if (Array.isArray(expected)) {
    testArrayObject(actual, expected)
  } else if (typeof expected === 'object' && expected !== null) {
    testHashObject(actual, expected)
  }
}

function runVmTests(tests) {
  for (let tt of tests) {
    const program = parse(tt.input)

    const comp = new Compiler()
    const compileErr = comp.compile(program)
    if (compileErr) {
      console.error(`compiler error: ${compileErr}`)
      return
    }

    const vm = new VM(comp.bytecode())
    const runErr = vm.run()
    if (runErr) {
      console.error(`vm error: ${runErr}`)
      return
    }

    const stackElem = vm.lastPoppedStackElem()
    testExpectedObject(tt.expected, stackElem)
  }
}

function testIntegerArithmetic() {
  const tests = [
    {
      input: '1',
      expected: 1,
    },
    {
      input: '2',
      expected: 2,
    },
    {
      input: '1 + 2',
      expected: 3,
    },
    {
      input: '1 - 2',
      expected: -1,
    },
    {
      input: '1 * 2',
      expected: 2,
    },
    {
      input: '4 / 2',
      expected: 2,
    },
    {
      input: '50 / 2 * 2 + 10 - 5',
      expected: 55,
    },
    {
      input: '5 + 5 + 5 + 5 - 10',
      expected: 10,
    },
    {
      input: '2 * 2 * 2 * 2 * 2',
      expected: 32,
    },
    {
      input: '5 * 2 + 10',
      expected: 20,
    },
    {
      input: '5 + 2 * 10',
      expected: 25,
    },
    {
      input: '5 * (2 + 10)',
      expected: 60,
    },
    { input: '-5', expected: -5 },
    { input: '-10', expected: -10 },
    { input: '-50 + 100 + -50', expected: 0 },
    { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
  ]

  runVmTests(tests)
}

function testBooleanExpressions() {
  const tests = [
    {
      input: 'true',
      expected: true,
    },
    {
      input: 'false',
      expected: false,
    },
    { input: '1 < 2', expected: true },
    { input: '1 > 2', expected: false },
    { input: '1 < 1', expected: false },
    { input: '1 > 1', expected: false },
    { input: '1 == 1', expected: true },
    { input: '1 != 1', expected: false },
    { input: '1 == 2', expected: false },
    { input: '1 != 2', expected: true },
    { input: 'true == true', expected: true },
    { input: 'false == false', expected: true },
    { input: 'true == false', expected: false },
    { input: 'true != false', expected: true },
    { input: 'false != true', expected: true },
    { input: '(1 < 2) == true', expected: true },
    { input: '(1 < 2) == false', expected: false },
    { input: '(1 > 2) == true', expected: false },
    { input: '(1 > 2) == false', expected: true },
    { input: '!true', expected: false },
    { input: '!false', expected: true },
    { input: '!5', expected: false },
    { input: '!!true', expected: true },
    { input: '!!false', expected: false },
    { input: '!!5', expected: true },
    { input: '!(if (false) { 5; })', expected: true },
  ]

  runVmTests(tests)
}

function testConditionals() {
  const tests = [
    { input: 'if (true) { 10 }', expected: 10 },
    { input: 'if (true) { 10 } else { 20 }', expected: 10 },
    { input: 'if (false) { 10 } else { 20 } ', expected: 20 },
    { input: 'if (1) { 10 }', expected: 10 },
    { input: 'if (1 < 2) { 10 }', expected: 10 },
    { input: 'if (1 < 2) { 10 } else { 20 }', expected: 10 },
    { input: 'if (1 > 2) { 10 } else { 20 }', expected: 20 },
    { input: 'if (1 > 2) { 10 }', expected: null },
    { input: 'if (false) { 10 }', expected: null },
    { input: 'if ((if (false) { 10 })) { 10 } else { 20 }', expected: 20 },
  ]

  runVmTests(tests)
}

function testGlobalLetStatements() {
  const tests = [
    { input: 'let one = 1; one', expected: 1 },
    { input: 'let one = 1; let two = 2; one + two', expected: 3 },
    { input: 'let one = 1; let two = one + one; one + two', expected: 3 },
  ]

  runVmTests(tests)
}

// 测试字符串表达式
function testStringExpressions() {
  const tests = [
    { input: '"monkey"', expected: 'monkey' },
    { input: '"mon" + "key"', expected: 'monkey' },
    { input: '"mon" + "key" + "banana"', expected: 'monkeybanana' },
  ]

  runVmTests(tests)
}

function testArrayLiterals() {
  const tests = [
    { input: '[]', expected: [] },
    { input: '[1, 2, 3]', expected: [1, 2, 3] },
    { input: '[1 + 2, 3 * 4, 5 + 6]', expected: [3, 12, 11] },
  ]

  runVmTests(tests)
}

function testHashLiterals() {
  const tests = [
    { input: '{}', expected: {} },
    {
      input: '{1: 2, 2: 3}',
      expected: {
        [new MonkeyInteger(1).hashKey()]: 2,
        [new MonkeyInteger(2).hashKey()]: 3,
      },
    },
    {
      input: '{1 + 1: 2 * 2, 3 + 3: 4 * 4}',
      expected: {
        [new MonkeyInteger(2).hashKey()]: 4,
        [new MonkeyInteger(6).hashKey()]: 16,
      },
    },
  ]

  runVmTests(tests)
}

function testIndexExpressions() {
  const tests = [
    { input: '[1, 2, 3][1]', expected: 2 },
    { input: '[1, 2, 3][0 + 2]', expected: 3 },
    { input: '[[1, 1, 1]][0][0]', expected: 1 },
    { input: '[][0]', expected: null },
    { input: '[1, 2, 3][99]', expected: null },
    { input: '[1][-1]', expected: null },
    { input: '{1: 1, 2: 2}[1]', expected: 1 },
    { input: '{1: 1, 2: 2}[2]', expected: 2 },
    { input: '{1: 1}[0]', expected: null },
    { input: '{}[0]', expected: null },
  ]

  runVmTests(tests)
}

function testCallingFunctionsWithoutArguments() {
  const tests = [
    {
      input: `
      let fivePlusTen = fn() { 5 + 10; };
      fivePlusTen();
      `,
      expected: 15,
    },
    {
      input: `
      let one = fn() { 1; };
      let two = fn() { 2; };
      one() + two()
      `,
      expected: 3,
    },
    {
      input: `
      let a = fn() { 1 };
      let b = fn() { a() + 1 };
      let c = fn() { b() + 1 };
      c();
      `,
      expected: 3,
    },
  ]

  runVmTests(tests)
}

function testFunctionsWithReturnStatement() {
  const tests = [
    {
      input: `
      let earlyExit = fn() { return 99; 100; };
      earlyExit();
      `,
      expected: 99,
    },
    {
      input: `
      let earlyExit = fn() { return 99; return 100; };
      earlyExit();
      `,
      expected: 99,
    },
  ]

  runVmTests(tests)
}

function testFunctionsWithoutReturnValue() {
  const tests = [
    {
      input: `
      let noReturn = fn() { };
      noReturn();
      `,
      expected: null,
    },
    {
      input: `
      let noReturn = fn() { };
      let noReturnTwo = fn() { noReturn(); };
      noReturn();
      noReturnTwo();
      `,
      expected: null,
    },
  ]

  runVmTests(tests)
}

function testFirstClassFunctions() {
  const tests = [
    {
      input: `
      let returnsOne = fn() { 1; };
      let returnsOneReturner = fn() { returnsOne; };
      returnsOneReturner()();
      `,
      expected: 1,
    },
  ]

  runVmTests(tests)
}

function main() {
  testIntegerArithmetic()
  testBooleanExpressions()
  testConditionals()
  testGlobalLetStatements()
  testStringExpressions()
  testArrayLiterals()
  testHashLiterals()
  testIndexExpressions()
  testCallingFunctionsWithoutArguments()
  testFunctionsWithReturnStatement()
  testFunctionsWithoutReturnValue()
  testFirstClassFunctions()
}

main()
