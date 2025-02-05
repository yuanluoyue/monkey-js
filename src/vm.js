import {
  MonkeyInteger,
  MonkeyObjectType,
  MonkeyBoolean,
  MonkeyNull,
  MonkeyString,
  MonkeyArray,
} from './object.js'
import { Opcode, readUint16 } from './code.js'

const singleTrue = new MonkeyBoolean(true)
const singleFalse = new MonkeyBoolean(false)
const singleNull = new MonkeyNull()

const GlobalsSize = 65536
const StackSize = 2048

function nativeBoolToBooleanObject(bool) {
  return bool ? singleTrue : singleFalse
}

function isTruthy(obj) {
  if (obj instanceof MonkeyBoolean) {
    return obj.value
  } else if (obj instanceof MonkeyNull) {
    return false
  }
  return true
}

export class VM {
  constructor(bytecode, globals) {
    this.constants = bytecode.constants
    this.instructions = bytecode.instructions

    this.stack = new Array(StackSize).fill(null)
    this.globals = globals || new Array(GlobalsSize).fill(null)
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

  executeBinaryStringOperation(op, left, right) {
    if (op !== Opcode.OpAdd) {
      return new Error(`unknown string operator: ${op}`)
    }

    const leftValue = left.value
    const rightValue = right.value

    const result = new MonkeyString(leftValue + rightValue)
    return this.push(result)
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
    } else if (
      leftType === MonkeyObjectType.STRING &&
      rightType === MonkeyObjectType.STRING
    ) {
      return this.executeBinaryStringOperation(op, left, right)
    }

    return new Error(
      `unsupported types for binary operation: ${leftType} ${rightType}`
    )
  }

  executeIntegerComparison(op, left, right) {
    const leftValue = left.value
    const rightValue = right.value

    switch (op) {
      case Opcode.OpEqual:
        return this.push(nativeBoolToBooleanObject(rightValue === leftValue))
      case Opcode.OpNotEqual:
        return this.push(nativeBoolToBooleanObject(rightValue !== leftValue))
      case Opcode.OpGreaterThan:
        return this.push(nativeBoolToBooleanObject(leftValue > rightValue))
      default:
        return new Error(`unknown operator: ${op}`)
    }
  }

  executeComparison(op) {
    const right = this.pop()
    const left = this.pop()

    if (
      left.type() === MonkeyObjectType.INTEGER &&
      right.type() === MonkeyObjectType.INTEGER
    ) {
      return this.executeIntegerComparison(op, left, right)
    }

    switch (op) {
      case Opcode.OpEqual:
        return this.push(nativeBoolToBooleanObject(right === left))
      case Opcode.OpNotEqual:
        return this.push(nativeBoolToBooleanObject(right !== left))
      default:
        return new Error(
          `unknown operator: ${op} (${left.type()} ${right.type()})`
        )
    }
  }

  executeBangOperator() {
    const operand = this.pop()

    if (operand === singleTrue) {
      return this.push(singleFalse)
    } else if (operand === singleFalse) {
      return this.push(singleTrue)
    } else if (operand === singleNull) {
      return this.push(singleTrue)
    }
    return this.push(singleFalse)
  }

  executeMinusOperator() {
    const operand = this.pop()

    if (operand.type() !== MonkeyObjectType.INTEGER) {
      return new Error(`unsupported type for negation: ${operand.type()}`)
    }

    const value = operand.value
    return this.push(new MonkeyInteger(-value))
  }

  buildArray(startIndex, endIndex) {
    const elements = this.stack.slice(startIndex, endIndex)
    return new MonkeyArray(elements)
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

        case Opcode.OpTrue:
          this.push(singleTrue)
          break
        case Opcode.OpFalse:
          this.push(singleFalse)
          break

        case Opcode.OpEqual:
        case Opcode.OpNotEqual:
        case Opcode.OpGreaterThan: {
          const err = this.executeComparison(op)
          if (err) {
            return err
          }
          break
        }

        case Opcode.OpBang: {
          const err = this.executeBangOperator()
          if (err) {
            return err
          }
          break
        }

        case Opcode.OpMinus: {
          const err = this.executeMinusOperator()
          if (err) {
            return err
          }
          break
        }

        case Opcode.OpJump: {
          const pos = readUint16(this.instructions.slice(ip + 1))
          ip = pos - 1
          break
        }

        case Opcode.OpJumpNotTruthy: {
          const pos = readUint16(this.instructions.slice(ip + 1))
          ip += 2

          const condition = this.pop()
          if (!isTruthy(condition)) {
            ip = pos - 1
          }
          break
        }

        case Opcode.OpNull:
          this.push(singleNull)
          break

        case Opcode.OpSetGlobal: {
          const globalIndex = readUint16(this.instructions.slice(ip + 1))
          ip += 2
          this.globals[globalIndex] = this.pop()
          break
        }

        case Opcode.OpGetGlobal: {
          const globalIndex = readUint16(this.instructions.slice(ip + 1))
          ip += 2
          const err = this.push(this.globals[globalIndex])
          if (err) {
            return err
          }
          break
        }

        case Opcode.OpArray: {
          const numElements = readUint16(this.instructions.slice(ip + 1))
          ip += 2

          const array = this.buildArray(this.sp - numElements, this.sp)
          this.sp = this.sp - numElements

          const err = this.push(array)
          if (err) {
            return err
          }
          break
        }

        // default:
        //   return new Error(`未知操作码: ${op}`)
      }
    }
    return null
  }
}
