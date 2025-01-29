import { Parser } from '../src/parser.js'
import { Lexer } from '../src/lexer.js'
import { Compiler } from '../src/compiler.js'
import { make, Opcode, Instructions } from '../src/code.js'
import { testIntegerObject } from './utils.js'

function parse(input) {
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  return program
}

function concatInstructions(s) {
  let out = new Instructions()

  for (let ins of s) {
    out = new Instructions(...out, ...ins)
  }

  return out
}

// 测试指令的函数
function testInstructions(expected, actual) {
  const concatted = concatInstructions(expected)

  if (actual.length !== concatted.length) {
    return new Error(
      `wrong instructions length.\nwant=${concatted.toString()}\ngot =${actual.toString()}`
    )
  }

  for (let i = 0; i < concatted.length; i++) {
    if (actual[i] !== concatted[i]) {
      return new Error(
        `wrong instruction at ${i}.\nwant=${concatted.toString()}\ngot =${actual.toString()}`
      )
    }
  }

  return null
}

// 测试常量的函数
// testConstants 函数用于比较预期的常量数组和实际生成的常量数组
function testConstants(expected, actual) {
  // 检查预期常量数组和实际常量数组的长度是否一致
  if (expected.length !== actual.length) {
    return new Error(
      `wrong number of constants. got=${actual.length}, want=${expected.length}`
    )
  }

  for (let i = 0; i < expected.length; i++) {
    const constant = expected[i]
    if (typeof constant === 'number') {
      testIntegerObject(actual[i], constant)
    }
  }

  return null
}

// 运行编译器测试的函数
function runCompilerTests(tests) {
  for (let tt of tests) {
    const program = parse(tt.input)
    const compiler = new Compiler()
    const err = compiler.compile(program)

    if (err) {
      console.error(`compiler error: ${err}`)
      return
    }

    const bytecode = compiler.bytecode()

    const instructionsErr = testInstructions(
      tt.expectedInstructions,
      bytecode.instructions
    )

    if (instructionsErr) {
      console.error(`testInstructions failed: ${instructionsErr}`)
      return
    }

    const constantsErr = testConstants(tt.expectedConstants, bytecode.constants)

    if (constantsErr) {
      console.error(`testConstants failed: ${constantsErr}`)
      return
    }
  }
}

// 测试整数运算的函数
function testIntegerArithmetic() {
  const tests = [
    {
      input: '1 + 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
      ],
    },
  ]

  runCompilerTests(tests)
}

function main() {
  testIntegerArithmetic()
}

main()
