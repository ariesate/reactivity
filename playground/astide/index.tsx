/**@jsx createElement*/
import { default as createElement } from './createElement.js'
import { createElement as createDOMElement } from './DOM.js'
import { reactive, computed, computed2, forEachValue, effect } from '../../dist/reactivity.esm.js'

console.log(11111)

function Para({ children }) {
    return <p>{children}</p>
}

function List({children}) {
    return <ul>
        {children.map((child) => (<li>{child}</li>))}
        </ul>
}

function Text({ node }) {
    return <span>
        {node.content}
    </span>
}


const typeToRenderFnMap = {
    Para,
    List,
    Text
}


function renderChildrenProxy(children, renderFn) {

    function childrenProxy() {
        return children.map(renderFn)
    }

    childrenProxy.map = function( mapFn ) {
        return renderChildrenProxy(children, (node) => mapFn(renderFn(node)))
    }


    childrenProxy.src = children

    return childrenProxy
}

function render(node){
    const renderFn = typeToRenderFnMap[node.type]

    return renderFn({
        node,
        children: node.children && renderChildrenProxy(node.children, render),
    })
}

function digestVnode( vnode ) {
    let element

    if (Array.isArray(vnode)) {
        element = document.createDocumentFragment()
        vnode.forEach(v => element.appendChild(digestVnode(v)))

    } else if ( typeof vnode === 'function') {
        // reactive 会产生新的 vnode 节点，是 patch 出来的。我需要得到这个 patch 来 digest?
        element = buildReactiveChildren(vnode)
    } else {
        // TODO 处理 style 的 comptued?
        element = createDOMElement(vnode.type, vnode.attributes)
        vnode.children.forEach(childVnode => {
            if (typeof childVnode === 'string') {
                // TODO textNode 变化的监听？
                element.appendChild(document.createTextNode(childVnode))
            } else {
                element.appendChild(digestVnode(childVnode))
            }
        })
    }

    return element
}

function buildReactiveChildren(renderChildren) {
    let fragment
    let startNode, endNode

    // 有两种情况？
    // 一种是直接 输出 children，允许增删改
    // 另一种是 有 mapFn 的，新插入的节点要走一下 mapFn
    const reactiveChildren = computed2(() => {
        console.log('compute children')
        // 这是个 fragment
        fragment = digestVnode(renderChildren())
        const parentElement = startNode?.parentElement
        const newStartNode = fragment.children[0]
        const newEndNode = fragment.children[fragment.children.length -1]

        // 有 parentElement，说明不是第一次重新计算了，直接替换
        if (parentElement){
            // TODO
            // startNode.parentElement.replaceChildrenBetween(startNode, endNode, )
            // CAUTION 这个操作会清空 fragment,我们就不能用里面的引用了。
            parentElement.insertBefore(startNode, fragment)
            let isBetween = false
            for(let i = parentElement.children.length-1; i > -1; i--) {
                const child = parentElement.children[i]
                if (child &&(child === endNode || child === startNode)) {
                    isBetween = true
                }
                if (isBetween) {
                    child.remove()
                }
                if (child && (child === startNode)) {
                    break;
                }
            }
        }
        // 如果是第一次计算，不用管，外面会 append fragment 的

        startNode = newStartNode
        endNode = newEndNode

        return { id: Date.now() }
    }, ({ on }) => {
        // patch 函数
        on(renderChildren.src.push, [renderChildren.src], ([pushChild]) => {
            console.log('patch push', pushChild)
            const newEndDOMNode = digestVnode(render(pushChild))
            startNode.parentElement.insertBefore( newEndDOMNode, endNode.nextSibling)
            // 更新 endNode
            endNode = newEndDOMNode
        })
    }, () => {
        scheduleUpdate(reactiveChildren)
    })


    return fragment
}


function scheduleUpdate(computed) {
    console.log('collect dirty')
    requestIdleCallback(() => {
        console.log(`updated ${computed.id}`)
    })
}


function addEventListener() {

}


const data = reactive({ type: 'Para', children: [{type: 'Text', content: 'p1'}, {type: 'Text', content: 'p2'}]})
const doc = digestVnode(render(data))

// TODO 在这里设计理想的写代码的方式。还要考虑能跳过的 computed 计算的问题

//



addEventListener(doc, 'paste', () => {
    // 单独 parse paste 的内容？处理好了再手动触发其他事件？
})


addEventListener(doc, 'deleteCharacter', () => {
    // 单个字符删除，可以加速？
})

addEventListener(doc, 'insertCharacter', () => {
    // 单个字符插入
})

addEventListener(doc, 'insertCharacters', () => {
    // 肯定是 paste 产生的，因为
})


addEventListener(doc, 'deleteRange', () => {
    // 可能要做复杂的结构变化
})


// addEventListener(doc, 'updateRange', () => {
    // range 更新。只有可能是 paste 产生的，
    // 因为 composition 产生的会直接拆成 deleteRange + insertCharacter。
    // 为什么要拆？因为 componsition 在输入的时候就会对 dom 操作了，我们必须赶在操作之前调用 deleteRange
    // 处理里面可能要做复杂的结构变化。

    // 而 paste updateRange 是一次性的
// })

document.getElementById('root').append(doc)


// const ccc = computed(() => {
//     return data.children.map(c => c.type)
// }, {
//     onTrigger:() => {
//         debugger
//     }
// })
// console.log(ccc.value[1])

setTimeout(() => {
    data.children.push({type:'Text', content:'p3'})
    // debugger
    // console.log(ccc.value[2])
}, 100)


