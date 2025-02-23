export class Frame {
  constructor(cl, basePointer) {
    this.cl = cl
    this.ip = -1
    this.basePointer = basePointer
  }

  instructions() {
    return this.cl.fn.instructions
  }
}
