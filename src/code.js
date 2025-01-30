export const Opcode = {
  OpConstant: 0,
  OpAdd: 1,
}

class Definition {
  constructor(name, operandWidths) {
    this.name = name
    // operandWidths 定义成数组主要是为了适应不同操作码（Opcode）可能有多个操作数，且每个操作数的宽度可能不同的情况
    this.operandWidths = operandWidths || []
  }
}

export class Instructions extends Array {
  constructor(...items) {
    if (items.length === 1) {
      super()
      this.push(items[0])
    } else {
      super(...items)
    }
  }

  fmtInstruction(def, operands) {
    const operandCount = def.operandWidths.length

    switch (operandCount) {
      case 0:
        return def.name
      case 1:
        return `${def.name} ${operands[0]}`
      default:
        return `ERROR: unhandled operandCount for ${def.name}\n`
    }
  }

  toString() {
    let out = ''
    let i = 0
    while (i < this.length) {
      const def = lookup(this[i])
      if (!def) {
        out += `ERROR: opcode ${this[i]} undefined\n`
        i++
        continue
      }

      const { operands, offset } = readOperands(def, this.slice(i + 1))
      out += `${String(i).padStart(4, '0')} ${this.fmtInstruction(
        def,
        operands
      )}\n`
      i += 1 + offset
    }
    return out
  }
}

const definitions = {
  [Opcode.OpConstant]: new Definition('OpConstant', [2]), // OpConstant 操作码的第一个操作数的宽度为 2 字节
  [Opcode.OpAdd]: new Definition('OpAdd', []),
}

export function lookup(op) {
  const def = definitions[op]
  if (!def) {
    throw new Error(`opcode ${op} undefined`)
  }
  return def
}

// 读取操作数的函数
export function readOperands(def, ins) {
  const operands = new Instructions(def.operandWidths.length).fill(0)
  let offset = 0

  for (let i = 0; i < def.operandWidths.length; i++) {
    const width = def.operandWidths[i]
    switch (width) {
      case 2:
        operands[i] = readUint16(ins.slice(offset))
        break
    }
    offset += width
  }

  return { operands, offset }
}

// 读取 16 位无符号整数的函数
export function readUint16(ins) {
  const buffer = new ArrayBuffer(2)
  const view = new DataView(buffer)
  for (let i = 0; i < 2; i++) {
    view.setUint8(i, ins[i])
  }
  return view.getUint16(0, false)
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

  let instruction = new Instructions(instructionLen).fill(0)
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
