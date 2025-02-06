import {
  Program,
  ExpressionStatement,
  InfixExpression,
  IntegerLiteral,
  BooleanLiteral,
  PrefixExpression,
  IfExpression,
  BlockStatement,
  LetStatement,
  Identifier,
  StringLiteral,
  ArrayLiteral,
  HashLiteral,
  IndexExpression,
  FunctionLiteral,
  ReturnStatement,
} from '../src/ast.js'
import { MonkeyInteger, MonkeyString, CompiledFunction } from '../src/object.js'
import { make, Opcode, Instructions } from './code.js'
import { SymbolTable } from './symbolTable.js'

class Bytecode {
  constructor(instructions, constants) {
    // 初始化指令和常量属性
    this.instructions = instructions
    this.constants = constants
  }
}

class EmittedInstruction {
  constructor(opcode = null, position = null) {
    this.opcode = opcode
    this.position = position
  }
}

class CompilationScope {
  constructor() {
    this.instructions = new Instructions()
    this.lastInstruction = new EmittedInstruction()
    this.previousInstruction = new EmittedInstruction()
  }
}

export class Compiler {
  constructor(constants, symbolTable) {
    // this.instructions = new Instructions()
    this.constants = constants || []

    // this.lastInstruction = new EmittedInstruction()
    // this.previousInstruction = new EmittedInstruction()

    this.symbolTable = symbolTable || new SymbolTable()

    const mainScope = new CompilationScope()
    this.scopes = [mainScope]
    this.scopeIndex = 0
  }

  currentInstructions() {
    return this.scopes[this.scopeIndex].instructions
  }

  enterScope() {
    const scope = new CompilationScope()
    this.scopes.push(scope)
    this.scopeIndex++
  }

  leaveScope() {
    const instructions = this.currentInstructions()
    this.scopes = this.scopes.slice(0, this.scopes.length - 1)
    this.scopeIndex--
    return instructions
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
    } else if (node instanceof PrefixExpression) {
      const err = this.compile(node.right)
      if (err) {
        return err
      }

      switch (node.operator) {
        case '!':
          this.emit(Opcode.OpBang)
          break
        case '-':
          this.emit(Opcode.OpMinus)
          break
        default:
          return new Error(`unknown operator ${node.operator}`)
      }
      return null
    } else if (node instanceof IfExpression) {
      const err = this.compile(node.condition)
      if (err) {
        return err
      }
      const jumpNotTruthyPos = this.emit(Opcode.OpJumpNotTruthy, 9999)

      const err2 = this.compile(node.consequence)
      if (err2) {
        return err2
      }

      if (this.lastInstructionIs(Opcode.OpPop)) {
        this.removeLastPop()
      }

      const jumpPos = this.emit(Opcode.OpJump, 9999)

      const afterConsequencePos = this.currentInstructions().length
      this.changeOperand(jumpNotTruthyPos, afterConsequencePos)

      if (!node.alternative) {
        this.emit(Opcode.OpNull)
      } else {
        const err3 = this.compile(node.alternative)
        if (err3) {
          return err3
        }

        if (this.lastInstructionIs(Opcode.OpPop)) {
          this.removeLastPop()
        }
      }

      const afterAlternativePos = this.currentInstructions().length
      this.changeOperand(jumpPos, afterAlternativePos)
    } else if (node instanceof BlockStatement) {
      for (let s of node.statements) {
        const err = this.compile(s)
        if (err) {
          return err
        }
      }
    } else if (node instanceof LetStatement) {
      const err = this.compile(node.value)
      if (err) {
        return err
      }

      const symbol = this.symbolTable.define(node.name.value)

      this.emit(Opcode.OpSetGlobal, symbol.index)
    } else if (node instanceof Identifier) {
      const symbol = this.symbolTable.resolve(node.value)

      if (!symbol) {
        console.error(`undefined variable ${node.value}`)
      }

      this.emit(Opcode.OpGetGlobal, symbol.index)
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
    } else if (node instanceof StringLiteral) {
      const str = new MonkeyString(node.value)
      const constantIndex = this.addConstant(str)
      this.emit(Opcode.OpConstant, constantIndex)
    } else if (node instanceof ArrayLiteral) {
      for (let el of node.elements) {
        const err = this.compile(el)
        if (err) {
          return err
        }
      }
      this.emit(Opcode.OpArray, node.elements.length)
    } else if (node instanceof HashLiteral) {
      const keys = []

      node.pairs.forEach((v, k) => {
        keys.push(k)
      })

      keys.sort((i, j) => {
        return i.value < j.value ? -1 : 1
      })

      for (const k of keys) {
        const err = this.compile(k)
        if (err) {
          return err
        }
        const value = node.pairs.get(k)
        const valueErr = this.compile(value)
        if (valueErr) {
          return valueErr
        }
      }

      this.emit(Opcode.OpHash, keys.length * 2)
    } else if (node instanceof IndexExpression) {
      const leftErr = this.compile(node.left)
      if (leftErr) {
        return leftErr
      }

      const indexErr = this.compile(node.index)
      if (indexErr) {
        return indexErr
      }

      this.emit(Opcode.OpIndex)
    } else if (node instanceof FunctionLiteral) {
      this.enterScope()
      const err = this.compile(node.body)
      if (err) {
        return err
      }

      if (this.lastInstructionIs(Opcode.OpPop)) {
        this.replaceLastPopWithReturn()
      }

      if (!this.lastInstructionIs(Opcode.OpReturnValue)) {
        this.emit(Opcode.OpReturn)
      }

      const instructions = this.leaveScope()
      const compiledFn = new CompiledFunction(instructions)
      const constantIndex = this.addConstant(compiledFn)

      this.emit(Opcode.OpConstant, constantIndex)
    } else if (node instanceof ReturnStatement) {
      const err = this.compile(node.returnValue)
      if (err) {
        return err
      }
      this.emit(Opcode.OpReturnValue)
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
    this.setLastInstruction(op, pos)
    return pos
  }

