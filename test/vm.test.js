import { Compiler } from '../src/compiler.js'
import { MonkeyInteger, MonkeyError, CompiledFunction } from '../src/object.js'
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
    if (expected instanceof MonkeyError) {
      if (!(actual instanceof MonkeyError)) {
        console.error(`object is not Error: ${actual}`)
        return
      }
      if (actual.message !== expected.message) {
        console.error(
          `wrong error message. expected="${expected.message}", got="${actual.message}"`
        )
      }
    } else {
      testHashObject(actual, expected)
    }
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

      const bytecode = comp.bytecode()
      const constants = bytecode.constants
      for (let i = 0; i < constants.length; i++) {
        const constant = constants[i]
        console.log(
          `CONSTANT ${i} ${constant.inspect()} (${constant.constructor.name}):`
        )

        if (constant instanceof CompiledFunction) {
          console.log(` Instructions:`)
          console.log(constant.instructions.toString())
        } else if (constant instanceof MonkeyInteger) {
          console.log(` Value: ${constant.value}`)
        }
      }

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
    {
      input: `
      let returnsOneReturner = fn() {
          let returnsOne = fn() { 1; };
          returnsOne;
      };
      returnsOneReturner()();
      `,
      expected: 1,
    },
  ]

  runVmTests(tests)
}

function testCallingFunctionsWithBindings() {
  const tests = [
    {
      input: `
      let one = fn() { let one = 1; one };
      one();
      `,
      expected: 1,
    },
    {
      input: `
      let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
      oneAndTwo();
      `,
      expected: 3,
    },
    {
      input: `
      let oneAndTwo = fn() { let one = 1; let two = 2; one + two; };
      let threeAndFour = fn() { let three = 3; let four = 4; three + four; };
      oneAndTwo() + threeAndFour();
      `,
      expected: 10,
    },
    {
      input: `
      let firstFoobar = fn() { let foobar = 50; foobar; };
      let secondFoobar = fn() { let foobar = 100; foobar; };
      firstFoobar() + secondFoobar();
      `,
      expected: 150,
    },
    {
      input: `
      let globalSeed = 50;
      let minusOne = fn() {
          let num = 1;
          globalSeed - num;
      }
      let minusTwo = fn() {
          let num = 2;
          globalSeed - num;
      }
      minusOne() + minusTwo();
      `,
      expected: 97,
    },
  ]
  runVmTests(tests)
}

function testCallingFunctionsWithArgumentsAndBindings() {
  const tests = [
    {
      input: `
        let identity = fn(a) { a; };
        identity(4);
      `,
      expected: 4,
    },
    {
      input: `
        let sum = fn(a, b) { a + b; };
        sum(1, 2);
      `,
      expected: 3,
    },
    {
      input: `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        sum(1, 2);
      `,
      expected: 3,
    },
    {
      input: `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        sum(1, 2) + sum(3, 4);`,
      expected: 10,
    },
    {
      input: `
        let sum = fn(a, b) {
            let c = a + b;
            c;
        };
        let outer = fn() {
            sum(1, 2) + sum(3, 4);
        };
        outer();
        `,
      expected: 10,
    },
    {
      input: `
        let globalNum = 10;

        let sum = fn(a, b) {
            let c = a + b;
            c + globalNum;
        };

        let outer = fn() {
            sum(1, 2) + sum(3, 4) + globalNum;
        };

        outer() + globalNum;
        `,
      expected: 50,
    },
  ]

  runVmTests(tests)
}

function testCallingFunctionsWithWrongArguments() {
  const tests = [
    {
      input: 'fn() { 1; }(1);',
      expected: 'wrong number of arguments: want=0, got=1',
    },
    {
      input: 'fn(a) { a; }();',
      expected: 'wrong number of arguments: want=1, got=0',
    },
    {
      input: 'fn(a, b) { a + b; }(1);',
      expected: 'wrong number of arguments: want=2, got=1',
    },
  ]

  for (const test of tests) {
    const program = parse(test.input)
    const compiler = new Compiler()
    const compileErr = compiler.compile(program)
    if (compileErr) {
      console.error(`compiler error: ${compileErr}`)
      return
    }

    const vm = new VM(compiler.bytecode())
    const runErr = vm.run()
    if (!runErr) {
      console.error('expected VM error but resulted in none.')
      return
    }

    if (runErr.message !== test.expected) {
      console.error(
        `wrong VM error: want="${test.expected}", got="${runErr.message}"`
      )
      return
    }
  }
}

