<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import {reactive, onUpdated, computed} from 'vue'
const arr = reactive(((new Array(50000)).fill(1)))
// const arr = reactive([])

// const insert10w = () => {
//   arr.push(...((new Array(50000)).fill(1)))
// }
//
// onUpdated(() => {
//   console.timeEnd('u')
// })
//
// const unshift2 = () => {
//   console.time('u')
//   console.time('l')
//   arr.unshift(2)
//   console.timeEnd('l')
// }
//
// const changeTo2 = () => {
//   arr.forEach((x, i) => arr[i] = 2)
// }
//
// // setTimeout(() => {
// //
// //
// // }, 500)
//
// const arr2 = reactive(((new Array(100000)).fill(1)))
// const mapedArr2 = computed(() => (arr2.map( item => item + 1)))
//
// const testComputed = () => {
//   console.time('t')
//   arr2.unshift(2)
//   if(mapedArr2.value){
//     console.timeEnd('t')
//   }
// }



const data = reactive({ type: 'Para', children: [{type: 'Text', content: 'p1'}, {type: 'Text', content: 'p2'}]})
const ccc = computed(() => {
  return data.children.map(c => c.type)
}, {
  onTrigger:() => {
    debugger
  }
})
console.log(ccc.value[1])

setTimeout(() => {
  data.children.push({type:'Text', content:'p3'})
  debugger
  console.log(ccc.value[2])
}, 100)


</script>

<template>
  <div>
    <div>
      <div>
        <input />
        <button @click="insert10w">insert 10w</button>
        <button @click="unshift2">unshift 2</button>
        <button @click="changeTo2">change to 2</button>
        <button @click="testComputed">testComputed</button>
      </div>
      <div >
<!--        <span v-for="i in arr">{{i}}</span>-->
      </div>
    </div>
  </div>
</template>

