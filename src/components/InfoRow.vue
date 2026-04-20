<template>
  <div class="wp-detail-row">
    <div class="wp-detail-label">{{ label }}</div>
    <div class="wp-detail-value" :class="{ 'font-mono text-xs': mono }">
      <slot v-if="custom" />
      <template v-else>{{ value || '-' }}</template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  mono: Boolean,
  custom: Boolean,
})
</script>
