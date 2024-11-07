import { createInterface } from 'readline'
import { Lexer } from './lexer.js'
import { Parser } from './parser.js'

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

    outputStream.write(program.getString())
    outputStream.write('\n')

    rl.prompt()
  })

  rl.on('close', () => {
    outputStream.write('Exiting REPL.\n')
  })
}