function testBuiltinFunctions() {
  const tests = [
    { input: `len("")`, expected: 0 },
    { input: `len("four")`, expected: 4 },
    { input: `len("hello world")`, expected: 11 },
    {
      input: `len(1)`,
      expected: new MonkeyError('argument to `len` not supported, got INTEGER'),
    },
    {
      input: `len("one", "two")`,
      expected: new MonkeyError('wrong number of arguments. got=2, want=1'),
    },
    { input: `len([1, 2, 3])`, expected: 3 },
    { input: `len([])`, expected: 0 },
    { input: `puts("hello", "world!")`, expected: null },
    { input: `first([1, 2, 3])`, expected: 1 },
    { input: `first([])`, expected: null },
    {
      input: `first(1)`,
      expected: new MonkeyError(
        'argument to `first` must be ARRAY, got INTEGER'
      ),
    },
    { input: `last([1, 2, 3])`, expected: 3 },
    { input: `last([])`, expected: null },
    {
      input: `last(1)`,
      expected: new MonkeyError(
        'argument to `last` must be ARRAY, got INTEGER'
      ),
    },
    { input: `rest([1, 2, 3])`, expected: [2, 3] },
    { input: `rest([])`, expected: null },
    { input: `push([], 1)`, expected: [1] },
    {
      input: `push(1, 1)`,
      expected: new MonkeyError(
        'argument to `push` must be ARRAY, got INTEGER'
      ),
    },
  ]

  runVmTests(tests)
}

function testClosures() {
  const tests = [
    {
      input: `
      let newClosure = fn(a) {
          fn() { a; };
      };
      let closure = newClosure(99);
      closure();
      `,
      expected: 99,
    },
    {
      input: `
  let newAdder = fn(a, b) {
      fn(c) { a + b + c };
  };
  let adder = newAdder(1, 2);
  adder(8);
  `,
      expected: 11,
    },
    {
      input: `
  let newAdder = fn(a, b) {
      let c = a + b;
      fn(d) { c + d };
  };
  let adder = newAdder(1, 2);
  adder(8);
  `,
      expected: 11,
    },
    {
      input: `
  let newAdder = fn(a, b) {
      fn(c) { a + b + c };
  };
  let adder = newAdder(1, 2);
  adder(8);
  `,
      expected: 11,
    },
    {
      input: `
  let newAdder = fn(a, b) {
      let c = a + b;
      fn(d) { c + d };
  };
  let adder = newAdder(1, 2);
  adder(8);
  `,
      expected: 11,
    },
    {
      input: `
      let newAdderOuter = fn(a, b) {
          let c = a + b;
          fn(d) {
              let e = d + c;
              fn(f) { e + f; };
          };
      };
      let newAdderInner = newAdderOuter(1, 2)
      let adder = newAdderInner(3);
      adder(8);
      `,
      expected: 14,
    },
    {
      input: `
      let a = 1;
      let newAdderOuter = fn(b) {
          fn(c) {
              fn(d) { a + b + c + d };
          };
      };
      let newAdderInner = newAdderOuter(2)
      let adder = newAdderInner(3);
      adder(8);
      `,
      expected: 14,
    },
    {
      input: `
      let newClosure = fn(a, b) {
          let one = fn() { a; };
          let two = fn() { b; };
          fn() { one() + two(); };
      };
      let closure = newClosure(9, 90);
      closure();
      `,
      expected: 99,
    },
  ]

  runVmTests(tests)
}

function testRecursiveFunctions() {
  const tests = [
    {
      input: `
      let countDown = fn(x) {
          if (x == 0) {
              return 0;
          } else {
              countDown(x - 1);
          }
      };
      countDown(1);
      `,
      expected: 0,
    },
    {
      input: `
  let countDown = fn(x) {
      if (x == 0) {
          return 0;
      } else {
          countDown(x - 1);
      }
  };
  let wrapper = fn() {
      countDown(1);
  };
  wrapper();
  `,
      expected: 0,
    },
    {
      input: `
  let wrapper = fn() {
      let countDown = fn(x) {
          if (x == 0) {
              return 0;
          } else {
              countDown(x - 1);
          }
      };
      countDown(1);
  };
  wrapper();
  `,
      expected: 0,
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
  testCallingFunctionsWithBindings()
  testCallingFunctionsWithArgumentsAndBindings()
  testCallingFunctionsWithWrongArguments()
  testBuiltinFunctions()
  testClosures()
  testRecursiveFunctions()
}

main()
