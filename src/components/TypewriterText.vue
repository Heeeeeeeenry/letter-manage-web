<template>
  <div class="typewriter-container" ref="containerRef" @scroll="onScroll" @wheel="onWheel">
    <div class="typewriter-content">
      <span class="typewriter-text">{{ displayText }}</span>
      <span v-if="isTyping" class="typewriter-cursor">▌</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  typing: { type: Boolean, default: false },
  speed: { type: Number, default: 25 }
})

const emit = defineEmits(['done'])

const containerRef = ref(null)
const displayText = ref('')
const isTyping = ref(false)
const userScrolled = ref(false)
const pendingBuffer = ref('')
const committedLength = ref(0)
const burstThreshold = 20
const rafId = ref(null)

// RAF-based typewriter loop with burst mode
function typeLoop() {
  const pending = pendingBuffer.value
  if (pending.length === 0) {
    isTyping.value = false
    rafId.value = null
    emit('done')
    return
  }
  isTyping.value = true
  
  // Burst mode: if buffer is large, type faster
  const charsPerTick = pending.length > burstThreshold ? 5 : 1
  const take = pending.substring(0, charsPerTick)
  pendingBuffer.value = pending.substring(charsPerTick)
  displayText.value += take
  committedLength.value = displayText.value.length
  
  scrollToBottom()
  setTimeout(() => { rafId.value = requestAnimationFrame(typeLoop) }, props.speed)
}

function startTypewriter() {
  if (!rafId.value && pendingBuffer.value.length > 0) {
    rafId.value = requestAnimationFrame(typeLoop)
  }
}

// Watch for new text — only process delta
watch(() => props.text, (newText) => {
  if (!newText) {
    displayText.value = ''
    committedLength.value = 0
    pendingBuffer.value = ''
    return
  }
  const delta = newText.substring(committedLength.value)
  if (delta.length > 0) {
    pendingBuffer.value += delta
    startTypewriter()
  }
}, { immediate: true })

// Auto-scroll
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

onBeforeUnmount(() => {
  if (rafId.value) cancelAnimationFrame(rafId.value)
  clearTimeout(scrollTimeout)
})
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
