<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import {reactive, computed, ref, watchEffect} from 'vue'
const arr = reactive(((new Array(10000)).fill(1)))
// const arr = reactive([])

const insert10w = () => {
  arr.push(...((new Array(50000)).fill(1)))
}

const changeTo2 = () => {
  arr.forEach((x, i) => arr[i] = 2)
}

const a = ref(1)
const b = computed(() => a.value + 1)
const f = computed(() => {
  console.log('f run')
  return a.value + 1
})
const c = computed(() => {
  console.log('c run')
  return b.value + 1
})
const d = computed(() => {
  console.log('d run')
  return a.value + c.value
})

watchEffect(() => {
  console.log(d.value)
  console.log(f.value)
})

console.log('======')
a.value = 2





</script>

<template>
  <div>
    <div>
      <div>
        <input />
        <button @click="insert10w">insert 10w</button>
        <button @click="changeTo2">change to 2</button>
      </div>
      <div >
        <span v-for="i in arr">{{i}}</span>
      </div>
    </div>
  </div>
</template>

