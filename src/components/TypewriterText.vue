<template>
  <div class="typewriter-container" ref="containerRef" @scroll="onScroll" @wheel="onWheel">
    <div class="typewriter-content">
      <span class="typewriter-text">{{ text }}</span>
      <span v-if="typing" class="typewriter-cursor">▌</span>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  typing: { type: Boolean, default: false },
  speed: { type: Number, default: 25 }
})

const containerRef = ref(null)
const userScrolled = ref(false)

function scrollToBottom() {
  if (userScrolled.value) return
  nextTick(() => {
    const el = containerRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

let scrollTimeout = null
function onScroll() {
  const el = containerRef.value
  if (!el) return
  const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30
  if (atBottom) {
    userScrolled.value = false
  } else {
    userScrolled.value = true
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(() => { userScrolled.value = false; scrollToBottom() }, 3000)
  }
}

function onWheel(e) {
  if (e.deltaY < 0) userScrolled.value = true
}

onBeforeUnmount(() => clearTimeout(scrollTimeout))

// Auto-scroll when text changes
import { watch } from 'vue'
watch(() => props.text, () => scrollToBottom())
</script>

<style scoped>
.typewriter-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 12px 16px;
  background: #1a1a2e;
  border-radius: 8px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.8;
  color: #e0e0e0;
}
.typewriter-content {
  white-space: pre-wrap;
  word-break: break-all;
}
.typewriter-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #4fc3f7;
  font-weight: bold;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.typewriter-container::-webkit-scrollbar { width: 6px; }
.typewriter-container::-webkit-scrollbar-track { background: transparent; }
.typewriter-container::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
</style>
