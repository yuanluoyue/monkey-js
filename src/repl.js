import { createInterface } from 'readline'
import { Lexer } from './lexer.js'
import { TokenType } from './token.js'

export const startRepl = (inputStream = process.stdin, outputStream = process.stdout) => {
  const PROMPT = '>> '
  const rl = createInterface({ input: inputStream, output: outputStream, prompt: PROMPT })

  rl.prompt()

  rl.on('line', (line) => {
    const lexer = new Lexer(line)
    let token = lexer.nextToken()
    while (token.type !== TokenType.EOF) {
      outputStream.write(`${JSON.stringify(token)}\n`)
      token = lexer.nextToken()
    }
    rl.prompt()
  })

  rl.on('close', () => {
    outputStream.write('Exiting REPL.\n')
  })
}
