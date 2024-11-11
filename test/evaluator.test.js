import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import {
  evalMonkey,
  MonkeyError,
  MonkeyFunction,
  MonkeyString,
} from '../src/evaluator.js'
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
}

main()
