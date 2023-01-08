import { ReactiveEffect} from './effect'
import {reactive } from './reactive'
import {registerPatchFns, Cause, addAfterPatchPointerCallback, inAfterPatchPointerFrame} from "./patch";


export function replace(source: any, nextSourceValue: any) {
  if (Array.isArray(source)){
    source.splice(0, source.length, ...nextSourceValue)
  } else {
    const nextKeys = Object.keys(nextSourceValue)
    const keysToDelete = Object.keys(source).filter(k => !nextKeys.includes(k))
    keysToDelete.forEach(k => delete source[k])
    Object.assign(source, nextSourceValue)
  }
}


export const computedToEffect = new WeakMap<any, ReactiveEffect>()

export function destroyComputed(c: any) {
  computedToEffect.get(c)!.stop()
}



export type RegisterPatchFnType = ({ on, addTrack, untrack } : {on: Function, addTrack: Function, untrack: Function}) => any

type CallbacksType = {
  onRecompute? : Function,
  onPatch? : Function
}
// 好像要穿件深度 proxy 把对后续节点的读取全都代理到这个跟对像的读才能区博爱这个 computed 的任意节点别订阅都会触发
// recomputed? 不然一旦把后面的节点单独传出去，再去读的时候就不会触发 recompute 了？

// 是否要深度传递叶子节点？
export function patchableComputed(getter: () => Object, registerPatchFn?: RegisterPatchFnType, dirtyCallback?: any, callbacks? : CallbacksType) {
  // 要自动推断类型？
  // effect 就是为 getter 注册一个 schedule 函数。
  // 1. 如果不在创建的时候就执行，就没办法做到自动推断类型。返回的 proxy 的 target 就会有问题。
  let isDirty = false
  let isPatchable = !!registerPatchFn
  let applyPatch: Function|undefined
  let reactiveData: Object


  function effectRun() {
    if (!reactiveData) {
      reactiveData = reactive(getter())
    } else if (registerPatchFn && isPatchable) {
      // CAUTION 会清空 triggerCause
      // console.log('run patch')
      applyPatch!(reactiveData)
      callbacks?.onPatch && callbacks?.onPatch(reactiveData)
    } else {
      // TODO check dep?
      replace(reactiveData, getter())
      callbacks?.onRecompute && callbacks?.onRecompute(reactiveData)
    }
    isPatchable = true
  }

  const thisEffect = new ReactiveEffect(effectRun, (cause, debugInfo) => {
    isDirty = true
    // console.log("effect trigger", cause)
    // 只记录写了 patch 但是没走 patch 的。
    if(registerPatchFn) {
      // patchable 方法必然有 cause，如果由不是 patch 监听的方法触发的变化，就说明当前的变化不能 patch。
      // console.log('dirty, prev isPatchable:', isPatchable, cause)
      // if (!cause) debugger
      // 在触发之前，所有 patchPoint 都会先通知一下相关的 computed 开始收集了。
      // 如果当前 cause 不是自己注册了 patchPoint 的，那么就不能走 patch 了。
      isPatchable = isPatchable && (!!cause) && (getCauses(thisComputed)?.at(-1) === cause)
      if (!isPatchable) {
        // debugger
        console.warn('cant patch:', { thisComputed, cause }, getCauses(thisComputed)?.at(-1), getCauses(thisComputed)?.at(-1) === cause)
      }
    }

    // CAUTION 这里要限制一下，如果要用，addAfterPatchPointerCallback 只能马上使用。不然注册的 callback frame 就不正确了。
    let isImmediateUpdateExpired = false
    if (dirtyCallback) {
      dirtyCallback(function immediateUpdate() {
        if (isImmediateUpdateExpired) throw new Error('immediateUpdate expired')
        if (inAfterPatchPointerFrame()) {
          addAfterPatchPointerCallback(recompute)
        } else {
          Promise.resolve().then(recompute)
        }
      })
    }

    isImmediateUpdateExpired = true
  })

  // 立刻 run，建立 reactiveData 和 effect
  thisEffect.run()

  const recompute = () => {
    if (isDirty) {
      // CAUTION 必须在 run 之前判断自己能不能开启 patchMode 啊，因为此时
      if(isPatchable) {
        thisEffect.patchMode = true
      }
      thisEffect.run()
      thisEffect.patchMode = false
      isDirty = false
    }
  }

  const thisComputed = new Proxy(reactiveData!, {
    get(target, key, receiver) {
      // 获取任何值得时候 check dirty
      recompute()
      // @ts-ignore
      return target[key]
    }
  })

  computedToEffect.set(thisComputed, thisEffect)

  // 如果有 patchFn，要执行注册一下针对每个变化的操作。
  applyPatch = registerPatchFn ? registerPatchFns(thisComputed, registerPatchFn) : undefined
  return thisComputed
}


const patchCauses = new WeakMap()
export function collectCause(computed: any, cause: Cause) {
  let causes
  if (!(causes = patchCauses.get(computed))) {
    patchCauses.set(computed, (causes = []))
  }
  causes.push(cause)
}

export function getCauses(computed: any) {
  return patchCauses.get(computed)
}

export function clearCauses(computed: any) {

  const causes = patchCauses.get(computed)
  if (causes) {
    causes.length = 0
  }
}

let uuid = 0

export function autorun(run: Function, registerPatchFn: RegisterPatchFnType, schedule: Function) {
  // @ts-ignore
  const result: {name: string, token: any, timestamp: any} = patchableComputed(() => {
    return {
      name: run.name,
      token: run(),
      timestamp: ++uuid
    }
  }, registerPatchFn, (immediateUpdate: Function) => {
    schedule && schedule(immediateUpdate)
  })

  return function stop() {
    destroyComputed(result)
  }
}


