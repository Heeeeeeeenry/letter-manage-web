<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="wp-header" id="dispatch-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#fef9c3,#fef08a)">
          <i class="fas fa-paper-plane text-yellow-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">下发工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">待下发信件处理与AI智能分析</div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="wp-btn wp-btn-primary text-xs py-1 px-3" @click="autoDispatchAll" :disabled="autoDispatchingAll || Object.keys(letters).length === 0">
          <i class="fas fa-robot" :class="{ 'fa-spin': autoDispatchingAll }"></i>
          {{ autoDispatchingAll ? '自动下发中...' : '全部自动下发' }}
        </button>
        <span class="text-sm text-gray-500">待下发：</span>
        <span class="wp-badge wp-badge-yellow font-bold">{{ Object.keys(letters).length }}</span>
      </div>
    </div>

    <!-- Split layout -->
    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- Left: letter list -->
      <div class="wp-panel flex flex-col" style="width:340px;flex-shrink:0" id="letter-list-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold text-gray-700">信件列表</span>
          <div class="flex gap-2">
            <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadData" :title="'刷新列表'">
              <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingList }"></i>
            </button>
          </div>
        </div>
        <div class="wp-scroll">
          <!-- Loading state -->
          <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
          </div>
          <!-- Empty state -->
          <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>
            暂无待下发信件
          </div>
          <!-- Letter cards -->
          <div
            v-for="letter in sortedLetters"
            :key="letter['信件编号']"
            class="wp-list-item"
            :class="{ active: selectedLetter?.['信件编号'] === letter['信件编号'] }"
            @click="selectLetter(letter)"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-mono text-blue-600 font-medium">{{ letter['信件编号'] }}</span>
              <StatusBadge :status="letter['信件状态']" />
            </div>
            <div class="flex items-center gap-2 mb-1">
              <i class="fas fa-user text-gray-400 text-xs"></i>
              <span class="text-sm font-medium text-gray-800">{{ letter['群众姓名'] || '匿名' }}</span>
              <span v-if="letter['紧急程度']" class="text-xs px-1.5 py-0.5 rounded"
                :class="urgencyBadgeClass(letter['紧急程度'])">
                {{ letter['紧急程度'] }}
              </span>
            </div>
            <div class="text-xs text-gray-500 mt-1 truncate leading-relaxed">{{ letter['诉求内容'] || '无内容' }}</div>
            <div class="flex items-center justify-between mt-1.5">
              <span class="text-xs text-gray-400">
                <i class="far fa-clock mr-0.5"></i>{{ formatTime(letter['来信时间']) }}
              </span>
              <span v-if="letter['_ai_analyzed']" class="text-xs text-purple-500">
                <i class="fas fa-robot mr-0.5"></i>已分析
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: detail panel -->
      <div class="wp-panel flex-1 flex flex-col overflow-hidden" id="letter-detail-panel">
        <!-- No selection state -->
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            <p class="text-sm">请从左侧选择信件</p>
            <p class="text-xs text-gray-300 mt-1">选中信件后可进行AI分析、下发等操作</p>
          </div>
        </div>

        <template v-else>
          <!-- Detail header with actions -->
          <div class="wp-panel-header compact border-b border-gray-100">
            <div class="flex items-center gap-2">
              <i class="fas fa-envelope text-gray-400"></i>
              <span class="text-sm font-semibold text-gray-700">{{ selectedLetter['信件编号'] }}</span>
              <StatusBadge :status="selectedLetter['信件状态']" />
            </div>
            <div class="flex gap-2">
              <button class="wp-btn text-xs py-1 px-2" :class="aiAnalyzing ? 'wp-btn-disabled' : 'wp-btn-info'"
                @click="runAIAnalysis" :disabled="aiAnalyzing">
                <i class="fas fa-robot" :class="{ 'fa-spin': aiAnalyzing }"></i>
                {{ aiAnalyzing ? '分析中...' : 'AI分析' }}
              </button>
              <button class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="handleInvalid">
                <i class="fas fa-ban"></i>标记无效
              </button>
              <button class="wp-btn wp-btn-primary text-xs py-1 px-2" @click="handleBySelf">
                <i class="fas fa-user-check"></i>由我处理
              </button>
              <button class="wp-btn wp-btn-success text-xs py-1 px-2" @click="handleDispatch">
                <i class="fas fa-paper-plane"></i>下发
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <!-- AI Analysis Results -->
            <div v-if="aiResult" class="mx-4 mt-4 p-3 rounded-lg border"
              :class="aiResult._error ? 'border-red-200 bg-red-50' : 'border-purple-200 bg-purple-50'">
              <div class="flex items-center gap-2 mb-2">
                <i class="fas fa-robot text-purple-500"></i>
                <span class="text-xs font-semibold text-purple-700">AI分析结果</span>
                <button class="ml-auto text-gray-400 hover:text-gray-600 text-xs" @click="aiResult = null">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <template v-if="!aiResult._error">
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div><span class="text-gray-500">摘要：</span><span class="text-gray-700">{{ aiResult.summary || '-' }}</span></div>
                  <div><span class="text-gray-500">情绪：</span>
                    <span class="px-1.5 py-0.5 rounded" :class="sentimentBadge(aiResult.sentiment)">{{ aiResult.sentiment || '-' }}</span>
                  </div>
                  <div><span class="text-gray-500">建议分类：</span><span class="text-gray-700">{{ aiResult.suggested_category_l1 || '-' }} / {{ aiResult.suggested_category_l2 || '-' }} / {{ aiResult.suggested_category_l3 || '-' }}</span></div>
                  <div><span class="text-gray-500">建议下发：</span><span class="text-blue-600 font-medium">{{ aiResult.suggested_unit || '-' }}</span></div>
                  <div><span class="text-gray-500">紧急程度：</span>
                    <span class="px-1.5 py-0.5 rounded" :class="urgencyBadgeClass(aiResult.urgency)">{{ aiResult.urgency ? aiResult.urgency + '/5' : '-' }}</span>
                  </div>
                  <div class="col-span-2"><span class="text-gray-500">建议理由：</span><span class="text-gray-600">{{ aiResult.reason || '-' }}</span></div>
                </div>
                <div class="mt-2 flex gap-2">
                  <button class="wp-btn wp-btn-success text-xs py-1 px-2" @click="applyAISuggestions">
                    <i class="fas fa-check mr-1"></i>采纳建议
                  </button>
                  <button class="wp-btn wp-btn-primary text-xs py-1 px-2" @click="autoDispatchSingle(selectedLetter)">
                    <i class="fas fa-robot mr-1"></i>AI自动下发
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="text-xs text-red-600">{{ aiResult._error }}</div>
              </template>
            </div>

            <!-- Letter detail form -->
            <div class="p-4 space-y-4">
              <!-- Basic info -->
              <div class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">
                    <i class="fas fa-user mr-1"></i>来信人
                  </label>
                  <input class="wp-input text-sm" v-model="form.name" placeholder="群众姓名" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">
                    <i class="fas fa-phone mr-1"></i>手机号
                  </label>
                  <input class="wp-input text-sm" v-model="form.phone" placeholder="手机号" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">
                    <i class="fas fa-id-card mr-1"></i>身份证号
                  </label>
                  <input class="wp-input text-sm" v-model="form.idcard" placeholder="身份证号" />
                </div>
                <div>
                  <label class="text-xs text-gray-500 mb-1 block">
                    <i class="far fa-calendar mr-1"></i>来信时间
                  </label>
                  <input class="wp-input text-sm" v-model="form.time" />
                </div>
              </div>

              <!-- Content -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">
                  <i class="fas fa-align-left mr-1"></i>诉求内容
                </label>
                <textarea class="wp-input text-sm resize-none" rows="4" v-model="form.content"
                  placeholder="请输入诉求内容..."></textarea>
              </div>

              <!-- Category 3-level cascade -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">
                  <i class="fas fa-tags mr-1"></i>信件分类
                </label>
                <div class="flex gap-2">
                  <select class="wp-select text-sm flex-1" v-model="form.categoryL1" @change="onCategoryL1Change">
                    <option value="">一级分类</option>
                    <option v-for="l1 in categoryTree" :key="l1.name" :value="l1.name">{{ l1.name }}</option>
                  </select>
                  <select class="wp-select text-sm flex-1" v-model="form.categoryL2" @change="onCategoryL2Change">
                    <option value="">二级分类</option>
                    <option v-for="l2 in currentL2List" :key="l2.name" :value="l2.name">{{ l2.name }}</option>
                  </select>
                  <select class="wp-select text-sm flex-1" v-model="form.categoryL3">
                    <option value="">三级分类</option>
                    <option v-for="l3 in currentL3List" :key="l3.name" :value="l3.name">{{ l3.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Dispatch unit -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">
                  <i class="fas fa-building mr-1"></i>下发单位
                </label>
                <div class="flex gap-2">
                  <div class="relative flex-1">
                    <!-- 显示选中的单位 -->
                    <div class="wp-input cursor-pointer flex items-center justify-between" @click="showUnitDropdown = !showUnitDropdown">
                      <span class="truncate">{{ form.unit || '请选择下发单位' }}</span>
                      <i class="fas fa-chevron-down text-gray-400 text-sm transition-transform" :class="{ 'rotate-180': showUnitDropdown }"></i>
                    </div>
                    
                    <!-- 下拉面板 -->
                    <div v-if="showUnitDropdown" class="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
                      <!-- 搜索框 -->
                      <div class="p-2 border-b border-gray-100">
                        <div class="relative">
                          <i class="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                          <input 
                            v-model="unitSearchKeyword" 
                            class="wp-input pl-7 text-sm w-full" 
                            placeholder="搜索单位..." 
                            @click.stop
                          />
                        </div>
                      </div>
                      
                      <!-- 单位列表 -->
                      <div class="overflow-y-auto flex-1">
                        <div v-if="filteredDispatchUnits.length === 0" class="text-center py-4 text-gray-400 text-sm">
                          未找到匹配的单位
                        </div>
                        <div 
                          v-else
                          v-for="u in filteredDispatchUnits" 
                          :key="u.system_code || u.id"
                          class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
                          :class="{ 'bg-blue-50 text-blue-600': form.unit === u.fullName }"
                          @click="selectDispatchUnit(u)"
                        >
                          {{ u.fullName }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button v-if="aiResult?.suggested_unit" class="text-xs text-purple-500 hover:text-purple-700"
                    @click="form.unit = matchUnitByName(aiResult.suggested_unit)" title="使用AI建议的单位">
                    <i class="fas fa-magic mr-1"></i>采纳
                  </button>
                </div>
                
                <!-- 点击外部关闭下拉的透明层 -->
                <div v-if="showUnitDropdown" class="fixed inset-0 z-40" @click="showUnitDropdown = false"></div>
              </div>

              <!-- Notes -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">
                  <i class="fas fa-sticky-note mr-1"></i>下发备注
                </label>
                <textarea class="wp-input text-sm resize-none" rows="2" v-model="form.notes"
                  placeholder="请输入下发备注..."></textarea>
              </div>

              <!-- Flow records -->
              <div>
                <div class="flex items-center gap-2 mb-3">
                  <i class="fas fa-exchange-alt text-gray-400"></i>
                  <span class="text-sm font-medium text-gray-700">流转记录</span>
                </div>
                <div v-if="!flowRecords.length" class="text-xs text-gray-400 py-4 text-center">
                  <i class="fas fa-info-circle mr-1"></i>暂无流转记录
                </div>
                <div v-else class="wp-timeline">
                  <div v-for="(rec, idx) in flowRecords" :key="idx" class="wp-timeline-item">
                    <div class="wp-timeline-dot"
                      :class="{ 'bg-blue-400': rec.action === 'dispatch', 'bg-green-400': rec.action === 'process', 'bg-yellow-400': rec.action === 'create', 'bg-red-400': rec.action === 'return', 'bg-gray-400': !['dispatch', 'process', 'create', 'return'].includes(rec.action) }">
                    </div>
                    <div class="text-sm ml-3">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-800">{{ getFlowActionLabel(rec) }}</span>
                        <span class="text-gray-400 text-xs">{{ rec.operator || '-' }}</span>
                        <span class="text-gray-300 text-xs ml-auto">{{ formatTime(rec.timestamp) }}</span>
                      </div>
                      <div v-if="rec.from_unit || rec.to_unit" class="text-xs text-gray-500 mt-0.5">
                        {{ rec.from_unit || '—' }} <i class="fas fa-arrow-right text-gray-300 mx-1"></i> {{ rec.to_unit || '—' }}
                      </div>
                      <div v-if="rec.remark" class="text-xs text-gray-400 mt-0.5 italic">备注：{{ rec.remark }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Confirm dispatch modal -->
    <div v-if="showDispatchModal" class="wp-modal-overlay" @click.self="showDispatchModal = false">
      <div class="wp-modal" style="max-width:500px">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-paper-plane text-yellow-500"></i>
          <span class="text-lg font-bold text-gray-800">确认下发</span>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20">信件编号：</span>
            <span class="font-mono text-blue-600 font-medium">{{ selectedLetter?.['信件编号'] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20">来信人：</span>
            <span>{{ form.name || '-' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20">下发单位：</span>
            <span class="font-medium text-gray-800">{{ form.unit || '（未选择单位）' }}</span>
          </div>
          <div v-if="aiResult?.suggested_unit && form.unit === aiResult.suggested_unit" class="flex items-center gap-2">
            <span class="text-gray-500 w-20"></span>
            <span class="text-xs text-purple-500"><i class="fas fa-robot mr-1"></i>AI建议单位</span>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button class="wp-btn wp-btn-secondary" @click="showDispatchModal = false">取消</button>
          <button class="wp-btn wp-btn-primary" :disabled="submitting" @click="confirmDispatch">
            <i v-if="submitting" class="fas fa-spinner fa-spin mr-1"></i>
            <i v-else class="fas fa-paper-plane mr-1"></i>
            确认下发
          </button>
        </div>
      </div>
    </div>

    <!-- Auto dispatch progress modal -->
    <div v-if="autoDispatchingAll" class="wp-modal-overlay">
      <div class="wp-modal" style="max-width:480px">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-robot text-purple-500 fa-spin"></i>
          <span class="text-lg font-bold text-gray-800">批量自动下发</span>
        </div>
        <div class="space-y-3">
          <div class="bg-purple-50 rounded-lg p-3">
            <div class="text-sm text-purple-700 mb-2">
              正在处理第 {{ autoDispatchProgress.current }} / {{ autoDispatchProgress.total }} 封信件...
            </div>
            <div class="w-full bg-purple-200 rounded-full h-2">
              <div class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: (autoDispatchProgress.total > 0 ? (autoDispatchProgress.current / autoDispatchProgress.total * 100) : 0) + '%' }">
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-500 max-h-24 overflow-y-auto space-y-1">
            <div v-for="(log, idx) in autoDispatchLogs" :key="idx"
              :class="log.success ? 'text-green-600' : 'text-red-500'">
              {{ log.letterNo }}: {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDispatchList, dispatch, markInvalid, getDetail, analyzeLetter, autoDispatch, handleBySelf as handleBySelfApi } from '@/api/letter'
import { getDispatchUnits } from '@/api/setting'
import StatusBadge from '@/components/StatusBadge.vue'

// State
const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const showDispatchModal = ref(false)
let pollTimer = null

// AI state
const aiAnalyzing = ref(false)
const aiResult = ref(null)
const autoDispatchingAll = ref(false)
const autoDispatchProgress = ref({ current: 0, total: 0 })
const autoDispatchLogs = ref([])

// Category tree
const categoryTree = ref([])
const currentL2List = ref([])
const currentL3List = ref([])

// Dispatch units
const dispatchUnits = ref([])
const unitSearchKeyword = ref('')
const showUnitDropdown = ref(false)

// 过滤后的下发单位列表（根据搜索关键词）
const filteredDispatchUnits = computed(() => {
  if (!unitSearchKeyword.value.trim()) {
    return dispatchUnits.value
  }
  const keyword = unitSearchKeyword.value.toLowerCase().trim()
  return dispatchUnits.value.filter(u => {
    // 搜索 fullName 或各个层级
    const fullName = (u.fullName || '').toLowerCase()
    const level1 = (u.level1 || '').toLowerCase()
    const level2 = (u.level2 || '').toLowerCase()
    const level3 = (u.level3 || '').toLowerCase()
    return fullName.includes(keyword) || 
           level1.includes(keyword) || 
           level2.includes(keyword) || 
           level3.includes(keyword)
  })
})

// Form data
const form = ref({
  name: '', phone: '', idcard: '', time: '', content: '',
  categoryL1: '', categoryL2: '', categoryL3: '',
  unit: '', notes: '请接收单位认真处理用户诉求，及时回复。',
})

// Flow records
// Normalize flow records from Chinese/English mixed field names to unified format
const normalizeFlowRecord = (rec) => {
  // Already in English new format
  if (rec.action) {
    return {
      action: rec.action,
      operator: rec.operator || rec.operator_name || '',
      timestamp: rec.timestamp || rec.created_at || '',
      from_unit: rec.from_unit || rec.source_unit || '',
      to_unit: rec.to_unit || rec.target_unit || '',
      remark: typeof rec.remark === 'object' ? JSON.stringify(rec.remark) : (rec.remark || ''),
      operator_id: rec.operator_id || '',
      from_status: rec.from_status || '',
      to_status: rec.to_status || rec.status || '',
    }
  }
  // Chinese old format
  const actionMap = {
    '生成': 'create',
    '自行处理': 'handle_by_self',
    '市局下发': 'dispatch',
    '办案单位反馈': 'feedback',
    '处理': 'process',
    '退回': 'return',
    '审核通过': 'audit_approve',
    '审核驳回': 'audit_reject',
    '标记无效': 'mark_invalid',
  }
  const remarkVal = rec['备注']
  return {
    action: actionMap[rec['操作类型']] || rec['操作类型'] || 'other',
    operator: rec['操作人姓名'] || '',
    timestamp: rec['操作时间'] || '',
    from_unit: rec['操作前单位'] || '',
    to_unit: rec['操作后单位'] || rec['目标单位'] || '',
    remark: typeof remarkVal === 'object' ? JSON.stringify(remarkVal) : (remarkVal || ''),
    operator_id: rec['操作人警号'] || '',
    from_status: rec['操作前状态'] || '',
    to_status: rec['操作后状态'] || '',
  }
}

const flowRecords = computed(() => {
  const raw = selectedLetter.value?.['流转记录'] || selectedLetter.value?._raw?.flow_records || []
  if (typeof raw === 'string') {
    try { return JSON.parse(raw).map(normalizeFlowRecord) } catch { return [] }
  }
  return Array.isArray(raw) ? raw.map(normalizeFlowRecord) : []
})

// Sorted letters (newest first)
const sortedLetters = computed(() => {
  return Object.values(letters.value).sort((a, b) => {
    return (b['来信时间'] || '').localeCompare(a['来信时间'] || '')
  })
})

// Helpers
const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const getFlowActionLabel = (rec) => {
  const labels = {
    'create': '创建信件',
    'dispatch': '下发',
    'handle_by_self': '自行处理',
    'feedback': '办案单位反馈',
    'process': '处理',
    'return': '退回',
    'audit_approve': '审核通过',
    'audit_reject': '审核驳回',
    'mark_invalid': '标记无效',
  }
  return labels[rec.action] || rec.action || '操作'
}

const getFlowDotClass = (rec) => {
  const dotMap = {
    'create': 'bg-blue-500',
    'dispatch': 'bg-orange-500',
    'handle_by_self': 'bg-green-500',
    'feedback': 'bg-purple-500',
    'process': 'bg-teal-500',
    'return': 'bg-red-500',
    'audit_approve': 'bg-green-500',
    'audit_reject': 'bg-red-500',
    'mark_invalid': 'bg-gray-500',
  }
  return dotMap[rec.action] || 'bg-gray-400'
}

const sentimentBadge = (s) => {
  const map = {
    '积极': 'bg-green-100 text-green-700',
    '中性': 'bg-gray-100 text-gray-700',
    '消极': 'bg-yellow-100 text-yellow-700',
    '紧急': 'bg-red-100 text-red-700',
  }
  return map[s] || 'bg-gray-100 text-gray-700'
}

const urgencyBadgeClass = (u) => {
  const val = parseInt(u)
  if (isNaN(val)) return 'bg-gray-100 text-gray-500'
  if (val >= 4) return 'bg-red-100 text-red-600'
  if (val >= 3) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
}

// Category cascade
const onCategoryL1Change = () => {
  form.value.categoryL2 = ''
  form.value.categoryL3 = ''
  const l1 = categoryTree.value.find(c => c.name === form.value.categoryL1)
  currentL2List.value = l1?.children || []
  currentL3List.value = []
}

const onCategoryL2Change = () => {
  form.value.categoryL3 = ''
  const l2 = currentL2List.value.find(c => c.name === form.value.categoryL2)
  currentL3List.value = l2?.children || []
}

// Select letter
const selectLetter = async (letter) => {
  selectedLetter.value = letter
  aiResult.value = null

  // Load full detail for flow records
  try {
    const res = await getDetail(letter['信件编号'])
    if (res.success && res.data) {
      const raw = res.data.letter || res.data
      const flow = res.data.flow?.flow_records || res.data.flow_records || []
      letter._raw = { ...(letter._raw || {}), ...raw, flow_records: flow }
    }
  } catch {}

  form.value = {
    name: letter['群众姓名'] || '',
    phone: letter['手机号'] || '',
    idcard: letter['身份证号'] || '',
    time: letter['来信时间'] || '',
    content: letter['诉求内容'] || '',
    categoryL1: letter['信件一级分类'] || '',
    categoryL2: letter['信件二级分类'] || '',
    categoryL3: letter['信件三级分类'] || '',
    unit: '',
    notes: '请接收单位认真处理用户诉求，及时回复。',
  }
  // 重置单位搜索状态
  unitSearchKeyword.value = ''
  showUnitDropdown.value = false
  // Sync category cascade
  onCategoryL1Change()
  form.value.categoryL2 = letter['信件二级分类'] || ''
  onCategoryL2Change()
  form.value.categoryL3 = letter['信件三级分类'] || ''
}

// AI Analysis
const runAIAnalysis = async () => {
  if (!selectedLetter.value) return
  aiAnalyzing.value = true
  aiResult.value = null
  try {
    const res = await analyzeLetter(selectedLetter.value['信件编号'])
    if (res.success) {
      aiResult.value = res.data
      selectedLetter.value['_ai_analyzed'] = true
      // 自动填充AI建议到表单
      applyAISuggestions()
    } else {
      aiResult.value = { _error: res.error || 'AI分析失败' }
    }
  } catch (e) {
    aiResult.value = { _error: 'AI分析请求失败: ' + (e.message || '未知错误') }
  }
  aiAnalyzing.value = false
}

// 根据 AI 建议的单位名称匹配完整路径
const matchUnitByName = (shortName) => {
  if (!shortName) return ''
  // 1. 精确匹配
  const exact = dispatchUnits.value.find(u => u.fullName === shortName)
  if (exact) return exact.fullName
  // 2. 以 shortName 结尾（如 "民意智感中心" 匹配 "市局 / 民意智感中心"）
  const suffix = dispatchUnits.value.find(u => u.fullName.endsWith(' / ' + shortName))
  if (suffix) return suffix.fullName
  // 3. 包含匹配
  const contain = dispatchUnits.value.find(u => u.fullName.includes(shortName))
  if (contain) return contain.fullName
  // 4. 取最后一个层级匹配
  const last = dispatchUnits.value.find(u => {
    const lastPart = u.fullName.split(' / ').pop()
    return lastPart === shortName
  })
  if (last) return last.fullName
  return shortName
}

// 选择下发单位
const selectDispatchUnit = (unit) => {
  form.value.unit = unit.fullName
  showUnitDropdown.value = false
  unitSearchKeyword.value = '' // 清空搜索关键词
}

// Apply AI suggestions to form
const applyAISuggestions = () => {
  if (!aiResult.value || aiResult.value._error) return
  const r = aiResult.value
  if (r.suggested_category_l1) {
    form.value.categoryL1 = r.suggested_category_l1
    onCategoryL1Change()
    if (r.suggested_category_l2) {
      form.value.categoryL2 = r.suggested_category_l2
      onCategoryL2Change()
      if (r.suggested_category_l3) {
        form.value.categoryL3 = r.suggested_category_l3
      }
    }
  }
  if (r.suggested_unit) {
    form.value.unit = matchUnitByName(r.suggested_unit)
  }
}

// Auto dispatch single letter
const autoDispatchSingle = async (letter) => {
  if (!letter) return
  try {
    await selectLetter(letter)
    const res = await autoDispatch({ letter_no: letter['信件编号'] })
    if (res.success) {
      aiResult.value = res.data
      await loadData()
      selectedLetter.value = null
    } else {
      aiResult.value = { _error: res.error || '自动下发失败' }
    }
  } catch (e) {
    aiResult.value = { _error: '自动下发请求失败: ' + (e.message || '未知错误') }
  }
}

// Auto dispatch all letters
const autoDispatchAll = async () => {
  const list = Object.values(letters.value)
  if (list.length === 0) return

  autoDispatchingAll.value = true
  autoDispatchProgress.value = { current: 0, total: list.length }
  autoDispatchLogs.value = []

  for (const letter of list) {
    try {
      const res = await autoDispatch({ letter_no: letter['信件编号'] })
      autoDispatchLogs.value.push({
        letterNo: letter['信件编号'],
        message: res.success ? `已下发至 ${res.data?.dispatched_to || '目标单位'}` : (res.error || '失败'),
        success: res.success,
      })
    } catch (e) {
      autoDispatchLogs.value.push({
        letterNo: letter['信件编号'],
        message: '请求失败: ' + (e.message || '未知错误'),
        success: false,
      })
    }
    autoDispatchProgress.value.current++
  }

  await loadData()
  selectedLetter.value = null
  autoDispatchingAll.value = false
}

// Handle by self
const handleBySelf = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认由您处理此信件？')) return
  try {
    await handleBySelfApi({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

// Mark invalid
const handleInvalid = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认标记此信件为无效？')) return
  try {
    await markInvalid({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

// Show dispatch modal
const handleDispatch = () => {
  if (!form.value.unit) {
    alert('请先选择下发单位')
    return
  }
  showDispatchModal.value = true
}

// Confirm dispatch
const confirmDispatch = async () => {
  submitting.value = true
  try {
    // 下发单位取最后一级（后端用短名称匹配）
    const shortUnit = form.value.unit.split(' / ').pop()
    await dispatch({
      letter_no: selectedLetter.value['信件编号'],
      target_unit: shortUnit,
      remark: form.value.notes,
      citizen_name: form.value.name,
      phone: form.value.phone,
      id_card: form.value.idcard,
      received_at: form.value.time,
      content: form.value.content,
      category_l1: form.value.categoryL1,
      category_l2: form.value.categoryL2,
      category_l3: form.value.categoryL3,
    })
    showDispatchModal.value = false
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

// Load data
const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getDispatchList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(letter => {
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
          '紧急程度': letter.urgency || '',
          _raw: letter,
        }
        dict[mapped['信件编号']] = mapped
      })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

// Load categories
const loadCategories = async () => {
  try {
    const { getCategories } = await import('@/api/letter')
    const res = await getCategories()
    if (res.success) {
      categoryTree.value = res.data || []
    }
  } catch {}
}

// Load dispatch units
const loadUnits = async () => {
  try {
    const res = await getDispatchUnits()
    if (res.success) {
      const list = res.data || []
      const seen = new Set()
      dispatchUnits.value = []
      list.forEach(u => {
        const parts = [u.level1, u.level2, u.level3].filter(Boolean)
        const fullName = parts.join(' / ')
        if (!seen.has(fullName)) {
          seen.add(fullName)
          dispatchUnits.value.push({ ...u, fullName })
        }
      })
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadData(), loadCategories(), loadUnits()])
  // 自动选中第一条
  if (sortedLetters.value.length > 0) {
    selectLetter(sortedLetters.value[0])
  }
  pollTimer = setInterval(loadData, 10000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
