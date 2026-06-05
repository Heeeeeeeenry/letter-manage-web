<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header" id="audit-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe)">
          <i class="fas fa-search text-purple-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">核查工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">待审核信件</div>
        </div>
      </div>
      <span class="wp-badge wp-badge-purple font-bold">{{ totalCount }} 件待核查</span>
    </div>

    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- Left -->
      <div class="wp-panel flex flex-col" style="width:300px;flex-shrink:0">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">待核查信件</span>
          <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadData">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingList }"></i>
          </button>
        </div>
        <div class="wp-scroll">
          <div v-if="loadingList && letters.length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="letters.length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>暂无待核查信件
          </div>
          <div
            v-for="letter in letters"
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
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-xs">
          <span class="text-gray-400">共 {{ totalCount }} 条</span>
          <div class="flex gap-1">
            <button class="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30" :disabled="currentPage <= 1" @click="goPage(1)">首页</button>
            <button class="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">上一页</button>
            <span class="px-2 py-1 text-gray-500">{{ currentPage }} / {{ totalPages }}</span>
            <button class="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页</button>
            <button class="px-2 py-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-30" :disabled="currentPage >= totalPages" @click="goPage(totalPages)">末页</button>
          </div>
        </div>
      </div>

      <!-- Right -->
      <div class="wp-panel flex-1 flex flex-col overflow-hidden">
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>请从左侧选择信件
          </div>
        </div>
        <template v-else>
          <div class="wp-panel-header compact">
            <div class="text-sm font-semibold">核查详情</div>
            <div class="flex gap-2">
              <button class="wp-btn wp-btn-danger text-xs py-1 px-2" :disabled="submitting" @click="handleRejectClick">
                <i class="fas fa-times"></i>不通过
              </button>
              <button class="wp-btn wp-btn-success text-xs py-1 px-2" :disabled="submitting" @click="handleApproveClick">
                <i class="fas fa-check"></i>核查通过
              </button>
            </div>
          </div>
          <div class="wp-scroll p-4 space-y-4">
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><label class="text-xs text-gray-500 mb-1 block">来信人</label><input class="wp-input text-sm" :value="selectedLetter['群众姓名']" readonly /></div>
              <div><label class="text-xs text-gray-500 mb-1 block">手机号</label><input class="wp-input text-sm" :value="selectedLetter['手机号']" readonly /></div>
              <div><label class="text-xs text-gray-500 mb-1 block">分类</label><input class="wp-input text-sm" :value="[selectedLetter['信件一级分类'],selectedLetter['信件二级分类'],selectedLetter['信件三级分类']].filter(Boolean).join(' / ')" readonly /></div>
              <div><label class="text-xs text-gray-500 mb-1 block">来信时间</label><input class="wp-input text-sm" :value="formatTime(selectedLetter['来信时间'])" readonly /></div>
            </div>

            <div>
              <label class="text-xs text-gray-500 mb-1 block">诉求内容</label>
              <div class="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 whitespace-pre-wrap">{{ selectedLetter['诉求内容'] }}</div>
            </div>

            <div>
              <label class="text-sm font-medium text-gray-700 mb-2 block">核查意见</label>
              <textarea class="wp-input text-sm resize-none" rows="4" v-model="auditComment" placeholder="请填写核查意见..."></textarea>
            </div>

            <!-- Flow records -->
            <div>
              <div class="text-sm font-medium text-gray-700 mb-3">流转记录</div>
              <div v-if="!flowRecords.length" class="text-xs text-gray-400">暂无流转记录</div>
              <div v-else class="wp-timeline">
                <div v-for="(rec, idx) in flowRecords" :key="idx" class="wp-timeline-item">
                  <div class="wp-timeline-dot"></div>
                  <div class="bg-gray-50 rounded-xl p-3 text-sm">
                    <div class="flex justify-between mb-1">
                      <span class="font-medium">{{ rec['操作类型'] }}</span>
                      <span class="text-xs text-gray-400">{{ formatTime(rec['操作时间']) }}</span>
                    </div>
                    <div v-if="rec['操作人']" class="text-xs text-gray-500">操作人：{{ rec['操作人'] }}</div>
                    <div v-if="rec['操作单位']" class="text-xs text-gray-500 mt-0.5">操作单位：{{ rec['操作单位'] }}</div>
                    <div v-if="rec['备注']" class="text-xs text-gray-400 mt-1 bg-white rounded-lg p-2">{{ rec['备注'] }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Attachments -->
            <div v-if="hasAuditFiles">
              <div class="text-sm font-medium text-gray-700 mb-3">附件</div>
              <div class="space-y-3">
                <div v-if="auditFileGroups.handler_feedback.length" class="bg-gray-50 rounded-xl p-3">
                  <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                    <i class="fas fa-clipboard-check text-purple-500"></i>处理人反馈附件
                  </div>
                  <div class="space-y-2">
                    <div v-for="(f, i) in auditFileGroups.handler_feedback" :key="i">
                      <div v-if="isImageFile(f.name)" class="bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow" @click="previewImage = f.url">
                        <img :src="f.url" :alt="f.name" class="w-full max-h-36 object-cover" />
                        <div class="text-xs text-gray-500 px-2 py-1 truncate">{{ f.name }}</div>
                      </div>
                      <div v-else-if="isAudioFile(f.name)" class="bg-white rounded-lg border border-gray-200 p-2">
                        <div class="text-xs text-gray-500 mb-1.5 truncate">{{ f.name }}</div>
                        <audio controls :src="f.url" class="w-full" style="height:32px"></audio>
                        <div class="flex items-center gap-2 mt-2">
                          <button v-if="!transcribing[f.url] && (transcribeErrors[f.url] || !transcripts[f.url])" class="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                            @click.stop="doTranscribe(f.url)">
                            <i class="fas fa-language"></i>{{ transcribeErrors[f.url] ? '重试转写' : '转文字' }}
                          </button>
                          <span v-if="transcribing[f.url]" class="text-xs text-gray-400"><i class="fas fa-spinner fa-pulse"></i> 转写中...</span>
                        </div>
                        <div v-if="transcribeErrors[f.url]" class="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
                          {{ transcribeErrors[f.url] }}
                          <button class="ml-2 text-xs underline hover:no-underline" @click="doTranscribe(f.url)">重试</button>
                        </div>
                        <div v-if="transcripts[f.url] !== undefined && !transcribeErrors[f.url]" class="mt-2">
                          <TypewriterText 
                            :text="transcripts[f.url] || ''" 
                            :typing="!!transcribing[f.url]"
                            :speed="25"
                          />
                          <div v-if="!transcribing[f.url]" class="transcribe-done">✔ 转写完成</div>
                        </div>
                      </div>
                      <a v-else :href="f.url" target="_blank"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 bg-white rounded-lg border border-gray-200 hover:border-purple-400 hover:shadow-sm transition-all text-xs text-gray-700">
                        <i class="fas fa-file text-purple-400"></i>{{ f.name }}
                      </a>
                    </div>
                  </div>
                </div>
                <div v-if="auditFileGroups.call_recordings.length" class="bg-gray-50 rounded-xl p-3">
                  <div class="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-600">
                    <i class="fas fa-microphone text-red-500"></i>通话录音
                  </div>
                  <div class="space-y-3">
                    <div v-for="(f, i) in auditFileGroups.call_recordings" :key="i" class="bg-white rounded-lg border border-gray-200 p-2">
                      <div class="text-xs text-gray-500 mb-1.5 truncate">{{ f.name }}</div>
                      <audio controls :src="f.url" class="w-full" style="height:32px"></audio>
                      <div class="flex items-center gap-2 mt-2">
                        <button v-if="!transcribing[f.url] && (transcribeErrors[f.url] || !transcripts[f.url])" class="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                          @click.stop="doTranscribe(f.url)">
                          <i class="fas fa-language"></i>{{ transcribeErrors[f.url] ? '重试转写' : '转文字' }}
                        </button>
                        <span v-if="transcribing[f.url]" class="text-xs text-gray-400"><i class="fas fa-spinner fa-pulse"></i> 转写中...</span>
                      </div>
                      <div v-if="transcribeErrors[f.url]" class="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
                        {{ transcribeErrors[f.url] }}
                        <button class="ml-2 text-xs underline hover:no-underline" @click="doTranscribe(f.url)">重试</button>
                      </div>
                      <div v-if="transcripts[f.url] !== undefined && !transcribeErrors[f.url]" class="mt-2 transcribe-terminal">
                        <div class="transcribe-lines">
                          <div v-for="(line, idx) in lineCache[f.url]" :key="idx" class="transcribe-line" 
                            :class="{ 
                              typing: transcribing[f.url] && idx === lineCache[f.url].length - 1,
                              'paragraph-start': line.isParagraphStart 
                            }">
                            <span class="line-num">{{ String(idx + 1).padStart(2, '0') }}</span>
                            <span class="line-text">{{ line.text }}<span v-if="transcribing[f.url] && idx === lineCache[f.url].length - 1" class="transcribe-cursor">▌</span></span>
                          </div>
                          <div v-if="transcribing[f.url] && lineCache[f.url].length === 0" class="transcribe-line typing">
                            <span class="line-num">01</span>
                            <span class="line-text"><span class="transcribe-cursor">▌</span></span>
                          </div>
                        </div>
                        <div v-if="!transcribing[f.url]" class="transcribe-done">✔ 转写完成</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Image lightbox -->
  <div v-if="previewImage" class="wp-modal-overlay" style="z-index:9999" @click="previewImage = null">
    <div class="relative max-w-4xl max-h-[90vh] mx-4" @click.stop>
      <button class="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300" @click="previewImage = null">&times;</button>
      <img :src="previewImage" class="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
    </div>
  </div>

  <!-- Confirm modal -->
  <div v-if="showConfirm" class="wp-modal-overlay" style="z-index:9999" @click.self="showConfirm = false">
    <div class="wp-modal" style="max-width:400px;width:90%">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
          :class="confirmType === 'danger' ? 'bg-red-100' : 'bg-blue-100'">
          <i class="fas text-xl"
            :class="confirmType === 'danger' ? 'fa-exclamation-triangle text-red-500' : 'fa-question-circle text-blue-500'"></i>
        </div>
        <div class="font-semibold text-gray-800 mb-1">{{ confirmTitle }}</div>
        <div class="text-sm text-gray-500 mb-6">{{ confirmMessage }}</div>
        <div class="flex gap-3 justify-center">
          <button class="wp-btn wp-btn-secondary text-sm px-6" @click="showConfirm = false">取消</button>
          <button class="wp-btn text-sm px-6"
            :class="confirmType === 'danger' ? 'wp-btn-danger' : 'wp-btn-primary'"
            @click="onConfirm">{{ confirmBtn }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { getAuditList, getDetail, auditApprove, auditReject, transcribeAudio, transcribeAudioStream } from '@/api/letter'
import { normalizeFlowRecords } from '@/utils/flow'
import { channelName, statusName } from '@/utils/mappings'
import StatusBadge from '@/components/StatusBadge.vue'
import TypewriterText from '@/components/TypewriterText.vue'

const letters = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const auditComment = ref('')
const showConfirm = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmBtn = ref('确定')
const confirmType = ref('danger')
let confirmCallback = null
let pollTimer = null
let activeStreamController = null

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

const parseFileArray = (val) => {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { const parsed = JSON.parse(val); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
  }
  return []
}

const audioExts = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma', '.opus', '.webm']
const isAudioFile = (name) => {
  if (!name) return false
  const lower = name.toLowerCase()
  return audioExts.some(ext => lower.endsWith(ext))
}

const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
const isImageFile = (name) => {
  if (!name) return false
  const lower = name.toLowerCase()
  return imageExts.some(ext => lower.endsWith(ext))
}

const previewImage = ref(null)

// 音频转文字
const transcripts = reactive({})
const transcribing = reactive({})
const transcribeErrors = reactive({})
const transcribeStatus = reactive({})

// SenseVoice 风格：按换行分行，按句末标点切段落
const splitLines = (text) => {
  if (!text) return [{ text: '', isParagraphStart: false }]
  const rawLines = text.split(/\n+/).filter(s => s.trim())
  if (rawLines.length === 0) return [{ text, isParagraphStart: false }]

  const lines = []
  let prevEndsWithPunct = false
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim()
    if (!line) continue
    // 上一行以句号/问号/感叹号结尾 → 新段落
    const isParagraphStart = i > 0 && prevEndsWithPunct
    lines.push({ text: line, isParagraphStart })
    prevEndsWithPunct = /[。！？]$/.test(line)
  }
  return lines.length ? lines : [{ text, isParagraphStart: false }]
}

