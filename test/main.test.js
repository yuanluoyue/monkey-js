import { Lexer } from '../src/lexer.js'
import { Parser } from '../src/parser.js'
import { evalMonkey } from '../src/evaluator.js'
import { Compiler } from '../src/compiler.js'
import { VM } from '../src/vm.js'

const input = `
let fibonacci = fn(x) {
  if (x == 0) {
    0
  } else {
    if (x == 1) {
      return 1;
    } else {
      fibonacci(x - 1) + fibonacci(x - 2);
    }
  }
};
fibonacci(25);
`

function testCompiler() {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  const compiler = new Compiler()
  const compileErr = compiler.compile(program)

  if (compileErr) {
    console.error(`compiler error: ${compileErr}`)
    return
  }
  const vm = new VM(compiler.bytecode())
  const start = new Date()
  const runErr = vm.run()
  const end = new Date()
  if (runErr) {
    console.error(`vm error: ${runErr}`)
  }
  console.log(`testCompiler time: ${end - start}ms`)
}

function testEval() {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  const start = new Date()
  evalMonkey(program)
  const end = new Date()
  console.log(`testEval time: ${end - start}ms`)
}

function main() {
  testCompiler()
  testEval()
}

main()
