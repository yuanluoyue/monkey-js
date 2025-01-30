import { createInterface } from 'readline'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
import { Compiler } from '../src/compiler.js'
import { VM } from '../src/vm.js'
import { evalMonkey, newEnvironment } from './evaluator.js'
import { defineMacros, expandMacros } from '../src/marco.js'

const MONKEY_FACE = `            
            __,__
    .--. .-"     "-. .--.
  /.. \/ .-..-.  \/.. \ 
 | |  '|  /   Y   \  |'  | |
 | \   \\  \\ 0 | 0 /  /   / |
  \\ '-,\\.-"""""""-./, -' /
   ''-' /_   ^ ^   _\\ '-''
       |  \\._   _./  |
       \\   \\ '~' /   /
        '._ '-=-' _.'
           '-----'
`

const printParserErrors = (outputStream, errors) => {
  outputStream.write(MONKEY_FACE)
  outputStream.write('Woops! We ran into some monkey business here!\n')
  outputStream.write(' parser errors:\n')
  errors.forEach((msg) => outputStream.write('\t' + msg + '\n'))
}

export const startRepl = (
  inputStream = process.stdin,
  outputStream = process.stdout
) => {
  const PROMPT = '>> '
  const rl = createInterface({
    input: inputStream,
    output: outputStream,
    prompt: PROMPT,
  })

  rl.prompt()

  rl.on('line', (line) => {
    const lexer = new Lexer(line)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()

    if (parser.getErrors().length !== 0) {
      printParserErrors(outputStream, parser.getErrors())
      rl.prompt()
      return
    }

    const comp = new Compiler()
    const compileErr = comp.compile(program)
    if (compileErr) {
      console.error(`Woops! Compilation failed:\n ${compileErr}`)
    }

    const machine = new VM(comp.bytecode())
    const runErr = machine.run()
    if (runErr) {
      console.error(`Woops! Executing bytecode failed:\n ${runErr}`)
    }

    const stackTop = machine.lastPoppedStackElem()
    if (stackTop && typeof stackTop.inspect === 'function') {
      console.log(stackTop.inspect())
    }

    rl.prompt()
  })

  rl.on('close', () => {
    outputStream.write('Exiting REPL.\n')
  })
}
