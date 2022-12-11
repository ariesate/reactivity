
import {trackCause, clearCause, stopTrackCause, getCause} from "./effect";
import {clearCauses, collectCause, getCauses} from "./computed2";


export type Cause = [Function, unknown[], unknown]


// n级索引，一级是 method，二级是 comptued 对应的 this/参数, 三级是 computed, 四级是面的所有 patchFn
const patchFnsByMethod = new WeakMap()

export function patchable(fn: (...argv: unknown[]) => any, indexNos?: any) {
    const patchedFn = function(this: unknown[], ...args: unknown[]) {
        let relatedComputeds
        if (!indexNos) {
            relatedComputeds = patchFnsByMethod.get(patchedFn)?.get(this)?.keys()
        } else {
            const indexes = indexNos.map((i: any) => args[i])
            relatedComputeds = getFromWeakMapTree(patchFnsByMethod, ([patchedFn]).concat(indexes))?.keys()
        }

        // 忽略在执行期间，数据变化对当前 computed 产生的 trigger。直接 set dirty. 并告知 引起变化的 Causes。
        const cause: Cause = [patchedFn, args, indexNos || this]

        if (relatedComputeds) {
            for(let computed of relatedComputeds) {
                console.log('collect cause', computed, cause)
                collectCause(computed, cause)
            }
        } else {
            // debugger
        }

        // 这个 trackCause 是因为 函数执行的时候还是会正常引起 effect 变换。effect 可以根据有没有这个值来判断是不是全部都能走 patch fn。
        trackCause(cause)
        // 为什么不在这里再去通知 computed? 因为 fn.apply 里面可能会触发能多次通知，但其实都是因为这同一次操作引起的。
        fn.apply(this, args)
        stopTrackCause()
    }

    patchedFn.indexNos = indexNos
    patchedFn.origin = fn

    return patchedFn
}


// TODO 对 set 的监听？？？

export function registerPatchFns(thisComputed: any, createComputedPatchFns: Function) {

    function on(method: Function, indexes, patchFn: Function) {

        const computedToPatchFn = getFromWeakMapTree(patchFnsByMethod, ([method]).concat(indexes), () =>  new Map())
        computedToPatchFn.set(thisComputed, patchFn)
    }

    // 什么也不做，执行一下 fn 就是为了读一下相应的 key，来增加 dep 的。
    function track(fn) {
        fn()
    }

    // TODO !!!
    function untrack(dep, key) {

    }

    // 注册一下所有的 patchFn
    createComputedPatchFns({ on, track, untrack })

    return function applyPatch(lastResult: any) {
        getCauses(thisComputed)?.forEach(([method, argv, target]) => {
            // 方法没有指定 indexNos，说明这是某个对象的方法，直接用对象做索引的，这是和上面的约定。
            const indexes = method.indexNos?.map((no: any) => argv[no]) || [target]
            const callback = getFromWeakMapTree(patchFnsByMethod, ([method]).concat(indexes))?.get(thisComputed)
            callback(argv, lastResult)
        })

        // 消耗掉 causes
        clearCauses(thisComputed)
    }
}


function getFromWeakMapTree(root: WeakMap<any, any>, indexes: any[], createDefault?: any) {
    let base = root
    indexes.every((argIndex: any, num) => {
        let next = base.get(argIndex)
        if (!next && createDefault) {
            next = (num === indexes.length - 1) ? createDefault() : new WeakMap()
            base.set(argIndex, next)
        }
        base = next
        return !!base
    })
    return base
}