const lineCache = reactive({})
watch(() => ({ ...transcripts }), () => {
  for (const k of Object.keys(transcripts)) {
    lineCache[k] = splitLines(transcripts[k] || '')
  }
}, { deep: true, immediate: true })

const doTranscribe = (url) => {
  if (transcribing[url]) return
  transcribing[url] = true
  delete transcribeErrors[url]
  // 不删除已有 transcripts，错误时保留已转写的内容
  if (!transcripts[url]) transcripts[url] = ''

  activeStreamController = transcribeAudioStream(url,
    // onChunk: 逐句追加
    (chunk) => {
      transcribeStatus[url] = ''
      transcripts[url] = (transcripts[url] || '') + chunk
    },
    // onDone: 完成
    (fullText) => {
      transcribeStatus[url] = ''
      if (fullText && !transcripts[url]) transcripts[url] = fullText
      transcribing[url] = false
    },
    // onError
    (err) => {
      transcribeErrors[url] = '转写失败: ' + err
      transcribing[url] = false
    },
    // onStatus: 显示进度
    (msg) => {
      transcribeStatus[url] = msg
    }
  )
}

const auditFileGroups = computed(() => {
  const files = selectedLetter.value?.['附件'] || {}
  return {
    handler_feedback: parseFileArray(files.handler_feedback_files),
    call_recordings: parseFileArray(files.call_recordings),
  }
})

