import { reactive, computed, computed2, forEachValue, effect } from '../../dist/reactivity.esm.js'


const length = 10000
const arr = reactive((new Array(50000)).fill(1).map((_, index) => index))
const arr2 = reactive((new Array(length)).fill(1).map((_, index) => index))

function mapTo$Str(i) {
    return `$${i}` + (new Array(10000)).fill(1).map(j => `${j}`).join('.')
}

console.time('build computed')
const computedArr2 = computed2(() => {
    console.log('patchableComputed')
    return arr2.map(mapTo$Str)
}, ({ on }) => {
    (['unshift', 'push']).forEach((method) => {
        on(arr2[method], [arr2], (argv, lastResult) => {
            console.log('run patch')
            lastResult[method](mapTo$Str(argv[0]))
        })
    });

    (['shift', 'pop']).forEach((method) => {
        on(arr2[method], [arr2], (argv, lastResult) => {
            lastResult[method]()
        })
    });

    // TODO splice

    // TODO 单个节点的 INTEGER_KEY_SET

})

console.timeEnd('build computed')



// console.log(computedArr[99])
// console.time('1')
// arr.unshift(101)
// console.log(computedArr[100])
// console.timeEnd('1')
console.log(1111111111111111111, '\n')
// console.log(computedArr2[99])
console.time('unshift' + length)
arr2.unshift(101)
~computedArr2[100]
console.timeEnd('unshift' + length)

console.time('push' + length)
arr2.push(101)
~computedArr2[100]
console.timeEnd('push' + length)


const arrx = (new Array(10000)).fill(1).map((_, index) => index)
console.time('raw unshift')
arrx.unshift(100)
console.timeEnd('raw unshift')

console.time('reactive unshift')
arr2.unshift(100)
console.timeEnd('reactive unshift')


