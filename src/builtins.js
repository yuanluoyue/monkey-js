import {
  MonkeyBuiltin,
  MonkeyString,
  MonkeyInteger,
  MonkeyError,
  MonkeyArray,
  MonkeyObjectType,
} from './object.js'

export const builtins = [
  {
    name: 'len',
    builtin: new MonkeyBuiltin((...args) => {
      if (args.length > 1) {
        return new MonkeyError(
          'wrong number of arguments. got=' + args.length + ', want=1'
        )
      }

      if (args[0] instanceof MonkeyString) {
        return new MonkeyInteger(args[0].value.length)
      } else if (args[0] instanceof MonkeyArray) {
        return new MonkeyInteger(args[0].elements.length)
      } else {
        return new MonkeyError(
          'argument to `len` not supported, got ' + args[0].type()
        )
      }
    }),
  },
  {
    name: 'puts',
    builtin: new MonkeyBuiltin((...args) => {
      for (let arg of args) {
        console.log(arg.inspect())
      }
      return null
    }),
  },
  {
    name: 'first',
    builtin: new MonkeyBuiltin((...args) => {
      if (args.length > 1) {
        return new MonkeyError(
          'wrong number of arguments. got=' + args.length + ', want=1'
        )
      }

      if (args[0].type() !== MonkeyObjectType.ARRAY) {
        return new MonkeyError(
          'argument to `first` must be ARRAY, got ' + args[0].type()
        )
      }

      if (args[0].elements.length > 0) {
        return args[0].elements[0]
      }

      return null
    }),
  },
  {
    name: 'last',
    builtin: new MonkeyBuiltin((...args) => {
      if (args.length > 1) {
        return new MonkeyError(
          'wrong number of arguments. got=' + args.length + ', want=1'
        )
      }

      if (args[0].type() !== MonkeyObjectType.ARRAY) {
        return new MonkeyError(
          'argument to `last` must be ARRAY, got ' + args[0].type()
        )
      }

      const len = args[0].elements.length
      if (len > 0) {
        return args[0].elements[len - 1]
      }

      return null
    }),
  },
  {
    name: 'rest',
    builtin: new MonkeyBuiltin((...args) => {
      if (args.length > 1) {
        return new MonkeyError(
          'wrong number of arguments. got=' + args.length + ', want=1'
        )
      }

      if (args[0].type() !== MonkeyObjectType.ARRAY) {
        return new MonkeyError(
          'argument to `rest` must be ARRAY, got ' + args[0].type()
        )
      }

      const len = args[0].elements.length
      if (len > 0) {
        const newElements = []
        for (let i = 1; i < len; i++) {
          newElements.push(args[0].elements[i])
        }
        return new MonkeyArray(newElements)
      }

      return null
    }),
  },
  {
    name: 'push',
    builtin: new MonkeyBuiltin((...args) => {
      if (args.length !== 2) {
        return new MonkeyError(
          'wrong number of arguments. got=' + args.length + ', want=2'
        )
      }

      if (args[0].type() !== MonkeyObjectType.ARRAY) {
        return new MonkeyError(
          'argument to `push` must be ARRAY, got ' + args[0].type()
        )
      }

      const len = args[0].elements.length
      const newElements = []

      for (let i = 0; i < len; i++) {
        newElements.push(args[0].elements[i])
      }

      newElements.push(args[1])

      return new MonkeyArray(newElements)
    }),
  },
]

export function getBuiltinByName(name) {
  for (const def of builtins) {
    if (def.name === name) {
      return def.builtin
    }
  }
  return null
}
