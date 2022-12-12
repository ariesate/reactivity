import Parser from "./Parser";
import codeText from './test.js?raw'
import {Generator} from "./codegenDOM";
import './Editor.less'

const parser = new Parser()


const ast = parser.parse(codeText)
const generator = new Generator()
const output = generator.generate(ast)

console.log(output)

document.getElementById('root').appendChild(output)