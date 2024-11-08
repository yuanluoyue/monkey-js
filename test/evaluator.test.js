import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import { evalMonkey } from '../src/object.js'
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
}

main()
