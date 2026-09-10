---
title: Vue 3 组合式 API 使用心得
date: 2026-09-09
tags: [Vue, 前端]
category: 技术
summary: 总结 Vue 3 组合式 API 相比选项式 API 的优势和常见用法。
---

## 为什么用组合式 API

组合式 API 让相关逻辑聚在一起，而不是像选项式 API 那样按 `data`、`methods`、`computed` 分散各处。

## 基本用法

```vue
<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">{{ count }} x 2 = {{ double }}</button>
</template>
```

## 抽取可复用逻辑

把逻辑抽成 `useXxx` 函数是组合式 API 最大的好处：

```js
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}
```
