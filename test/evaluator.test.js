import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import { evalMonkey } from '../src/evaluator.js'
import { testIntegerObject, testBooleanObject } from './utils.js'

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

const main = () => {
  testEvalIntegerExpression()
  testEvalBooleanExpression()
  testBangOperator()
}

main()