  replaceInstruction(pos, newInstruction) {
    const ins = this.currentInstructions()
    for (let i = 0; i < newInstruction.length; i++) {
      ins[pos + i] = newInstruction[i]
    }
  }

  replaceLastPopWithReturn() {
    const lastPos = this.scopes[this.scopeIndex].lastInstruction.position
    const newInstruction = make(Opcode.OpReturnValue)
    this.replaceInstruction(lastPos, newInstruction)

    this.scopes[this.scopeIndex].lastInstruction.opcode = Opcode.OpReturnValue
  }

  setLastInstruction(op, pos) {
    const previous = this.scopes[this.scopeIndex].lastInstruction
    const last = new EmittedInstruction(op, pos)

    this.scopes[this.scopeIndex].previousInstruction = previous
    this.scopes[this.scopeIndex].lastInstruction = last
  }

  changeOperand(opPos, operand) {
    const op = this.currentInstructions()[opPos]
    const newInstruction = make(op, operand)

    this.replaceInstruction(opPos, newInstruction)
  }

  lastInstructionIs(op) {
    if (this.currentInstructions().length === 0) {
      return false
    }

    return this.scopes[this.scopeIndex].lastInstruction.opcode === op
  }

  removeLastPop() {
    const last = this.scopes[this.scopeIndex].lastInstruction
    const previous = this.scopes[this.scopeIndex].previousInstruction

    const old = this.currentInstructions()
    const newIns = old.slice(0, last.position)
    this.scopes[this.scopeIndex].instructions = newIns
    this.scopes[this.scopeIndex].lastInstruction = previous
  }

  // addInstruction 方法用于将指令添加到指令列表中，并返回新指令的位置
  addInstruction(ins) {
    const currentIns = this.currentInstructions()
    const posNewInstruction = currentIns.length
    const updatedInstructions = new Instructions(...currentIns, ...ins)
    this.scopes[this.scopeIndex].instructions = updatedInstructions
    return posNewInstruction
  }

  bytecode() {
    return new Bytecode(this.currentInstructions(), this.constants)
  }
}
