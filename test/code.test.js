import { Opcode, make } from '../src/code.js'

function testMake() {
  const tests = [
    {
      op: Opcode.OpConstant,
      operands: [65534],
      expected: [Opcode.OpConstant, 255, 254],
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

function main() {
  testMake()
}

main()
