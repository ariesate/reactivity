import {findNodeFromElement} from "./editing";
import {reactive, shallowRef, ref} from "../../dist/reactivity.esm.js";

const readerAuth = new AuthTable([])
const authDeadline = new Date()

var doc = ''

function matchChar(str, offset, toMatch, endOffset = toMatch.length - 1) {
    if (!toMatch) return []

    const len = toMatch.length
    let startOffset = offset
    const skippedChars = []

    while(startOffset > endOffset) {
        let i = 0
        while(i < len) {
            if (str[startOffset-1-i] !== toMatch[len-1-i]) {
                break;
            }
            i++
        }

        // 说明是完整匹配了
        if (i === len) {
            return skippedChars
        } else {
            skippedChars.unshift(str[startOffset-1])
            startOffset--
        }
    }

    return false
}


class CharReader {
    constructor(node, offset) {
        this.node = node
        this.offset = offset
    }
    match([startChars, endChars = '']) {
        let offset = this.offset
        if (!matchChar(this.node.value.value, offset, endChars, offset-1)) return false

        const matchStartCharsOffset = matchChar(this.node.value.value, offset-endChars.length, startChars)

        return matchStartCharsOffset && matchStartCharsOffset.join('')
    }
}