const hasAuditFiles = computed(() => {
  const g = auditFileGroups.value
  return g.handler_feedback.length > 0 || g.call_recordings.length > 0
})

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const selectLetter = async (letter) => {
  selectedLetter.value = letter
  auditComment.value = ''
  // Fetch flow records and attachments from detail API
  try {
    const res = await getDetail(letter['信件编号'])
    const records = res?.data?.flow?.flow_records
    if (Array.isArray(records) && records.length > 0) {
      selectedLetter.value['流转记录'] = normalizeFlowRecords(records)
    }
    const files = res?.data?.files || {}
    selectedLetter.value['附件'] = files
  } catch (e) {
    console.error('Failed to fetch flow records:', e)
  }
}

const showConfirmDialog = (title, message, btn, type, cb) => {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmBtn.value = btn
  confirmType.value = type
  confirmCallback = cb
  showConfirm.value = true
}

const onConfirm = () => {
  showConfirm.value = false
  if (confirmCallback) confirmCallback()
}

const handleApproveClick = () => {
  if (!selectedLetter.value) return
  showConfirmDialog(
    '确认核查通过',
    '确定将此信件标记为核查通过？',
    '核查通过',
    'primary',
    handleApprove
  )
}

const handleRejectClick = () => {
  if (!selectedLetter.value) return
  if (!auditComment.value.trim()) {
    showConfirmDialog(
      '提示',
      '请填写核查意见后再提交不通过',
      '知道了',
      'danger',
      null
    )
    return
  }
  showConfirmDialog(
    '确认核查不通过',
    '确定将此信件退回？此操作不可撤销。',
    '确认退回',
    'danger',
    handleReject
  )
}

