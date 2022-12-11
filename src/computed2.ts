import {clearCause, DebuggerOptions, ITERATE_KEY, pauseTracking, ReactiveEffect, resetTracking, track} from './effect'
import { Ref, trackRefValue, triggerRefValue } from './ref'
import { isFunction, NOOP } from '@vue/shared'
import {ReactiveFlags, toRaw, reactive, toReactive} from './reactive'
import { Dep } from './dep'
import {TrackOpTypes} from "./operations";
import {registerPatchFns, Cause} from "./patch";


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


const computedToEffect = new WeakMap()

function destroyComputed(c) {
  computedToEffect.get(c).stop()
}



// 好像要穿件深度 proxy 把对后续节点的读取全都代理到这个跟对像的读才能区博爱这个 computed 的任意节点别订阅都会触发
// recomputed? 不然一旦把后面的节点单独传出去，再去读的时候就不会触发 recompute 了？

// 是否要深度传递叶子节点？
export function computed2(getter: any, patchFn?: (...args: unknown[]) => any, dirtyCallback?: any) {
  // 要自动推断类型？
  // effect 就是为 getter 注册一个 schedule 函数。
  // 1. 如果不在创建的时候就执行，就没办法做到自动推断类型。返回的 proxy 的 target 就会有问题。
  let isDirty = false
  let isPatchable = true
  let applyPatch
  let reactiveData


  function effectRun() {
    if (!reactiveData) {
      reactiveData = reactive(getter())
    } else if (patchFn && isPatchable) {
      // CAUTION 会清空 triggerCause
      console.log('run patch')
      applyPatch(reactiveData)
    } else {
      // TODO check dep?
      replace(reactiveData, getter())
    }
    isPatchable = true
  }

  const effect = new ReactiveEffect(effectRun, (cause, debugInfo) => {
    isDirty = true
    console.log("effect trigger", cause)
    // 只记录写了 patch 但是没走 patch 的。
    if(patchFn) {
      // patchable 方法必然有 cause，如果由不是 patch 监听的方法触发的变化，就说明当前的变化不能 patch。
      console.log('dirty, prev isPatchable:', isPatchable, cause)
      if (!cause) debugger
      // 收集到 cause 和自己注册的不匹配，也不能 patch
      isPatchable = isPatchable && (!!cause) && (getCauses(thisComputed)?.at(-1) === cause)
      if (!isPatchable) {
        debugger
        console.warn('cant patch:', thisComputed, cause, getCauses(thisComputed)?.at(-1), cause === getCauses(thisComputed)?.at(-1))
      }
    }

    dirtyCallback && dirtyCallback()
  })


  // 立刻 run，建立 reactiveData 和 effect
  effect.run()

  const thisComputed = new Proxy(reactiveData, {
    get(target, key, receiver) {
      // 获取任何值得时候 check dirty
      if (isDirty) {
        effect.run()
        isDirty = false
      }

      return target[key]
    }
  })

  computedToEffect.set(thisComputed, effect)

  // 如果有 patchFn，要执行注册一下针对每个变化的操作。
  applyPatch = patchFn ? registerPatchFns(thisComputed, patchFn) : undefined

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


export function autorun(run, patchFn) {
  const result = computed2(() => {
    return {
      name: run.name,
      token: run()
    }
  }, patchFn, () => {
    Promise.resolve().then(() => {
      result.token
    })
  })

  return function stop() {
    destroyComputed(result)
  }
}


