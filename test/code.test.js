import {
  Opcode,
  make,
  Instructions,
  lookup,
  readOperands,
} from '../src/code.js'

function testMake() {
  const tests = [
    {
      op: Opcode.OpConstant,
      operands: [65534],
      expected: [Opcode.OpConstant, 255, 254],
    },
    {
      op: Opcode.OpAdd,
      operands: [],
      expected: [Opcode.OpAdd],
    },
  ]

  for (let tt of tests) {
    let instruction = make(tt.op, ...tt.operands)

    if (instruction.length !== tt.expected.length) {
      console.error(
        `instruction has wrong length. want=${tt.expected.length}, got=${instruction.length}`
      )
    }

    for (let i = 0; i < tt.expected.length; i++) {
      let b = tt.expected[i]
      if (instruction[i] !== tt.expected[i]) {
        console.error(
          `wrong byte at pos ${i}. want=${b}, got=${instruction[i]}`
        )
      }
    }
  }
}

function testInstructionsString() {
  const instructions = [
    make(Opcode.OpAdd),
    make(Opcode.OpConstant, 2),
    make(Opcode.OpConstant, 65535),
  ]

  const expected = `0000 OpAdd
0001 OpConstant 2
0004 OpConstant 65535
`

  let concatted = []
  for (let ins of instructions) {
    concatted = new Instructions(...concatted, ...ins)
  }

  if (concatted.toString() !== expected) {
    console.error(
      `instructions wrongly formatted.\nwant="${expected}"\ngot="${concatted.toString()}"`
    )
  }
}

function testReadOperands() {
  // 定义测试用例数组
  const tests = [
    {
      op: Opcode.OpConstant,
      operands: [65535],
      bytesRead: 2,
    },
  ]

  // 遍历测试用例
  for (let tt of tests) {
    // 生成指令
    const instruction = make(tt.op, ...tt.operands)

    // 查找操作码对应的定义
    const def = lookup(tt.op)
    if (!def) {
      console.error(`definition not found: opcode ${tt.op} undefined`)
      return
    }

    // 读取操作数
    const { operands, offset } = readOperands(def, instruction.slice(1))
    if (offset !== tt.bytesRead) {
      console.error(`offset wrong. want=${tt.bytesRead}, got=${offset}`)
      return
    }

    // 比较读取的操作数和预期的操作数
    for (let i = 0; i < tt.operands.length; i++) {
      const want = tt.operands[i]
      if (operands[i] !== want) {
        console.error(`operand wrong. want=${want}, got=${operands[i]}`)
      }
    }
  }
}

function main() {
  testMake()
  testInstructionsString()
  testReadOperands()
}

main()
