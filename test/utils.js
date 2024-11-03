export const checkParserErrors = (parser) => {
  const errors = parser.getErrors()
  if (errors.length === 0) {
    return
  }

  errors.forEach((msg) => console.error(`parser error: ${msg}`))
  throw new Error(`parser has ${errors.length} errors`)
}
