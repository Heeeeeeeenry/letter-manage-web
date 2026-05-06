<template>
  <span class="wp-badge" :class="badgeClass">{{ display }}</span>
</template>

<script setup>
import { computed } from 'vue'
import { statusName } from '@/utils/mappings'

const props = defineProps({ status: [String, Number] })

const display = computed(() => {
  if (props.status === null || props.status === undefined) return ''
  if (typeof props.status === 'number') return statusName(props.status)
  return props.status
})

const badgeClass = computed(() => {
  const s = typeof props.status === 'number' ? statusName(props.status) : (props.status || '')
  if (s.includes('预处理') || s.includes('待') || s.includes('新')) return 'wp-badge-yellow'
  if (s.includes('处理中')) return 'wp-badge-blue'
  if (s.includes('完成') || s.includes('已处理') || s.includes('已完成') || s.includes('办结')) return 'wp-badge-green'
  if (s.includes('无效') || s.includes('驳回') || s.includes('不通过')) return 'wp-badge-red'
  if (s.includes('审核') || s.includes('反馈') || s.includes('核查')) return 'wp-badge-purple'
  if (s.includes('下发') || s.includes('退回')) return 'wp-badge-orange'
  return 'wp-badge-gray'
})
</script>
