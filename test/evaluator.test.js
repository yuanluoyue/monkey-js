import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import {
  MonkeyError,
  MonkeyFunction,
  MonkeyString,
  MonkeyArray,
  MonkeyHash,
  MonkeyInteger,
  MonkeyBoolean,
} from '../src/object.js'
import { evalMonkey } from '../src/evaluator.js'
import {
  testIntegerObject,
  testBooleanObject,
  testNullObject,
} from './utils.js'

const testEval = (input) => {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  return evalMonkey(program)
}

const testEvalIntegerExpression = () => {
  const tests = [
    { input: '5', expected: 5 },
    { input: '10', expected: 10 },
    { input: '-5', expected: -5 },
    { input: '-10', expected: -10 },
    { input: '5 + 5 + 5 + 5 - 10', expected: 10 },
    { input: '2 * 2 * 2 * 2 * 2', expected: 32 },
    { input: '-50 + 100 + -50', expected: 0 },
    { input: '5 * 2 + 10', expected: 20 },
    { input: '5 + 2 * 10', expected: 25 },
    { input: '20 + 2 * -10', expected: 0 },
    { input: '50 / 2 * 2 + 10', expected: 60 },
    { input: '2 * (5 + 10)', expected: 30 },
    { input: '3 * 3 * 3 + 10', expected: 37 },
    { input: '3 * (3 * 3) + 10', expected: 37 },
    { input: '(5 + 10 * 2 + 15 / 3) * 2 + -10', expected: 50 },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testIntegerObject(evaluated, test.expected)) {
      return
    }
  }
}

const testEvalBooleanExpression = () => {
  const tests = [
    { input: 'true', expected: true },
    { input: 'false', expected: false },
    { input: '1 < 2', expected: true },
    { input: '1 > 2', expected: false },
    { input: '1 < 1', expected: false },
    { input: '1 > 1', expected: false },
    { input: '1 == 1', expected: true },
    { input: '1!= 1', expected: false },
    { input: '1 == 2', expected: false },
    { input: '1!= 2', expected: true },
    { input: 'true == true', expected: true },
    { input: 'false == false', expected: true },
    { input: 'true == false', expected: false },
    { input: 'true!= false', expected: true },
    { input: 'false!= true', expected: true },
    { input: '(1 < 2) == true', expected: true },
    { input: '(1 < 2) == false', expected: false },
    { input: '(1 > 2) == true', expected: false },
    { input: '(1 > 2) == false', expected: true },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testBooleanObject(evaluated, test.expected)) {
      return
    }
  }
}

const testBangOperator = () => {
  const tests = [
    { input: '!true', expected: false },
    { input: '!false', expected: true },
    { input: '!5', expected: false },
    { input: '!!true', expected: true },
    { input: '!!false', expected: false },
    { input: '!!5', expected: true },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testBooleanObject(evaluated, test.expected)) {
      return
    }
  }
}

function testIfElseExpressions() {
  const tests = [
    { input: 'if (true) { 10 }', expected: 10 },
    { input: 'if (false) { 10 }', expected: null },
    { input: 'if (1) { 10 }', expected: 10 },
    { input: 'if (0) { 10 }', expected: null },
    { input: 'if (1 < 2) { 10 }', expected: 10 },
    { input: 'if (1 > 2) { 10; }', expected: null },
    { input: 'if (1 > 2) { 10; } else { 20; }', expected: 20 },
    { input: 'if (1 < 2) { 10; } else { 20; }', expected: 10 },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)

    if (typeof test.expected === 'number') {
      if (!testIntegerObject(evaluated, test.expected)) {
        return
      }
    } else {
      if (!testNullObject(evaluated)) {
        return
      }
    }
  }
}

