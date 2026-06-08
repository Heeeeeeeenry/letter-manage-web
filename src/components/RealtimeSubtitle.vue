<template>
  <div class="gpt-subtitle" ref="containerRef">
    <div class="subtitle-content">
      <span class="stable-text">{{ stableText }}</span>
      <span class="unstable-text">{{ unstableText }}</span>
      <span v-if="isActive" class="cursor-blink">▌</span>
    </div>
    <div v-if="isActive && !stableText && !unstableText" class="listening-hint">
      🎙️ 正在聆听...
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  stableText: { type: String, default: '' },
  unstableText: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
})

const containerRef = ref(null)
</script>

<style scoped>
.gpt-subtitle {
  padding: 16px 20px;
  min-height: 60px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 12px;
  font-size: 16px;
  line-height: 1.8;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: min-height 0.2s;
}

.subtitle-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.stable-text {
  color: #ffffff;
}

.unstable-text {
  color: #888888;
  font-style: italic;
}

.cursor-blink {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #4fc3f7;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.listening-hint {
  color: #888;
  font-size: 14px;
  margin-top: 4px;
}
</style>
