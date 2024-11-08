import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import { MonkeyInteger, evalMonkey } from '../src/object.js'

const testEval = (input) => {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  return evalMonkey(program)
}

const testIntegerObject = (obj, expected) => {
  if (!(obj instanceof MonkeyInteger)) {
    throw new Error(`object is not Integer. got=${typeof obj} (${obj})`)
  }
  if (obj.value !== expected) {
    throw new Error(
      `object has wrong value. got=${obj.value}, want=${expected}`
    )
  }
  return true
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

const main = () => {
  testEvalIntegerExpression()
}

main()
