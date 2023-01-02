
import {trackCause, stopTrackCause, createTrackFrame} from "./effect";
import {autorun, clearCauses, collectCause, computed2, computedToEffect, destroyComputed, getCauses} from "./computed2";
import { Dep } from "./dep";


export type Cause = [Function, unknown[], unknown]


// n级索引，一级是 method，二级是 comptued 对应的 this/参数, 三级是 computed, 四级是面的所有 patchFn
const patchFnsByMethod = new WeakMap()

let pausePatchPoint = false
export function disablePatch(fn: Function) {
    pausePatchPoint = true
    fn()
    pausePatchPoint = false
}

// CAUTION 一定要实现，不然可能有内存泄漏
// TODO 如果有个一个 computed，一直不读，那么cause 里存的 args 等信息就会一直堆积，产生类似于内存泄漏的问题。
export function patchPoint(fn: Function, indexNos?: any) {
    const patchedFn = function(this: unknown[], ...args: unknown[]) {
        if (pausePatchPoint) return fn()

        let relatedComputeds
        if (!indexNos) {
            relatedComputeds = patchFnsByMethod.get(patchedFn)?.get(this)?.keys()
        } else {
            const indexes = indexNos.map((i: any) => args[i])
            relatedComputeds = getFromWeakMapTree(patchFnsByMethod, ([patchedFn]).concat(indexes))?.keys()
        }

        // 忽略在执行期间，数据变化对当前 computed 产生的 trigger。直接 set dirty. 并告知 引起变化的 Causes。
        const cause: Cause = [patchedFn, args, this]

        if (relatedComputeds) {
            for(let computed of relatedComputeds) {
                // console.log('collect cause', computed, cause)
                collectCause(computed, cause)
            }
        } else {
            // debugger
        }
        // 这个 trackCause 是因为 函数执行的时候还是会正常引起 effect 变换。effect 可以根据有没有这个值来判断是不是全部都能走 patch fn。
        trackCause(cause)
        // 为什么不在这里再去通知 computed? 因为 fn.apply 里面可能会触发能多次通知，但其实都是因为这同一次操作引起的。
        const patchPointResult = fn.apply(this, args)
        // if (patchPointResult.added && !patchPteraointResult.added?.from.next) debugger
        // 这里记录下是因为在处理 iterate 对象时可能需要根据 return 值来判断到底哪些节点丢掉了不需要要track，哪些是新增的。
        cause.push(patchPointResult)
        stopTrackCause()

        return patchPointResult
    }

    patchedFn.indexNos = indexNos
    patchedFn.origin = fn

    return patchedFn
}


