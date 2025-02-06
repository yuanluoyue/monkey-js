import { Compiler } from '../src/compiler.js'
import { make, Opcode, Instructions } from '../src/code.js'
import { CompiledFunction } from '../src/object.js'
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
    } else if (
      Array.isArray(constant) &&
      constant.every((item) => Array.isArray(item))
    ) {
      const fn = actual[i]
      if (!(fn instanceof CompiledFunction)) {
        return new Error(`constant ${i} - not a function: ${typeof fn}`)
      }

      const err = testInstructions(constant, fn.instructions)

      if (err) {
        return new Error(
          `constant ${i} - testInstructions failed: ${err.message}`
        )
      }
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

function testArrayLiterals() {
  const tests = [
    {
      input: '[]',
      expectedConstants: [],
      expectedInstructions: [make(Opcode.OpArray, 0), make(Opcode.OpPop)],
    },
    {
      input: '[1, 2, 3]',
      expectedConstants: [1, 2, 3],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpArray, 3),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '[1 + 2, 3 - 4, 5 * 6]',
      expectedConstants: [1, 2, 3, 4, 5, 6],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpAdd),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpConstant, 3),
        make(Opcode.OpSub),
        make(Opcode.OpConstant, 4),
        make(Opcode.OpConstant, 5),
        make(Opcode.OpMul),
        make(Opcode.OpArray, 3),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function testHashLiterals() {
  const tests = [
    {
      input: '{}',
      expectedConstants: [],
      expectedInstructions: [make(Opcode.OpHash, 0), make(Opcode.OpPop)],
    },
    {
      input: '{1: 2, 3: 4, 5: 6}',
      expectedConstants: [1, 2, 3, 4, 5, 6],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpConstant, 3),
        make(Opcode.OpConstant, 4),
        make(Opcode.OpConstant, 5),
        make(Opcode.OpHash, 6),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '{ 1: 2 + 3, 4: 5 * 6 }',
      expectedConstants: [1, 2, 3, 4, 5, 6],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpAdd),
        make(Opcode.OpConstant, 3),
        make(Opcode.OpConstant, 4),
        make(Opcode.OpConstant, 5),
        make(Opcode.OpMul),
        make(Opcode.OpHash, 4),
        make(Opcode.OpPop),
      ],
    },
  ]
  runCompilerTests(tests)
}

function testIndexExpressions() {
  const tests = [
    {
      input: '[1, 2, 3][1 + 1]',
      expectedConstants: [1, 2, 3, 1, 1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpArray, 3),
        make(Opcode.OpConstant, 3),
        make(Opcode.OpConstant, 4),
        make(Opcode.OpAdd),
        make(Opcode.OpIndex),
        make(Opcode.OpPop),
      ],
    },
    {
      input: '{1: 2}[2 - 1]',
      expectedConstants: [1, 2, 2, 1],
      expectedInstructions: [
        make(Opcode.OpConstant, 0),
        make(Opcode.OpConstant, 1),
        make(Opcode.OpHash, 2),
        make(Opcode.OpConstant, 2),
        make(Opcode.OpConstant, 3),
        make(Opcode.OpSub),
        make(Opcode.OpIndex),
        make(Opcode.OpPop),
      ],
    },
  ]

  runCompilerTests(tests)
}

function testFunctions() {
  const tests = [
    {
      input: 'fn() { return 5 + 10 }',
      expectedConstants: [
        5,
        10,
        [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpAdd),
          make(Opcode.OpReturnValue),
        ],
      ],
      expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
    },
    {
      input: 'fn() { 5 + 10 }',
      expectedConstants: [
        5,
        10,
        [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpAdd),
          make(Opcode.OpReturnValue),
        ],
      ],
      expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
    },
    {
      input: 'fn() { 1; 2 }',
      expectedConstants: [
        1,
        2,
        [
          make(Opcode.OpConstant, 0),
          make(Opcode.OpPop),
          make(Opcode.OpConstant, 1),
          make(Opcode.OpReturnValue),
        ],
      ],
      expectedInstructions: [make(Opcode.OpConstant, 2), make(Opcode.OpPop)],
    },
    {
      input: 'fn() { }',
      expectedConstants: [[make(Opcode.OpReturn)]],
      expectedInstructions: [make(Opcode.OpConstant, 0), make(Opcode.OpPop)],
    },
  ]

  runCompilerTests(tests)
}

function testCompilerScopes() {
  const compiler = new Compiler()

  if (compiler.scopeIndex !== 0) {
    console.error(`scopeIndex wrong. got=${compiler.scopeIndex}, want=0`)
  }

  compiler.emit(Opcode.OpMul)

  compiler.enterScope()
  if (compiler.scopeIndex !== 1) {
    console.error(`scopeIndex wrong. got=${compiler.scopeIndex}, want=1`)
  }

  compiler.emit(Opcode.OpSub)

  if (compiler.scopes[compiler.scopeIndex].instructions.length !== 1) {
    console.error(
      `instructions length wrong. got=${
        compiler.scopes[compiler.scopeIndex].instructions.length
      }`
    )
  }

  const last = compiler.scopes[compiler.scopeIndex].lastInstruction
  if (last.opcode !== Opcode.OpSub) {
    console.error(
      `lastInstruction.opcode wrong. got=${last.opcode}, want=${Opcode.OpSub}`
    )
  }

  compiler.leaveScope()
  if (compiler.scopeIndex !== 0) {
    console.error(`scopeIndex wrong. got=${compiler.scopeIndex}, want=0`)
  }

  compiler.emit(Opcode.OpAdd)

  if (compiler.scopes[compiler.scopeIndex].instructions.length !== 2) {
    console.error(
      `instructions length wrong. got=${
        compiler.scopes[compiler.scopeIndex].instructions.length
      }`
    )
  }

  const lastAfterLeave = compiler.scopes[compiler.scopeIndex].lastInstruction
  if (lastAfterLeave.opcode !== Opcode.OpAdd) {
    console.error(
      `lastInstruction.opcode wrong. got=${lastAfterLeave.opcode}, want=${Opcode.OpAdd}`
    )
  }

  const previous = compiler.scopes[compiler.scopeIndex].previousInstruction
  if (previous.opcode !== Opcode.OpMul) {
    console.error(
      `previousInstruction.opcode wrong. got=${previous.opcode}, want=${Opcode.OpMul}`
    )
  }
}

function testFunctionCalls() {
  const tests = [
    {
      input: 'fn() { 24 }();',
      expectedConstants: [
        24,
        [make(Opcode.OpConstant, 0), make(Opcode.OpReturnValue)],
      ],
      expectedInstructions: [
        make(Opcode.OpConstant, 1),
        make(Opcode.OpCall),
        make(Opcode.OpPop),
      ],
    },
    {
      input: `
          let noArg = fn() { 24 };
          noArg();
          `,
      expectedConstants: [
        24,
        [make(Opcode.OpConstant, 0), make(Opcode.OpReturnValue)],
      ],
      expectedInstructions: [
        make(Opcode.OpConstant, 1),
        make(Opcode.OpSetGlobal, 0),
        make(Opcode.OpGetGlobal, 0),
        make(Opcode.OpCall),
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
  testArrayLiterals()
  testHashLiterals()
  testIndexExpressions()
  testFunctions()
  testCompilerScopes()
  testFunctionCalls()
}

main()
