import { Compiler } from '../src/compiler.js'
import { make, Opcode, Instructions } from '../src/code.js'
import { testIntegerObject, testStringObject, parse } from './utils.js'

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
    } else if (typeof constant === 'string') {
      testStringObject(actual[i], constant)
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
        make(Opcode.OpAdd),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1; 2;',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpPop),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1 - 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpSub),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1 * 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpMul),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '2 / 1',
      expectedConstants: [2, 1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpDiv),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '-1',
      expectedConstants: [1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpMinus),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

// 测试布尔表达式
function testBooleanExpressions() {
  const tests = [
    {
      input: 'true',
      expectedConstants: [],
      expectedInstructions: [make(Opcode.OpTrue), make(Opcode.OpPop)],
    },
    {
      input: 'false',
      expectedConstants: [],
      expectedInstructions: [make(Opcode.OpFalse), make(Opcode.OpPop)],
    },
    {
      input: '1 > 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpGreaterThan),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1 < 2',
      expectedConstants: [2, 1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpGreaterThan),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1 == 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpEqual),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '1 != 2',
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpNotEqual),
        make(Opcode.OpPop),
      ],
    },
    {
      input: 'true == false',
      expectedConstants: [],
      expectedInstructions: [
        make(Opcode.OpTrue),
        make(Opcode.OpFalse),
        make(Opcode.OpEqual),
        make(Opcode.OpPop),
      ],
    },
    {
      input: 'true != false',
      expectedConstants: [],
      expectedInstructions: [
        make(Opcode.OpTrue),
        make(Opcode.OpFalse),
        make(Opcode.OpNotEqual),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '!true',
      expectedConstants: [],
      expectedInstructions: [
        make(Opcode.OpTrue),
        make(Opcode.OpBang),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function testConditionals() {
  const tests = [
    {
      input: `
          if (true) { 10 }; 3333;
          `,
      expectedConstants: [10, 3333],
      expectedInstructions: [
        // 0000
        make(Opcode.OpTrue),
        // 0001
        make(Opcode.OpJumpNotTruthy, 10),
        // 0004
        make(Opcode.OpConstant, 0),
        // 0007
        make(Opcode.OpJump, 11),
        // 0010
        make(Opcode.OpNull),
        // 0011
        make(Opcode.OpPop),
        // 0012
        make(Opcode.OpConstant, 1),
        // 0015
        make(Opcode.OpPop),
      ],
    },
    {
      input: `
      if (true) { 10 } else { 20 }; 3333;
      `,
      expectedConstants: [10, 20, 3333],
      expectedInstructions: [
        // 0000
        make(Opcode.OpTrue),
        // 0001
        make(Opcode.OpJumpNotTruthy, 10),
        // 0004
        make(Opcode.OpConstant, 0),
        // 0007
        make(Opcode.OpJump, 13),
        // 0010
        make(Opcode.OpConstant, 1),
        // 0013
        make(Opcode.OpPop),
        // 0014
        make(Opcode.OpConstant, 2),
        // 0017
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function testGlobalLetStatements() {
  const tests = [
    {
      input: `
            let one = 1;
            let two = 2;
        `,
      expectedConstants: [1, 2],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpSetGlobal, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpSetGlobal, 1),
      ],
    },
    {
      input: `
            let one = 1;
            one;
        `,
      expectedConstants: [1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpSetGlobal, 0),
        make(Opcode.OpGetGlobal, 0),
        make(Opcode.OpPop),
      ],
    },
    {
      input: `
            let one = 1;
            let two = one;
            two;
        `,
      expectedConstants: [1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpSetGlobal, 0),
        make(Opcode.OpGetGlobal, 0),
        make(Opcode.OpSetGlobal, 1),
        make(Opcode.OpGetGlobal, 1),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function testStringExpressions() {
  const tests = [
    {
      input: `"monkey"`,
      expectedConstants: ['monkey'],
      expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpPop)],
    },
    {
      input: `"mon" + "key"`,
      expectedConstants: ['mon', 'key'],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpAdd),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function main() {
  testIntegerArithmetic()
  testBooleanExpressions()
  testConditionals()
  testGlobalLetStatements()
  testStringExpressions()
}

main()