// TODO 对 set 的监听？？？
export function registerPatchFns(thisComputed: any, registerPatchFnsOnComputed: Function) {
    const effect = computedToEffect.get(thisComputed)
    // 注册要监听的 patchPoint
    function on(patchPoint: Function, indexes, patchFn: Function) {
        const computedToPatchFn = getFromWeakMapTree(patchFnsByMethod, ([patchPoint]).concat(indexes), () =>  new Map())
        computedToPatchFn.set(thisComputed, patchFn)
    }

    // 把 fn 执行中的所有 dep 都增量收集到当前的 this.Computed 上
    function addTrack(fn: Function) {
        console.log(999)
        // 此时肯定已经是在当前 computed 重新 run 的过程中了，直接执行函数收集就行
        if(!effect.patchMode) throw new Error('not in patch mode')
        fn()
    }

    function untrack(deps: Dep[]) {
        console.log(222, deps)
        effect.untrack(deps)
    }

    // 注册一下所有的 patchFn
    registerPatchFnsOnComputed({ on, addTrack, untrack })

    // 当重新计算 thisComputed 的时候，thisComputed 会根据当前能不能走 patch 来决定是否调用 applyPatch。
    return function applyPatch(lastResult: any) {
        getCauses(thisComputed)?.forEach(([patchPoint, argv, target, patchPointResult]) => {
            // 方法没有指定 indexNos，说明这是某个对象的方法，直接用对象做索引的，这是和上面的约定。
            const indexes = patchPoint.indexNos?.map((no: any) => argv[no]) || [target]
            const callback = getFromWeakMapTree(patchFnsByMethod, ([patchPoint]).concat(indexes))?.get(thisComputed)
            callback(argv, lastResult, patchPointResult)
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


type CollectionType = {
    iterator: (from: any, to: any) => { next: () => { value: any, done : boolean} }
}

/**
 * 针对 collection 的 forEach 和 map computed 的 patch utils。
 * 自动进行了新增节点和删除节点的 track/untrack
 *
 * 如果是自定义对象，要求对象必须实现 iterate(start, end) 方法。用来实现新增 track。
 * 要求所有 mutate 方法必须告诉框架新插入的节点是？删除的节点是？这样才能做到 track/untrack。
 */
function iterateWithTrackInfo(collection: CollectionType, fromTo = [], handle: Function, trackInfoCallback: Function) {
    const trackFrame = createTrackFrame()

    const { next } = collection.iterator(fromTo[0], fromTo[1])
    let iterateDone = false
    while(!iterateDone) {
        trackFrame.start()
        let { value: item, done} = next()
        // 可能一上来就是 done，这时 value 是 undefined
        if(item !== undefined) {
            handle(item)
            trackInfoCallback(item, trackFrame.end())
        } else {
            trackFrame.end()
        }
        iterateDone = done
    }
}


type PatchPointResult = {
    added? : {
        from? : Object,
        to? : Object,
    },
    removed? : {
        from? : Object,
        to? : Object,
    }
}

// TODO 改成自动根据 collection class method 来 patch
let uuid = 0
export function autorunForEach(collection: CollectionType, patchPoints = [], handle: Function, handleRemoved: Function, schedule: Function, callbacks = {}) {
    const itemToTrackDeps = new WeakMap()
    const trackInfoCallback = (item: Object, deps: Dep[]) => itemToTrackDeps.set(item, deps)

    const updateThis = () => result.timestamp

    const result = computed2(function createAutoForEach() {
        iterateWithTrackInfo(collection, undefined, handle, trackInfoCallback)
        return {
            collection,
            timestamp: ++uuid
        }
    }, ({ on, addTrack, untrack }) => {
        // 自动找就行了
        patchPoints.forEach(patchPoint => {
            on(patchPoint, [collection], (argv: any[], lastResult: any, patchPointResult: PatchPointResult) => {
                // 自动 track/untrack。这里要求这个 patchPoint 执行完 mutate 之后必须告诉外部新增和删除的节点？
                // 任何 patchPointMutate 方法必须返回 { added: {from: to}, removed: {from, to}}
                if (patchPointResult.added) {
                    addTrack(() => iterateWithTrackInfo(collection, [patchPointResult.added.from, patchPointResult.added.to], handle, trackInfoCallback))
                }

                if (patchPointResult.removed) {
                    // 注意这里，因为 iterator 是从第一个参数的 next 读起的，不会读第一个参数，所以要这样处理。
                    const removeStart = { next: patchPointResult.removed.from }
                    collection.constructor.iterate(removeStart, patchPointResult.removed.to, (item: any) => {
                        handleRemoved(item)
                        if (!itemToTrackDeps.get(item)) debugger
                        untrack(itemToTrackDeps.get(item))
                    })
                }
            })
        })
    }, () => {
        schedule && schedule(updateThis)
    }, callbacks)

    return function stop() {
        destroyComputed(result)
    }
}

export function collectionPatchPoint(method: Function, indexNos) {
    const result = patchPoint(method, indexNos)
    // @ts-ignore
    result.isCollectionPatchPoint = true
    return result
}


// TODO mapComputed 针对数组、对象等，也是自动 patch
export function mapComputed(collection) {

}




