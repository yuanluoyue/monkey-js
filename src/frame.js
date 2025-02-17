export class Frame {
  constructor(fn, basePointer) {
    this.fn = fn
    this.ip = -1
    this.basePointer = basePointer
  }

  instructions() {
    return this.fn.instructions
  }
}
