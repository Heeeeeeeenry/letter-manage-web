<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="wp-header" id="processing-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <i class="fas fa-tasks text-amber-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">处理工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">以最快的速度核实情况，处理群众诉求</div>
        </div>
      </div>
      <span class="wp-badge wp-badge-blue font-bold">{{ Object.keys(letters).length }} 封待处理</span>
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
            <span v-if="letter['信件三级分类']" class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium inline-block mb-2">
              {{ letter['信件三级分类'] }}
            </span>
            <div class="text-xs font-mono text-blue-600 font-medium">{{ letter['信件编号'] }}</div>
            <div class="flex items-center justify-between mt-1">
              <div class="flex items-center gap-1.5">
                <i class="fas fa-user text-gray-400" style="font-size:12px"></i>
                <span class="text-sm font-medium text-gray-800">{{ letter['群众姓名'] || '匿名' }}</span>
              </div>
              <span class="text-xs text-gray-400">{{ formatTime(letter['来信时间']) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right detail -->
      <div class="wp-panel flex-1 flex flex-col" id="letter-detail-panel">
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            请从左侧选择信件
          </div>
        </div>

        <template v-else>
          <!-- Detail top: left info + right content (matching old platform) -->
          <div class="detail-top">
            <!-- Left 40% - 7 rows of info -->
            <div class="detail-info">
              <div class="info-row">
                <i class="fas fa-envelope"></i>
                <span class="info-value">{{ selectedLetter['信件编号'] }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-tags"></i>
                <span class="info-value">{{ [selectedLetter['信件一级分类'],selectedLetter['信件二级分类'],selectedLetter['信件三级分类']].filter(Boolean).join(' / ') || '—' }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-clock"></i>
                <input type="text" class="info-input" readonly :value="formatTime(selectedLetter['来信时间'])" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-user"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['群众姓名'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-phone"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['手机号'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-id-card"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['身份证号'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-inbox"></i>
                <span class="info-value">{{ selectedLetter['来源'] || '—' }}</span>
              </div>
            </div>

            <!-- Right 60% - Appeal content -->
            <div class="detail-content flex flex-col">
              <div class="content-header">
                <i class="fas fa-align-left"></i>
                <span>诉求内容</span>
              </div>
              <textarea class="flex-1 w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 py-0.5 transition cursor-pointer resize-none" rows="4" readonly :value="selectedLetter['诉求内容'] || ''" placeholder="-" title="点击可编辑"></textarea>
            </div>
          </div>

          <!-- Main area with vertical tabs (matching old platform) -->
          <div class="flex flex-1" style="min-height:0">
            <!-- Left sidebar of detail (tabs + countdown) -->
            <div class="w-44 border-r border-gray-100 p-4 flex flex-col">
              <div class="space-y-1">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
                  @click="activeTab = tab.id"
                >{{ tab.label }}</button>
              </div>
              <!-- Processing countdown at bottom -->
              <div class="mt-auto pt-4 border-t border-gray-100">
                <div class="text-xs text-gray-400 mb-1.5">处理倒计时</div>
                <div class="text-lg font-bold" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">{{ countdownTimerStr || '-' }}</div>
              </div>
            </div>

            <!-- Main content area -->
            <div class="flex-1 p-4 overflow-y-auto">
              <!-- 流转记录 Tab (匹配老平台时间线样式) -->
              <div v-if="activeTab === 'flow'" class="flow-timeline" id="flow-records-container">
                <div v-if="loadingFlow" class="placeholder-text">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </div>
                <div v-else-if="!flowRecords.length" class="placeholder-text">
                  <i class="fas fa-info-circle mr-1"></i>暂无流转记录
                </div>
                <div v-else>
                  <div v-for="(rec, idx) in flowRecords" :key="idx" class="flow-item" :class="{ latest: idx === 0 }">
                    <div class="flow-item-content">
                      <div class="flow-item-header">
                        <span class="flow-item-type">{{ rec['操作类型'] || '-' }}</span>
                        <span class="flow-item-time">{{ formatTime(rec['操作时间']) }}</span>
                      </div>
                      <div class="flow-item-operator">
                        操作人: {{ rec['操作人'] || rec['操作人姓名'] || '-' }} ({{ rec['操作人警号'] || '-' }})
                      </div>
                      <div class="flow-item-status" v-if="rec['操作前状态'] || rec['操作后状态']">
                        <span class="status-before">{{ rec['操作前状态'] || '-' }}</span>
                        <span class="status-arrow"><i class="fas fa-arrow-right"></i></span>
                        <span class="status-after">{{ rec['操作后状态'] || '-' }}</span>
                      </div>
                      <div v-if="rec['目标单位']" class="flow-item-target">目标单位: {{ rec['目标单位'] }}</div>
                      <div v-if="rec['备注']" class="flow-item-remark">
                        <template v-if="typeof rec['备注'] === 'object'">
                          <div v-for="(val, key) in rec['备注']" :key="key" class="flow-item-remark-item">
                            <span class="remark-key">{{ key }}:</span> {{ Array.isArray(val) ? val.join(' / ') : val }}
                          </div>
                        </template>
                        <div v-else class="flow-item-remark-item">{{ rec['备注'] }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 历史来信 Tab (匹配老平台可展开列表样式) -->
              <div v-if="activeTab === 'history'" class="history-letters-list" id="history-letters-container">
                <div v-if="loadingHistory" class="placeholder-text">
                  <i class="fas fa-spinner fa-spin"></i> 加载中...
                </div>
                <div v-else-if="!historyLetters.length" class="placeholder-text">
                  <i class="fas fa-info-circle mr-1"></i>该群众暂无历史来信
                </div>
                <div v-else>
                  <div v-for="(letter, idx) in historyLetters" :key="idx" class="history-letter-item" :data-letter-number="letter['信件编号']">
                    <div class="history-letter-header">
                      <span class="history-letter-number">{{ letter['信件编号'] || '-' }}</span>
                      <span class="history-letter-time">{{ formatTime(letter['来信时间']) }}</span>
                    </div>
                    <span class="history-letter-status">{{ letter['当前信件状态'] || letter['信件状态'] || '-' }}</span>
                    <div class="history-letter-category">{{ [letter['信件一级分类'],letter['信件二级分类'],letter['信件三级分类']].filter(Boolean).join(' / ') || '-' }}</div>
                    <div class="history-letter-content">{{ letter['诉求内容'] || '' }}</div>
                  </div>
                </div>
              </div>

              <!-- 信件处理 Tab (匹配老平台两步流程区段) -->
              <div v-if="activeTab === 'handle'" class="handle-content">
                <!-- 处理建议区段 (联系群众) -->
                <div class="content-section section-letter">
                  <div class="section-title">
                    <i class="fas fa-phone-alt"></i> 联系群众
                  </div>
                  <div class="section-content">
                    <!-- 群众联系方式 -->
                    <div class="contact-info">
                      <div class="contact-item">
                        <span class="contact-label">姓名：</span>
                        <span class="contact-value">{{ selectedLetter['群众姓名'] || '-' }}</span>
                      </div>
                      <div class="contact-item">
                        <span class="contact-label">手机号：</span>
                        <span class="contact-value">{{ selectedLetter['手机号'] || '-' }}</span>
                      </div>
                      <div v-if="selectedLetter['身份证号']" class="contact-item">
                        <span class="contact-label">身份证号：</span>
                        <span class="contact-value">{{ selectedLetter['身份证号'] }}</span>
                      </div>
                    </div>
                    <!-- 上传通话录音 -->
                    <div class="upload-area">
                      <div class="upload-label">上传通话录音</div>
                      <div
                        class="wp-upload-zone"
                        @dragover.prevent
                        @drop.prevent="handleFileDrop($event, 'recording')"
                        @click="$refs.recordingInput.click()"
                      >
                        <i class="fas fa-microphone text-2xl mb-2 block"></i>
                        <div class="text-sm">点击或拖拽上传通话录音</div>
                        <div class="text-xs text-gray-400 mt-1">支持 .mp3 .wav .m4a 格式，最多10个文件</div>
                        <input ref="recordingInput" type="file" accept=".mp3,.wav,.m4a" class="hidden" multiple @change="handleFileSelect($event, 'recording')" />
                      </div>
                      <div v-if="recordings.length" class="mt-2">
                        <div class="file-list">
                          <div v-for="(f, i) in recordings" :key="i" class="file-item">
                            <i class="fas fa-file-audio text-blue-400"></i>
                            <span class="file-name">{{ f.name }}</span>
                            <span class="file-size">{{ formatFileSize(f.size) }}</span>
                            <button class="file-remove" @click="recordings.splice(i,1)" title="移除"><i class="fas fa-times"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- 处理步骤指示器 -->
                    <div class="handle-steps">
                      <div class="steps-indicator">
                        <div class="step-item active">
                          <div class="step-circle"><i class="fas fa-phone-alt"></i></div>
                          <span class="step-label">联系群众</span>
                        </div>
                        <div class="step-arrow"><i class="fas fa-chevron-right"></i></div>
                        <div class="step-item">
                          <div class="step-circle"><i class="fas fa-check"></i></div>
                          <span class="step-label">处理完成</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 处理操作区段 -->
                <div class="content-section section-flow">
                  <div class="section-title">
                    <i class="fas fa-tasks"></i> 处理操作
                  </div>
                  <div class="section-content">
                    <!-- 处理倒计时 -->
                    <div class="countdown-banner" :class="processingExpired ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'">
                      <div class="flex items-center gap-2">
                        <i class="fas fa-hourglass-half" :class="processingExpired ? 'text-red-500' : 'text-blue-500'"></i>
                        <span class="text-sm font-medium" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">处理倒计时</span>
                        <span class="ml-auto text-sm font-bold" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">{{ countdownTimerStr || '-' }}</span>
                      </div>
                      <div class="text-xs text-gray-600 mt-1">
                        <span v-if="processingExpired" class="font-medium">处理已超时，请尽快完成处理！</span>
                        <span v-else>请在30分钟内完成群众联系和处理反馈</span>
                      </div>
                    </div>
                    <!-- 处理反馈 -->
                    <div class="feedback-area">
                      <div class="flex items-center justify-between mb-2">
                        <label class="text-sm font-medium text-gray-700">处理反馈</label>
                        <span class="text-xs text-gray-500">{{ remark.length }}/1000 字符</span>
                      </div>
                      <textarea
                        class="wp-input text-sm resize-none"
                        rows="5"
                        v-model="remark"
                        placeholder="请输入处理反馈内容，包括：&#10;1. 与群众沟通情况&#10;2. 问题处理进展&#10;3. 解决方案或建议&#10;4. 其他需要说明的事项"
                        maxlength="1000"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom action bar (matching old platform) -->
          <div class="detail-bottom">
            <div class="bottom-row controls-row">
              <!-- Category dropdown (searchable) -->
              <div class="searchable-select" :class="{ active: categoryDropdownOpen }" id="category-select-container">
                <div class="select-input-wrapper" @click="toggleCategoryDropdown">
                  <input type="text" class="select-input" id="category-select-input"
                    :value="selectedCategory"
                    placeholder="选择信件分类..." readonly>
                  <i class="fas fa-chevron-down select-arrow"></i>
                </div>
                <div class="select-dropdown" v-show="categoryDropdownOpen">
                  <div class="select-search">
                    <input type="text" class="search-input" id="category-search"
                      v-model="categorySearch" @input="filterCategories"
                      placeholder="搜索分类..." @click.stop>
                  </div>
                  <div class="select-options" id="category-select-options">
                    <div v-for="cat in filteredCategories" :key="cat['三级分类']"
                      class="select-option"
                      :class="{ selected: selectedCategory === cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }"
                      @click="selectCategory(cat)"
                    >{{ cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }}</div>
                    <div v-if="filteredCategories.length === 0" class="select-option disabled text-gray-400">无匹配分类</div>
                  </div>
                </div>
              </div>

              <!-- Remark button -->
              <button class="remark-btn" id="btn-remark" @click="showRemarkModal = true" title="添加备注">
                <i class="fas fa-comment-alt"></i>
                <span>备注</span>
              </button>

              <!-- Action buttons -->
              <button class="action-btn return" id="btn-return" @click="handleReturn" title="退回信件">
                <i class="fas fa-undo"></i>
                <span>退回</span>
              </button>
              <button class="action-btn invalid" id="btn-invalid" @click="handleInvalid" title="标记为不属实">
                <i class="fas fa-times-circle"></i>
                <span>不属实</span>
              </button>
              <button class="action-btn submit" id="btn-submit" @click="handleSubmitFromBar" title="提交处理">
                <i class="fas fa-check-circle"></i>
                <span>提交</span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Remark modal -->
  <div class="modal-overlay" id="remark-modal" :style="{ display: showRemarkModal ? 'flex' : 'none' }" @click.self="showRemarkModal = false">
    <div class="modal-container remark-modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-comment-alt"></i>
          请填写处理备注：
        </h3>
        <button class="modal-close" @click="showRemarkModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <textarea class="form-textarea remark-textarea" id="remark-textarea"
          v-model="remarkText"
          placeholder="请输入处理备注..."
          rows="6"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showRemarkModal = false">取消</button>
        <button class="btn btn-primary" @click="saveRemark">
          <i class="fas fa-save"></i>
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { getProcessingList, getDetail, submitProcessing, returnLetter, markInvalid, analyzeLetter, getCategories, getByIdcard } from '@/api/letter'
import { normalizeFlowRecords } from '@/utils/flow'
import StatusBadge from '@/components/StatusBadge.vue'

const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const recordings = ref([])
const remark = ref('')
const activeTab = ref('flow')
const loadingFlow = ref(false)
const loadingHistory = ref(false)
const historyLetters = ref([])

// Bottom action bar state
const selectedCategory = ref('')
const categoryDropdownOpen = ref(false)
const categorySearch = ref('')
const showRemarkModal = ref(false)
const remarkText = ref('')
const categories = ref([])

// Processing 30-minute countdown
const processingStartTime = ref(null)
const countdownTimerStr = ref('')
const processingExpired = ref(false)
let processingTimer = null

const filteredCategories = computed(() => {
  if (!categorySearch.value) return categories.value
  const q = categorySearch.value.toLowerCase()
  return categories.value.filter(cat =>
    (cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类']).toLowerCase().includes(q)
  )
})

// AI state
const aiAnalyzing = ref(false)
const aiResult = ref(null)

let pollTimer = null

const tabs = [
  { id: 'flow', label: '流转记录' },
  { id: 'history', label: '历史来信' },
  { id: 'handle', label: '信件处理' },
]

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

// ──── Detail loading ────
const formatFileSize = (bytes) => {
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const urgencyBadgeClass = (u) => {
  const val = parseInt(u)
  if (isNaN(val)) return 'bg-gray-100 text-gray-500'
  if (val >= 4) return 'bg-red-100 text-red-600'
  if (val >= 3) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
}

const selectLetter = async (letter) => {
  selectedLetter.value = letter
  remark.value = ''
  recordings.value = []
  activeTab.value = 'flow'
  // Reset tab-related state
  historyLetters.value = []
  // Fetch detail for flow records
  await loadFlowRecords(letter['信件编号'])
  // Fetch history letters
  await loadHistoryLetters(letter['手机号'] || letter['身份证号'])
  // Start 30-minute processing countdown
  startProcessingCountdown()
}

const startProcessingCountdown = () => {
  // Find the "自行处理" (handle_by_self) time from flow records
  const records = selectedLetter.value?.['流转记录'] || []
  let startTime = null
  for (const rec of records) {
    if (rec['操作类型'] === '自行处理') {
      startTime = rec['操作时间']
      break
    }
  }
  // Fallback: use the letter's updated_at or the most recent flow record time
  if (!startTime && selectedLetter.value?.['处理开始时间']) {
    startTime = selectedLetter.value['处理开始时间']
  }
  // Fallback: parse from updated_at field (which matches 自行处理 time)
  if (!startTime && selectedLetter.value?.['更新时间']) {
    startTime = selectedLetter.value['更新时间']
  }
  
  // If we found a start time from flow, calculate deadline = start + 30min
  if (startTime) {
    const deadlineMs = new Date(startTime).getTime() + 30 * 60 * 1000
    const remaining = deadlineMs - Date.now()
    if (remaining <= 0) {
      countdownTimerStr.value = '已超时'
      processingExpired.value = true
      return
    }
    // Use a timer that references the fixed deadline
    processingStartTime.value = 'flow:' + startTime
    processingExpired.value = false
    const updateFromDeadline = () => {
      const remain = deadlineMs - Date.now()
      if (remain <= 0) {
        countdownTimerStr.value = '已超时'
        processingExpired.value = true
        if (processingTimer) {
          clearInterval(processingTimer)
          processingTimer = null
        }
        return
      }
      const minutes = Math.floor(remain / 60000)
      const seconds = Math.floor((remain % 60000) / 1000)
      countdownTimerStr.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    updateFromDeadline()
    if (processingTimer) clearInterval(processingTimer)
    processingTimer = setInterval(updateFromDeadline, 1000)
    return
  }
  
  // No dispatch time found — fall back to fresh 30-min timer
  processingStartTime.value = Date.now()
  processingExpired.value = false
  updateCountdownDisplay()
  if (processingTimer) clearInterval(processingTimer)
  processingTimer = setInterval(updateCountdownDisplay, 1000)
}

const updateCountdownDisplay = () => {
  if (!processingStartTime.value) {
    countdownTimerStr.value = ''
    return
  }
  const elapsed = Date.now() - processingStartTime.value
  const remaining = 30 * 60 * 1000 - elapsed
  if (remaining <= 0) {
    countdownTimerStr.value = '已超时'
    processingExpired.value = true
    if (processingTimer) {
      clearInterval(processingTimer)
      processingTimer = null
    }
    return
  }
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  countdownTimerStr.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

const loadFlowRecords = async (letterNo) => {
  if (!letterNo) return
  loadingFlow.value = true
  try {
    const res = await getDetail(letterNo)
    const records = res?.data?.flow?.flow_records
    if (Array.isArray(records) && records.length > 0) {
      selectedLetter.value['流转记录'] = normalizeFlowRecords(records)
    } else {
      selectedLetter.value['流转记录'] = []
    }
  } catch (e) {
    console.error('Failed to fetch flow records:', e)
    selectedLetter.value['流转记录'] = []
  }
  loadingFlow.value = false
}

const loadHistoryLetters = async (idCard) => {
  if (!idCard) {
    historyLetters.value = []
    return
  }
  loadingHistory.value = true
  try {
    const res = await getByIdcard({ id_card: idCard })
    if (res.success && Array.isArray(res.data)) {
      // Filter out current letter and map fields
      const currentNo = selectedLetter.value?.['信件编号']
      historyLetters.value = res.data
        .filter(item => item.letter_no !== currentNo)
        .map(item => ({
          '信件编号': item.letter_no,
          '群众姓名': item.citizen_name,
          '手机号': item.phone,
          '身份证号': item.id_card,
          '诉求内容': item.content,
          '来信时间': item.received_at,
          '信件一级分类': item.category_l1,
          '信件二级分类': item.category_l2,
          '信件三级分类': item.category_l3,
          '信件状态': item.current_status,
          '当前信件状态': item.current_status,
        }))
    } else {
      historyLetters.value = []
    }
  } catch (e) {
    console.error('Failed to fetch history letters:', e)
    historyLetters.value = []
  }
  loadingHistory.value = false
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

const runAIAnalysis = async () => {
  if (!selectedLetter.value) return
  aiAnalyzing.value = true
  aiResult.value = null
  try {
    const res = await analyzeLetter({ letter_no: selectedLetter.value['信件编号'] })
    aiResult.value = res.success ? res.data : { _error: true, message: res.message || '分析失败' }
  } catch {
    aiResult.value = { _error: true, message: '网络错误' }
  }
  aiAnalyzing.value = false
}

const handleInvalid = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认标记此信件为无效？')) return
  try {
    await markInvalid({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

// Bottom action bar methods
const loadCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      categories.value = flattenCategories(res.data || [])
    }
  } catch {}
}

const toggleCategoryDropdown = () => {
  categoryDropdownOpen.value = !categoryDropdownOpen.value
  if (categoryDropdownOpen.value) {
    categorySearch.value = ''
  }
}

// Flatten the category tree (name/children) into flat objects (一级分类/二级分类/三级分类)
const flattenCategories = (cats, level1 = '', level2 = '') => {
  const result = []
  for (const cat of cats) {
    if (cat.children && cat.children.length > 0) {
      if (!level1) {
        // Top level — recurse with this as level1
        result.push(...flattenCategories(cat.children, cat.name, ''))
      } else if (!level2) {
        // Second level — recurse with this as level2
        result.push(...flattenCategories(cat.children, level1, cat.name))
      }
    } else {
      // Leaf node — create flat object
      result.push({
        '一级分类': level1,
        '二级分类': level2 || '',
        '三级分类': cat.name,
      })
    }
  }
  // If a 2nd-level node has no children, add it directly
  if (cats.length > 0 && !cats[0].children) {
    result.push(...cats.map(c => ({
      '一级分类': level1 || c.name,
      '二级分类': level2,
      '三级分类': c.name,
    })))
  }
  return result
}

const filterCategories = () => {
  // computed handles filtering
}

const selectCategory = (cat) => {
  selectedCategory.value = `${cat['一级分类']} / ${cat['二级分类']} / ${cat['三级分类']}`
  categoryDropdownOpen.value = false
  
  // Update letter info
  if (selectedLetter.value) {
    selectedLetter.value['信件一级分类'] = cat['一级分类']
    selectedLetter.value['信件二级分类'] = cat['二级分类']
    selectedLetter.value['信件三级分类'] = cat['三级分类']
  }
}

const saveRemark = () => {
  if (remarkText.value.trim()) {
    remark.value = remarkText.value
  }
  showRemarkModal.value = false
}

const handleSubmitFromBar = async () => {
  await handleSubmit()
}

// Close category dropdown on click outside
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const container = document.getElementById('category-select-container')
    if (container && !container.contains(e.target)) {
      categoryDropdownOpen.value = false
    }
  })
}

// Auto-load data when switching tabs
watch(activeTab, async (newTab) => {
  if (!selectedLetter.value) return
  if (newTab === 'flow') {
    await loadFlowRecords(selectedLetter.value['信件编号'])
  } else if (newTab === 'history') {
    const idCard = selectedLetter.value['手机号'] || selectedLetter.value['身份证号']
    if (!historyLetters.value.length && idCard) {
      await loadHistoryLetters(idCard)
    }
  }
})

const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getProcessingList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(letter => {
        // Map backend fields (English) to frontend field names (Chinese)
        const mapped = {
          '信件编号': letter.letter_no,
          '群众姓名': letter.citizen_name,
          '手机号': letter.phone,
          '身份证号': letter.id_card,
          '诉求内容': letter.content,
          '信件一级分类': letter.category_l1,
          '信件二级分类': letter.category_l2,
          '信件三级分类': letter.category_l3,
          '信件状态': letter.current_status,
          '来信时间': letter.received_at,
          '当前信件处理单位': letter.current_unit,
          '紧急程度': letter.urgency_level,
          '截止时间': letter.deadline,
          '来源': letter.source || letter.channel || '局长信箱',
          '更新时间': letter.updated_at,
          // Keep original object for debugging
          _raw: letter
        }
        dict[mapped['信件编号']] = mapped
      })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

onMounted(async () => {
  await loadData()
  await loadCategories()
  // Auto-select first letter
  const lettersList = Object.values(letters.value)
  if (lettersList.length > 0) {
    await selectLetter(lettersList[0])
  }
  pollTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (processingTimer) clearInterval(processingTimer)
})
</script>
