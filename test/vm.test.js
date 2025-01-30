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
  ]

  runVmTests(tests)
}

function main() {
  testIntegerArithmetic()
}

main()
