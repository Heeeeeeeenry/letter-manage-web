<template>
  <div class="relative">
    <div class="wp-input cursor-pointer flex items-center justify-between" :class="{ 'opacity-50 cursor-not-allowed': disabled }" @click="!disabled && (open = !open)">
      <span class="truncate" :class="{ 'text-gray-400': !modelValue }">{{ displayText || placeholder }}</span>
      <i class="fas fa-chevron-down text-gray-400 text-sm transition-transform" :class="{ 'rotate-180': open }"></i>
    </div>
    <div v-if="open" class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col" style="max-height:300px">
      <div class="p-2 border-b border-gray-100">
        <input v-model="search" class="wp-input text-sm w-full" placeholder="搜索..." @click.stop />
      </div>
      <div class="overflow-y-auto flex-1">
        <div v-if="filteredOptions.length === 0" class="text-center py-4 text-gray-400 text-sm">未找到匹配项</div>
        <div
          v-for="opt in filteredOptions"
          :key="opt.value"
          class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
          :class="{ 'bg-blue-50 text-blue-600': modelValue === opt.value }"
          @click="select(opt.value)"
        >{{ opt.label }}</div>
      </div>
    </div>
    <div v-if="open" class="fixed inset-0 z-40" @click="open = false"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')

const displayText = computed(() => {
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt ? opt.label : ''
})

const filteredOptions = computed(() => {
  if (!search.value.trim()) return props.options
  const kw = search.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(kw))
})

const select = (val) => {
  emit('update:modelValue', val)
  open.value = false
  search.value = ''
}

watch(open, (val) => {
  if (!val) search.value = ''
})
</script>
