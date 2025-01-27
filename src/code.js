export const Opcode = {
  OpConstant: 0,
}

class Definition {
  constructor(name, operandWidths) {
    this.name = name
    // operandWidths 定义成数组主要是为了适应不同操作码（Opcode）可能有多个操作数，且每个操作数的宽度可能不同的情况
    this.operandWidths = operandWidths || []
  }
}

const definitions = {
  [Opcode.OpConstant]: new Definition('OpConstant', [2]), // OpConstant 操作码的第一个操作数的宽度为 2 字节
}

function lookup(op) {
  const def = definitions[op]
  if (!def) {
    throw new Error(`opcode ${op} undefined`)
  }
  return def
}

export function make(op, ...operands) {
  // 查找操作码对应的定义
  const def = definitions[op]
  if (!def) {
    return []
  }

  let instructionLen = 1
  for (let w of def.operandWidths) {
    instructionLen += w
  }

  let instruction = new Array(instructionLen).fill(0)
  instruction[0] = op

  let offset = 1
  for (let i = 0; i < operands.length; i++) {
    let o = operands[i]
    let width = def.operandWidths[i]
    switch (width) {
      case 2:
        // 对于 2 字节的操作数，使用 DataView 进行大端序存储
        let view = new DataView(new ArrayBuffer(2))
        view.setUint16(0, o, false)
        for (let j = 0; j < 2; j++) {
          instruction[offset + j] = view.getUint8(j)
        }
        break
    }
    offset += width
  }
  return instruction
}