const handleApprove = async () => {
  if (!selectedLetter.value) return
  submitting.value = true
  try {
    await auditApprove({ letter_no: selectedLetter.value['信件编号'], remark: auditComment.value })
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

const handleReject = async () => {
  if (!selectedLetter.value) return
  submitting.value = true
  try {
    await auditReject({ letter_no: selectedLetter.value['信件编号'], remark: auditComment.value })
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

const loadData = async () => {
  loadingList.value = true
  try {
    const args = { page: currentPage.value, page_size: pageSize.value }
    const res = await getAuditList(args)
    if (res.success) {
      const list = res.data?.list || res.data || []
      letters.value = list.map(letter => ({
        '信件编号': letter.letter_no,
        '群众姓名': letter.citizen_name,
        '手机号': letter.phone,
        '身份证号': letter.id_card,
        '诉求内容': letter.content,
        '信件状态': statusName(letter.current_status),
        '来信时间': letter.created_at,
        '信件一级分类': letter.category?.level1 || '',
        '信件二级分类': letter.category?.level2 || '',
        '信件三级分类': letter.category?.level3 || '',
        _raw: letter
      }))
      totalCount.value = res.data?.total || 0
    }
  } catch {}
  loadingList.value = false
}

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
  loadData()
}

onMounted(async () => {
  await loadData()
  pollTimer = setInterval(loadData, 5000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
/* SenseVoice 风格终端转写输出 */
.transcribe-terminal {
  font-family: 'SF Mono', 'Menlo', 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  background: #1e1e2e;
  color: #cdd6f4;
  border: 1px solid #313244;
  border-radius: 8px;
  padding: 12px 16px;
  max-height: 280px;
  overflow-y: auto;
  position: relative;
}

.transcribe-lines {
  min-height: 1.5em;
}

.transcribe-line {
  display: flex;
  gap: 12px;
  padding: 1px 0;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 段落首行加间距 — SenseVoice 风格 */
.transcribe-line.paragraph-start {
  margin-top: 10px;
}

.transcribe-line .line-num {
  flex-shrink: 0;
  width: 24px;
  text-align: right;
  color: #585b70;
  font-size: 11px;
  user-select: none;
}

.transcribe-line .line-text {
  flex: 1;
  color: #cdd6f4;
}

/* 闪烁光标 — SenseVoice 同款蓝色 */
@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.transcribe-cursor {
  display: inline;
  color: #89b4fa;
  font-weight: bold;
  animation: cursor-blink 0.8s infinite;
}

/* 正在输入的行高亮 */
.transcribe-line.typing .line-text {
  color: #f5c2e7;
}

/* 完成标记 */
.transcribe-done {
  display: block;
  text-align: right;
  color: #a6e3a1;
  font-size: 11px;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid #313244;
}
</style>
