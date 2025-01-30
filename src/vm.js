import { MonkeyInteger } from './object.js'
import { Opcode, readUint16 } from './code.js'

const StackSize = 2048

export class VM {
  constructor(bytecode) {
    this.constants = bytecode.constants
    this.instructions = bytecode.instructions

    this.stack = new Array(StackSize).fill(null)
    this.sp = 0
  }

  stackTop() {
    if (this.sp === 0) {
      return null
    }
    return this.stack[this.sp - 1]
  }

  lastPoppedStackElem() {
    return this.stack[this.sp]
  }

  push(o) {
    if (this.sp >= StackSize) {
      return new Error('stack overflow')
    }
    this.stack[this.sp] = o
    this.sp++
    return null
  }

  pop() {
    if (this.sp === 0) {
      return null
    }
    const o = this.stack[this.sp - 1]
    this.sp--
    return o
  }

  run() {
    for (let ip = 0; ip < this.instructions.length; ip++) {
      const op = this.instructions[ip]
      switch (op) {
        case Opcode.OpConstant:
          const constIndex = readUint16(this.instructions.slice(ip + 1))
          ip += 2
          this.push(this.constants[constIndex])
          break

        case Opcode.OpAdd:
          const right = this.pop()
          const left = this.pop()
          if (
            !(right instanceof MonkeyInteger) ||
            !(left instanceof MonkeyInteger)
          ) {
            return new Error('操作数不是有效的整数对象')
          }
          const leftValue = left.value
          const rightValue = right.value
          const result = leftValue + rightValue

          this.push(new MonkeyInteger(result))
          break

        case Opcode.OpPop:
          this.pop()
          break
        // default:
        //   return new Error(`未知操作码: ${op}`)
      }
    }
    return null
  }
}
