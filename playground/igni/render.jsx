/**@jsx createElement*/
import {createElement} from "./DOM";
import {buildReactiveView, createReactiveAttribute} from "./buildReactiveView";

import patchTextEvents from "./patchTextEvents";
import {LinkedList} from "./linkedList";
import { registerCommands as markdownCommands } from "./markdown";
import { registerCommands as suggestionCommands } from "./suggestion";
import { registerCommands } from "./command";
import { on, trigger } from './event'
import {nodeTypes} from "./nodeTypes";
import {replaceNode} from "./editing";



export function buildModelFromData(data, parent) {
    const Type =  nodeTypes[data.type]
    const result = new Type(data, parent)
    let firstLeaf, lastLeaf

    if (Type.isLeaf) {
        firstLeaf = lastLeaf = result
    } else {
        // 添加 content
        data.content?.forEach((contentItem) => {
            const { result: contentItemResult, firstLeaf: firstContentItemLeaf} = buildModelFromData(contentItem, result)
            // debugger
            result.content.insertBefore(contentItemResult)
            if (!firstLeaf) firstLeaf = firstContentItemLeaf
        })

        // 添加 children
        data.children?.forEach((child) => {
            const {result: childResult, lastLeaf: lastChildLeaf} = buildModelFromData(child, result)

            result.children.insertBefore(childResult)
            if(lastChildLeaf) {
                lastLeaf = lastChildLeaf
            }
        })

        // 好像不把自己的 content 和 children 连接上也没关系，往上面找就行了。
    }

    return {
        firstLeaf,
        result,
        lastLeaf
    }
}







const { result: doc, firstLeaf, lastLeaf } = buildModelFromData({
    type: 'Doc',
    content: [{ type: 'Text', value: 'test title'} ],
    children: [{
        type: 'Para',
        content: [
            {type: 'Text', value: 'p123'},
            {type: 'Text', value: 'p456'},
            {type: 'Text', value: 'p789'}
        ]
    }, {
        type: 'Section',
        content: [{ type: 'Text', value: 'section 1'} ],
        children: [{
            type: 'Para',
            content: [
                {type: 'Text', value: 's1p12345'},
                {type: 'Text', value: 's1p12345'},
                {type: 'Text', value: 's1p12345'}
            ]
        }]
    }, {
        type: 'Section',
        content: [{ type: 'Text', value: 'section 2'} ],
        children: [{
            type: 'Para',
            content: [
                {type: 'Text', value: 's2p12345', props: { formats: { bold: true }}},
                {type: 'Text', value: 's2p12345'},
                {type: 'Text', value: 's2p12345'}
            ]
        }]
    }, {
        type: 'Section',
        content: [{ type: 'Text', value: 'section 3'} ],
        children: [{
            type: 'Table',
            value: 'test'
        }, {
            type: 'Para',
            content: [
                {type: 'Text', value: '#jsp123'},
                {type: 'Text', value: 'p456'},
                {type: 'Text', value: 'p789'}
            ]
        }]
    }]
})

doc.firstLeaf = firstLeaf
doc.lastLeaf = lastLeaf
const docElement = buildReactiveView(doc)
document.getElementById('root').appendChild(docElement)

// CAUTION 这个事件顺序挺重要的，command 需要发生在默认输入行为之前。
registerCommands(markdownCommands(), on)
registerCommands(suggestionCommands(), on)

patchTextEvents(on, trigger)



// setTimeout(() => {
//     debugger
//     doc.content.head.next.node.value.value = 'updated'
// }, 100)

window.doc = doc

// replaceNode({
//     type: 'Para',
//     content: [
//         {type: 'Text', value: 'newPara'},
//     ]
// }, doc.children.tail.node)
// doc.children.remove(doc.children.tail.node)
