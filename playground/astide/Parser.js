import {parse} from "@babel/parser"

const options = {
  // parse in strict mode and allow module declarations
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true, // todo
  allowSuperOutsideMethod: true, // todo
  allowImportExportEverywhere: true, // todo
  sourceType: "module",
  plugins: ['jsx','classProperties']
}

export default class Parser {
  parse(code) {
    return parse(code, options)
  }
  parseStatement(code) {
    return this.parse(code).program.body[0]
  }
}
