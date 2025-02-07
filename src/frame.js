export class Frame {
  constructor(fn) {
    this.fn = fn
    this.ip = -1
  }

  instructions() {
    return this.fn.instructions
  }
}