function testReturnStatements() {
  const tests = [
    { input: 'return 10;', expected: 10 },
    { input: 'return 10; 9;', expected: 10 },
    { input: 'return 2 * 5; 9;', expected: 10 },
    { input: '9; return 2 * 5; 9;', expected: 10 },
    {
      input: `if (10 > 1) { if (10 > 1) { return 10; } return 1; }`,
      expected: 10,
    },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testIntegerObject(evaluated, test.expected)) {
      return
    }
  }
}

function testErrorHandling() {
  const tests = [
    {
      input: '5 + true;',
      expectedMessage: 'type mismatch: INTEGER + BOOLEAN',
    },
    {
      input: '5 + true; 5;',
      expectedMessage: 'type mismatch: INTEGER + BOOLEAN',
    },
    {
      input: '-true',
      expectedMessage: 'unknown operator: -BOOLEAN',
    },
    {
      input: 'true + false;',
      expectedMessage: 'unknown operator: BOOLEAN + BOOLEAN',
    },
    {
      input: '5; true + false; 5',
      expectedMessage: 'unknown operator: BOOLEAN + BOOLEAN',
    },
    {
      input: 'if (10 > 1) { true + false; }',
      expectedMessage: 'unknown operator: BOOLEAN + BOOLEAN',
    },
    {
      input: `if (10 > 1) { if (10 > 1) { return true + false; } return 1; }`,
      expectedMessage: 'unknown operator: BOOLEAN + BOOLEAN',
    },
    {
      input: 'foobar',
      expectedMessage: 'identifier not found: foobar',
    },
    {
      input: '"Hello" - "World"',
      expectedMessage: 'unknown operator: STRING - STRING',
    },
    {
      input: `{"name": "Monkey"}[fn(x) { x }];`,
      expectedMessage: 'unusable as hash key: FUNCTION',
    },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!(evaluated instanceof MonkeyError)) {
      throw new Error(
        `no error object returned. got=${typeof evaluated}(${evaluated})`
      )
    }
    if (evaluated.message !== test.expectedMessage) {
      throw new Error(
        `wrong error message. expected=${test.expectedMessage}, got=${evaluated.message}`
      )
    }
  }
}

function testLetStatements() {
  const tests = [
    { input: 'let a = 5; a;', expected: 5 },
    { input: 'let a = 5 * 5; a;', expected: 25 },
    { input: 'let a = 5; let b = a; b;', expected: 5 },
    { input: 'let a = 5; let b = a; let c = a + b + 5; c;', expected: 15 },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testIntegerObject(evaluated, test.expected)) {
      return
    }
  }
}

function testFunctionObject() {
  const input = 'fn(x) { x + 2; };'
  const evaluated = testEval(input)
  if (!(evaluated instanceof MonkeyFunction)) {
    throw new Error(
      `object is not Function. got=${typeof evaluated} (${evaluated})`
    )
  }
  const fn = evaluated
  if (fn.parameters.length !== 1) {
    throw new Error(
      `function has wrong parameters. Parameters=${fn.parameters}`
    )
  }
  if (fn.parameters[0].getString() !== 'x') {
    throw new Error(`parameter is not 'x'. got=${fn.parameters[0]}`)
  }
  const expectedBody = '(x + 2)'
  if (fn.body.getString() !== expectedBody) {
    throw new Error(`body is not ${expectedBody}. got=${fn.body.toString()}`)
  }
}

function testFunctionApplication() {
  const tests = [
    { input: 'let identity = fn(x) { x; }; identity(5);', expected: 5 },
    { input: 'let identity = fn(x) { return x; }; identity(5);', expected: 5 },
    { input: 'let double = fn(x) { x * 2; }; double(5);', expected: 10 },
    { input: 'let add = fn(x, y) { x + y; }; add(5, 5);', expected: 10 },
    {
      input: 'let add = fn(x, y) { x + y; }; add(5 + 5, add(5, 5));',
      expected: 20,
    },
    { input: 'fn(x) { x; }(5)', expected: 5 },
  ]

  for (const test of tests) {
    const evaluated = testEval(test.input)
    if (!testIntegerObject(evaluated, test.expected)) {
      return
    }
  }
}

