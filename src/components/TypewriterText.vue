<template>
  <div class="typewriter-container" ref="containerRef" @scroll="onScroll" @wheel="onWheel">
    <div class="typewriter-content">
      <span class="typewriter-text">{{ displayedText }}</span>
      <span v-if="isTyping" class="typewriter-cursor">▌</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick, computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  typing: { type: Boolean, default: false },
  speed: { type: Number, default: 25 }
})

// Internal state
const containerRef = ref(null)
const userScrolled = ref(false)
const displayedLength = ref(0)
let timer = null
let lastText = ''

// Track if text was appended (continuous) or replaced
const isAppend = (oldText, newText) => {
  return newText.startsWith(oldText) && newText.length > oldText.length
}

// Start/resume typing toward target length
function typeToward(targetLen) {
  clearInterval(timer)
  if (displayedLength.value >= targetLen) return

  timer = setInterval(() => {
    if (displayedLength.value < targetLen) {
      displayedLength.value++
      scrollToBottom()
    } else {
      clearInterval(timer)
    }
  }, props.speed)
}

// Watch text changes — only type new characters
watch(() => props.text, (newText, oldText) => {
  if (!props.typing) {
    // Not typing: show everything immediately
    displayedLength.value = newText.length
    scrollToBottom()
    return
  }

  if (isAppend(oldText || '', newText)) {
    // Appended: type the new characters
    typeToward(newText.length)
  } else {
    // Replaced or initial: start from 0
    displayedLength.value = 0
    typeToward(newText.length)
  }
}, { immediate: true })

// Watch typing state — when done, show all
watch(() => props.typing, (val) => {
  if (!val) {
    clearInterval(timer)
    displayedLength.value = props.text.length
    scrollToBottom()
  }
})

// Computed
const displayedText = computed(() => props.text.slice(0, displayedLength.value))
const isTyping = computed(() => props.typing && displayedLength.value < props.text.length)

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
  clearInterval(timer)
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
