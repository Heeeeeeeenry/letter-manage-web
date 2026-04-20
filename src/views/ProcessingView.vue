<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="wp-header" id="processing-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0)">
          <i class="fas fa-tasks text-green-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">处理工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">待处理信件</div>
        </div>
      </div>
      <span class="wp-badge wp-badge-green font-bold">{{ Object.keys(letters).length }} 件待处理</span>
    </div>

    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- Left list -->
      <div class="wp-panel flex flex-col" style="width:300px;flex-shrink:0" id="letter-list-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">待处理信件</span>
          <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadData">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingList }"></i>
          </button>
        </div>
        <div class="wp-scroll">
          <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>暂无待处理信件
          </div>
          <div
            v-for="letter in Object.values(letters)"
            :key="letter['信件编号']"
            class="wp-list-item"
            :class="{ active: selectedLetter?.['信件编号'] === letter['信件编号'] }"
            @click="selectLetter(letter)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono text-blue-600">{{ letter['信件编号'] }}</span>
              <StatusBadge :status="letter['信件状态']" />
            </div>
            <div class="text-sm font-medium">{{ letter['群众姓名'] }}</div>
            <div class="text-xs text-gray-500 truncate mt-1">{{ letter['诉求内容'] }}</div>
            <div v-if="letter['截止时间']" class="text-xs text-red-500 mt-1">
              <i class="fas fa-clock mr-1"></i>截止：{{ formatTime(letter['截止时间']) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right detail -->
      <div class="wp-panel flex-1 flex flex-col overflow-hidden" id="letter-detail-panel">
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            请从左侧选择信件
          </div>
        </div>

        <template v-else>
          <!-- Tabs nav -->
          <div class="flex gap-0 border-b border-gray-100 px-4">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="wp-tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="activeTab = tab.id"
            >{{ tab.label }}</button>
          </div>

          <div class="wp-scroll p-4" id="processing-scroll-container">
            <!-- Info section -->
            <div v-if="activeTab === 'info'" class="space-y-4" id="section-info">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">来信人</label>
                  <input class="wp-input text-sm" :value="selectedLetter['群众姓名']" readonly />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">手机号</label>
                  <input class="wp-input text-sm" :value="selectedLetter['手机号']" readonly />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">来信时间</label>
                  <input class="wp-input text-sm" :value="formatTime(selectedLetter['来信时间'])" readonly />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">分类</label>
                  <input class="wp-input text-sm" :value="[selectedLetter['信件一级分类'],selectedLetter['信件二级分类'],selectedLetter['信件三级分类']].filter(Boolean).join(' / ')" readonly />
                </div>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">诉求内容</label>
                <div class="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap">{{ selectedLetter['诉求内容'] }}</div>
              </div>
            </div>

            <!-- Handle section -->
            <div v-if="activeTab === 'handle'" class="space-y-4" id="section-handle">
              <!-- Upload recordings -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">上传通话录音</label>
                <div
                  class="wp-upload-zone"
                  @dragover.prevent
                  @drop.prevent="handleFileDrop($event, 'recording')"
                  @click="$refs.recordingInput.click()"
                >
                  <i class="fas fa-microphone text-2xl mb-2 block"></i>
                  <div class="text-sm">点击或拖拽上传通话录音</div>
                  <div class="text-xs text-gray-400 mt-1">支持 .mp3 .wav .m4a 格式</div>
                  <input ref="recordingInput" type="file" accept=".mp3,.wav,.m4a" class="hidden" multiple @change="handleFileSelect($event, 'recording')" />
                </div>
                <div v-if="recordings.length" class="mt-2 space-y-1">
                  <div v-for="(f, i) in recordings" :key="i" class="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    <i class="fas fa-file-audio text-blue-400"></i>
                    <span class="flex-1 truncate">{{ f.name }}</span>
                    <button class="text-red-400 hover:text-red-600" @click="recordings.splice(i,1)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Remark -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">处理反馈</label>
                <textarea
                  class="wp-input text-sm resize-none"
                  rows="5"
                  v-model="remark"
                  placeholder="请输入处理反馈内容..."
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 justify-end">
                <button class="wp-btn wp-btn-danger" @click="handleReturn">
                  <i class="fas fa-undo"></i>退回
                </button>
                <button class="wp-btn wp-btn-primary" :disabled="submitting" @click="handleSubmit">
                  <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-check"></i>
                  提交处理
                </button>
              </div>
            </div>

            <!-- Flow records -->
            <div v-if="activeTab === 'flow'" class="space-y-3" id="section-flow">
              <div v-if="!flowRecords.length" class="text-center text-gray-400 py-8">暂无流转记录</div>
              <div v-else class="wp-timeline">
                <div v-for="(rec, idx) in flowRecords" :key="idx" class="wp-timeline-item">
                  <div class="wp-timeline-dot"></div>
                  <div class="bg-gray-50 rounded-xl p-3 text-sm">
                    <div class="flex justify-between mb-1">
                      <span class="font-medium">{{ rec['操作类型'] }}</span>
                      <span class="text-xs text-gray-400">{{ formatTime(rec['操作时间']) }}</span>
                    </div>
                    <div v-if="rec['备注']" class="text-xs text-gray-500">{{ rec['备注'] }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getProcessingList, submitProcessing, returnLetter, markInvalid } from '@/api/letter'
import StatusBadge from '@/components/StatusBadge.vue'

const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const recordings = ref([])
const remark = ref('')
const activeTab = ref('info')
let pollTimer = null

const tabs = [
  { id: 'info', label: '信件信息' },
  { id: 'handle', label: '处理操作' },
  { id: 'flow', label: '流转记录' },
]

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const selectLetter = (letter) => {
  selectedLetter.value = letter
  remark.value = ''
  recordings.value = []
  activeTab.value = 'info'
}

const handleFileSelect = (e, type) => {
  const files = Array.from(e.target.files)
  if (type === 'recording') recordings.value = [...recordings.value, ...files]
}

const handleFileDrop = (e, type) => {
  const files = Array.from(e.dataTransfer.files)
  if (type === 'recording') recordings.value = [...recordings.value, ...files]
}

const handleReturn = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认退回此信件？')) return
  try {
    await returnLetter({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

const handleSubmit = async () => {
  if (!selectedLetter.value) return
  if (!remark.value.trim()) {
    alert('请填写处理反馈内容')
    return
  }
  submitting.value = true
  try {
    // Upload recordings first if any
    if (recordings.value.length > 0) {
      const formData = new FormData()
      formData.append('letter_no', selectedLetter.value['信件编号'])
      recordings.value.forEach(f => formData.append('files', f))
      await fetch('http://localhost:18081/api/letter/upload/', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
    }
    await submitProcessing({
      letter_no: selectedLetter.value['信件编号'],
      remark: remark.value,
    })
    await loadData()
    selectedLetter.value = null
    remark.value = ''
    recordings.value = []
  } catch {}
  submitting.value = false
}

const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getProcessingList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(l => { dict[l['信件编号']] = l })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

onMounted(async () => {
  await loadData()
  pollTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
