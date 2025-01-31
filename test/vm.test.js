import { Compiler } from '../src/compiler.js'
import { VM } from '../src/vm.js'

import { testIntegerObject, testBooleanObject, parse } from './utils.js'

function testExpectedObject(expected, actual) {
  if (typeof expected === 'number') {
    testIntegerObject(actual, expected)
  } else if (typeof expected === 'boolean') {
    testBooleanObject(actual, expected)
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
  ]

  runVmTests(tests)
}

function main() {
  testIntegerArithmetic()
  testBooleanExpressions()
}

main()
