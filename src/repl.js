import { createInterface } from 'readline'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'
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

  const env = newEnvironment()
  const macroEnv = newEnvironment()

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

    defineMacros(program, macroEnv)
    const expanded = expandMacros(program, macroEnv)
    const evaluated = evalMonkey(expanded, env)

    if (evaluated !== null) {
      outputStream.write(evaluated?.inspect() || '')
      outputStream.write('\n')
    }

    rl.prompt()
  })

  rl.on('close', () => {
    outputStream.write('Exiting REPL.\n')
  })
}