function testClosures() {
  const input = `let newAdder = fn(x) { fn(y) { x + y }; }; let addTwo = newAdder(2); addTwo(2);`
  const evaluated = testEval(input)
  if (!testIntegerObject(evaluated, 4)) {
    return
  }
}

function testStringLiteral() {
  const input = '"Hello World!"'
  const evaluated = testEval(input)

  if (!(evaluated instanceof MonkeyString)) {
    throw new Error(
      `object is not String. got=${typeof evaluated} (${evaluated})`
    )
  }

  const str = evaluated
  if (str.value !== 'Hello World!') {
    throw new Error(`String has wrong value. got=${str.value}`)
  }
}

function testStringConcatenation() {
  const input = '"Hello" + " " + "World!"'
  const evaluated = testEval(input)

  if (!(evaluated instanceof MonkeyString)) {
    throw new Error(
      `object is not String. got=${typeof evaluated} (${evaluated})`
    )
  }

  const str = evaluated
  if (str.value !== 'Hello World!') {
    throw new Error(`String has wrong value. got=${str.value}`)
  }
}

function testBuiltinFunctions() {
  const tests = [
    { input: 'len("")', expected: 0 },
    { input: 'len("four")', expected: 4 },
    { input: 'len("hello world")', expected: 11 },
    {
      input: 'len(1)',
      expected: 'argument to `len` not supported, got INTEGER',
    },
    {
      input: 'len("one", "two")',
      expected: 'wrong number of arguments. got=2, want=1',
    },
  ]

  for (const tt of tests) {
    const evaluated = testEval(tt.input)

    if (typeof tt.expected === 'number') {
      testIntegerObject(evaluated, tt.expected)
    } else if (typeof tt.expected === 'string') {
      const errObj = evaluated
      if (!(errObj instanceof MonkeyError)) {
        console.error(
          `object is not Error. got=${typeof evaluated} (${evaluated})`
        )
        continue
      }
      if (errObj.message !== tt.expected) {
        console.error(
          `wrong error message. expected=${tt.expected}, got=${errObj.message}`
        )
      }
    }
  }
}

function testArrayLiterals() {
  const input = '[1, 2 * 2, 3 + 3]'

  const evaluated = testEval(input)
  const result = evaluated
  if (!(result instanceof MonkeyArray)) {
    console.error(`object is not Array. got=${typeof evaluated} (${evaluated})`)
    return
  }

  if (result.elements.length !== 3) {
    console.error(
      `array has wrong num of elements. got=${result.elements.length}`
    )
    return
  }

  testIntegerObject(result.elements[0], 1)
  testIntegerObject(result.elements[1], 4)
  testIntegerObject(result.elements[2], 6)
}

function testArrayIndexExpressions() {
  const tests = [
    {
      input: '[1, 2, 3][0]',
      expected: 1,
    },
    {
      input: '[1, 2, 3][1]',
      expected: 2,
    },
    {
      input: '[1, 2, 3][2]',
      expected: 3,
    },
    {
      input: 'let i = 0; [1][i];',
      expected: 1,
    },
    {
      input: '[1, 2, 3][1 + 1];',
      expected: 3,
    },
    {
      input: 'let myArray = [1, 2, 3]; myArray[2];',
      expected: 3,
    },
    {
      input: 'let myArray = [1, 2, 3]; myArray[0] + myArray[1] + myArray[2];',
      expected: 6,
    },
    {
      input: 'let myArray = [1, 2, 3]; let i = myArray[0]; myArray[i]',
      expected: 2,
    },
    {
      input: '[1, 2, 3][3]',
      expected: null,
    },
    {
      input: '[1, 2, 3][-1]',
      expected: null,
    },
  ]

  for (const tt of tests) {
    const evaluated = testEval(tt.input)
    if (typeof tt.expected === 'number') {
      testIntegerObject(evaluated, tt.expected)
    } else {
      testNullObject(evaluated)
    }
  }
}

