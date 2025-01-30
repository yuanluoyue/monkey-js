import { Compiler } from '../src/compiler.js'
import { VM } from '../src/vm.js'

import { testIntegerObject, parse } from './utils.js'

function testExpectedObject(expected, actual) {
  if (typeof expected === 'number') {
    testIntegerObject(actual, expected)
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
  ]

  runVmTests(tests)
}

function main() {
  testIntegerArithmetic()
}

main()
