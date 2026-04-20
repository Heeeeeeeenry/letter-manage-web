<template>
  <span class="wp-badge" :class="badgeClass">{{ status }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ status: String })

const badgeClass = computed(() => {
  const s = props.status || ''
  if (s.includes('预处理') || s.includes('待') || s.includes('新')) return 'wp-badge-yellow'
  if (s.includes('处理中') || s.includes('正在处理')) return 'wp-badge-blue'
  if (s.includes('完成') || s.includes('已处理') || s.includes('已完成')) return 'wp-badge-green'
  if (s.includes('无效') || s.includes('驳回') || s.includes('不通过')) return 'wp-badge-red'
  if (s.includes('审核') || s.includes('反馈')) return 'wp-badge-purple'
  if (s.includes('下发')) return 'wp-badge-orange'
  return 'wp-badge-gray'
})
</script>