function testStringHashKey() {
  // 为了解决这个问题，理论上 monkeyString 应该指向同一个
  // const name1 = new MonkeyString('name')
  // const name2 = new MonkeyString('name')
  // const monkey = new MonkeyString('monkey')
  // const pairs = new Map()
  // pairs.set(name1, monkey)
  // pairs.get(name1) // monkey
  // pairs.get(name2) // null
  // name1 === name2 // false

  const hello1 = new MonkeyString('Hello World')
  const hello2 = new MonkeyString('Hello World')
  const diff1 = new MonkeyString('My name is johnny')
  const diff2 = new MonkeyString('My name is johnny')

  if (hello1.hashKey() !== hello2.hashKey()) {
    console.error('strings with same content have different hash keys')
  }

  if (diff1.hashKey() !== diff2.hashKey()) {
    console.error('strings with same content have different hash keys')
  }

  if (hello1.hashKey() === diff1.hashKey()) {
    console.error('strings with different content have same hash keys')
  }
}

function testHashLiterals() {
  const input = `let two = "two";
  {
      "one": 10 - 9,
      two: 1 + 1,
      "thr" + "ee": 6 / 2,
      4: 4,
      true: 5,
      false: 6
  }`

  const evaluated = testEval(input)
  const result = evaluated
  if (!(result instanceof MonkeyHash)) {
    console.error(
      `Eval didn't return Hash. got=${typeof evaluated} (${evaluated})`
    )
    return
  }

  const expected = {
    [new MonkeyString('one').hashKey()]: 1,
    [new MonkeyString('two').hashKey()]: 2,
    [new MonkeyString('three').hashKey()]: 3,
    [new MonkeyInteger(4).hashKey()]: 4,
    [new MonkeyBoolean(true).hashKey()]: 5,
    [new MonkeyBoolean(false).hashKey()]: 6,
  }

  if (Object.keys(result.pairs).length !== Object.keys(expected).length) {
    console.error(
      `Hash has wrong num of pairs. got=${Object.keys(result.pairs).length}`
    )
    return
  }

  for (const expectedKey in expected) {
    const pair = result.pairs[expectedKey]
    if (!pair) {
      console.error(`no pair for given key in Pairs`)
    }

    testIntegerObject(pair, expected[expectedKey])
  }
}

function testHashIndexExpressions() {
  const tests = [
    {
      input: `{"foo": 5}["foo"]`,
      expected: 5,
    },
    {
      input: `{"foo": 5}["bar"]`,
      expected: null,
    },
    {
      input: `let key = "foo"; {"foo": 5}[key]`,
      expected: 5,
    },
    {
      input: `{}["foo"]`,
      expected: null,
    },
    {
      input: `{5: 5}[5]`,
      expected: 5,
    },
    {
      input: `{true: 5}[true]`,
      expected: 5,
    },
    {
      input: `{false: 5}[false]`,
      expected: 5,
    },
  ]

  for (let tt of tests) {
    const evaluated = testEval(tt.input)
    if (typeof tt.expected === 'number') {
      testIntegerObject(evaluated, tt.expected)
    } else {
      testNullObject(evaluated)
    }
  }
}

const main = () => {
  testEvalIntegerExpression()
  testEvalBooleanExpression()
  testBangOperator()
  testIfElseExpressions()
  testReturnStatements()
  testErrorHandling()
  testLetStatements()
  testFunctionObject()
  testFunctionApplication()
  testClosures()
  testStringLiteral()
  testStringConcatenation()
  testBuiltinFunctions()
  testArrayLiterals()
  testArrayIndexExpressions()
  testStringHashKey()
  testHashLiterals()
  testHashIndexExpressions()
}

main()
