import {
  Program,
  ExpressionStatement,
  InfixExpression,
  IntegerLiteral,
  BooleanLiteral,
} from '../src/ast.js'
import { MonkeyInteger, MonkeyBoolean } from '../src/object.js'
import { make, Opcode, Instructions } from './code.js'

class Bytecode {
  constructor(instructions, constants) {
    // 初始化指令和常量属性
    this.instructions = instructions
    this.constants = constants
  }
}

export class Compiler {
  constructor() {
    // 初始化指令和常量数组
    this.instructions = new Instructions()
    this.constants = []
  }

  compile(node) {
    if (node instanceof Program) {
      for (let s of node.statements) {
        const err = this.compile(s)
        if (err) {
          return err
        }
      }
    } else if (node instanceof ExpressionStatement) {
      const err = this.compile(node.expression)
      if (err) {
        return err
      }
      this.emit(Opcode.OpPop)
    } else if (node instanceof InfixExpression) {
      // 如果操作符是小于号，就先编译右值再编译左值
      if (node.operator === '<') {
        const errRight = this.compile(node.right)
        if (errRight) {
          return errRight
        }
        const errLeft = this.compile(node.left)
        if (errLeft) {
          return errLeft
        }
        this.emit(Opcode.OpGreaterThan)
        return
      }

      const errLeft = this.compile(node.left)
      if (errLeft) {
        return errLeft
      }
      const errRight = this.compile(node.right)
      if (errRight) {
        return errRight
      }
      switch (node.operator) {
        case '+':
          this.emit(Opcode.OpAdd)
          break
        case '-':
          this.emit(Opcode.OpSub)
          break
        case '*':
          this.emit(Opcode.OpMul)
          break
        case '/':
          this.emit(Opcode.OpDiv)
          break
        case '>':
          this.emit(Opcode.OpGreaterThan)
          break
        case '==':
          this.emit(Opcode.OpEqual)
          break
        case '!=':
          this.emit(Opcode.OpNotEqual)
          break
        default:
          return new Error(`unknown operator ${node.operator}`)
      }
    } else if (node instanceof IntegerLiteral) {
      // 处理整数字面量
      const integer = new MonkeyInteger(node.value)
      const constantIndex = this.addConstant(integer)
      this.emit(Opcode.OpConstant, constantIndex)
    } else if (node instanceof BooleanLiteral) {
      if (node.value) {
        this.emit(Opcode.OpTrue)
      } else {
        this.emit(Opcode.OpFalse)
      }
    }
    return null
  }

  // addConstant 方法用于向 constants 数组中添加常量对象，并返回其索引
  addConstant(obj) {
    this.constants.push(obj)
    return this.constants.length - 1
  }

  // emit 方法用于根据操作码和操作数生成指令，并添加到指令列表中
  emit(op, ...operands) {
    const ins = make(op, ...operands)
    const pos = this.addInstruction(ins)
    return pos
  }

  // addInstruction 方法用于将指令添加到指令列表中，并返回新指令的位置
  addInstruction(ins) {
    const posNewInstruction = this.instructions.length
    this.instructions.push(...ins)
    return posNewInstruction
  }

  bytecode() {
    return new Bytecode(this.instructions, this.constants)
  }
}
