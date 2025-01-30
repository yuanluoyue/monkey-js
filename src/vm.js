import { MonkeyInteger, MonkeyObjectType } from './object.js'
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

  executeBinaryIntegerOperation(op, left, right) {
    const leftValue = left.value
    const rightValue = right.value

    let result

    switch (op) {
      case Opcode.OpAdd:
        result = leftValue + rightValue
        break
      case Opcode.OpSub:
        result = leftValue - rightValue
        break
      case Opcode.OpMul:
        result = leftValue * rightValue
        break
      case Opcode.OpDiv:
        result = Math.floor(leftValue / rightValue)
        break
      default:
        return new Error(`unknown integer operator: ${op}`)
    }

    return this.push(new MonkeyInteger(result))
  }

  executeBinaryOperation(op) {
    const right = this.pop()
    const left = this.pop()

    const leftType = left.type()
    const rightType = right.type()

    if (
      leftType === MonkeyObjectType.INTEGER &&
      rightType === MonkeyObjectType.INTEGER
    ) {
      return this.executeBinaryIntegerOperation(op, left, right)
    }

    return new Error(
      `unsupported types for binary operation: ${leftType} ${rightType}`
    )
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
        case Opcode.OpSub:
        case Opcode.OpMul:
        case Opcode.OpDiv:
          const err = this.executeBinaryOperation(op)
          if (err) {
            return err
          }
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
