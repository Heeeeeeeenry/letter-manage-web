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
          <div class="text-xs text-gray-400 mt-0.5">待下发信件处理</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">待下发：</span>
        <span class="wp-badge wp-badge-yellow font-bold">{{ Object.keys(letters).length }}</span>
      </div>
    </div>

    <!-- Split layout -->
    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- Left: letter list -->
      <div class="wp-panel flex flex-col" style="width:320px;flex-shrink:0" id="letter-list-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold text-gray-700">信件列表</span>
          <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadData">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingList }"></i>
          </button>
        </div>
        <div class="wp-scroll">
          <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
          </div>
          <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>
            暂无待下发信件
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
            <div class="text-sm font-medium text-gray-800">{{ letter['群众姓名'] }}</div>
            <div class="text-xs text-gray-500 mt-1 truncate">{{ letter['诉求内容'] }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(letter['来信时间']) }}</div>
          </div>
        </div>
      </div>

      <!-- Right: detail panel -->
      <div class="wp-panel flex-1 flex flex-col overflow-hidden" id="letter-detail-panel" :style="{ opacity: selectedLetter ? '1' : '0.6' }">
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            请从左侧选择信件
          </div>
        </div>

        <template v-else>
          <div class="wp-panel-header compact">
            <div class="text-sm font-semibold text-gray-700">信件信息</div>
            <div class="flex gap-2">
              <button class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="handleInvalid">
                <i class="fas fa-ban"></i>标记无效
              </button>
              <button class="wp-btn wp-btn-success text-xs py-1 px-2" @click="handleDispatch">
                <i class="fas fa-paper-plane"></i>下发
              </button>
            </div>
          </div>

          <div class="wp-scroll p-4 space-y-4">
            <!-- Basic info (editable) -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">来信人</label>
                <input class="wp-input text-sm" v-model="form.name" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">手机号</label>
                <input class="wp-input text-sm" v-model="form.phone" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">身份证号</label>
                <input class="wp-input text-sm" v-model="form.idcard" />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">来信时间</label>
                <input class="wp-input text-sm" v-model="form.time" />
              </div>
            </div>

            <!-- Content -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">诉求内容</label>
              <textarea class="wp-input text-sm resize-none" rows="4" v-model="form.content"></textarea>
            </div>

            <!-- Category -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">信件分类</label>
              <select class="wp-select text-sm" v-model="form.category" @change="onCategoryChange">
                <option value="">请选择分类</option>
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>

            <!-- Dispatch unit -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">下发单位</label>
              <select class="wp-select text-sm" v-model="form.unit">
                <option value="">请选择下发单位</option>
                <option v-for="unit in units" :key="unit.value" :value="unit.value">{{ unit.label }}</option>
              </select>
            </div>

            <!-- Notes -->
            <div>
              <label class="text-xs text-gray-500 mb-1 block">下发备注</label>
              <textarea class="wp-input text-sm resize-none" rows="3" v-model="form.notes" placeholder="请输入下发备注..."></textarea>
            </div>

            <!-- Flow records -->
            <div>
              <div class="text-sm font-medium text-gray-700 mb-3">流转记录</div>
              <div v-if="!flowRecords.length" class="text-xs text-gray-400">暂无流转记录</div>
              <div v-else class="wp-timeline">
                <div v-for="(rec, idx) in flowRecords" :key="idx" class="wp-timeline-item">
                  <div class="wp-timeline-dot"></div>
                  <div class="text-sm">
                    <span class="font-medium text-gray-800">{{ rec['操作类型'] }}</span>
                    <span class="text-gray-400 text-xs ml-2">{{ rec['操作人'] }}</span>
                    <span class="text-gray-300 text-xs ml-2">{{ formatTime(rec['操作时间']) }}</span>
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
      <div class="wp-modal" style="max-width:480px">
        <div class="text-lg font-bold text-gray-800 mb-4">确认下发</div>
        <p class="text-sm text-gray-600 mb-2">确认将信件 <span class="font-mono text-blue-600">{{ selectedLetter?.['信件编号'] }}</span> 下发到：</p>
        <p class="font-medium text-gray-800 mb-6">{{ form.unit || '（未选择单位）' }}</p>
        <div class="flex gap-3 justify-end">
          <button class="wp-btn wp-btn-secondary" @click="showDispatchModal = false">取消</button>
          <button class="wp-btn wp-btn-primary" :disabled="submitting" @click="confirmDispatch">
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
            确认下发
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getDispatchList, dispatch, markInvalid, getCategories } from '@/api/letter'
import { getOrgList } from '@/api/setting'
import StatusBadge from '@/components/StatusBadge.vue'

const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const showDispatchModal = ref(false)
const categories = ref([])
const units = ref([])
let pollTimer = null

const form = ref({
  name: '', phone: '', idcard: '', time: '', content: '',
  category: '', unit: '', notes: '请接收单位认真处理用户诉求，及时回复。',
})

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const selectLetter = (letter) => {
  selectedLetter.value = letter
  form.value = {
    name: letter['群众姓名'] || '',
    phone: letter['手机号'] || '',
    idcard: letter['身份证号'] || '',
    time: letter['来信时间'] || '',
    content: letter['诉求内容'] || '',
    category: `${letter['信件一级分类'] || ''} / ${letter['信件二级分类'] || ''} / ${letter['信件三级分类'] || ''}`,
    unit: '',
    notes: '请接收单位认真处理用户诉求，及时回复。',
  }
}

const onCategoryChange = () => {}

const handleInvalid = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认标记此信件为无效？')) return
  try {
    await markInvalid({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

const handleDispatch = () => {
  if (!form.value.unit) {
    alert('请先选择下发单位')
    return
  }
  showDispatchModal.value = true
}

const confirmDispatch = async () => {
  submitting.value = true
  try {
    const parts = form.value.category.split(' / ')
    await dispatch({
      letter_no: selectedLetter.value['信件编号'],
      dispatch_unit: form.value.unit,
      notes: form.value.notes,
      群众姓名: form.value.name,
      手机号: form.value.phone,
      身份证号: form.value.idcard,
      来信时间: form.value.time,
      诉求内容: form.value.content,
      信件一级分类: parts[0]?.trim() || '',
      信件二级分类: parts[1]?.trim() || '',
      信件三级分类: parts[2]?.trim() || '',
    })
    showDispatchModal.value = false
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getDispatchList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(l => { dict[l['信件编号']] = l })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

const loadCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      const data = res.data || {}
      const opts = []
      for (const l1 in data) {
        for (const l2 in data[l1]) {
          for (const l3 of (data[l1][l2] || [])) {
            opts.push({ value: `${l1} / ${l2} / ${l3}`, label: `${l1} / ${l2} / ${l3}` })
          }
        }
      }
      categories.value = opts
    }
  } catch {}
}

const loadUnits = async () => {
  try {
    const res = await getOrgList({})
    if (res.success) {
      const list = res.data || []
      units.value = list.map(u => {
        const label = [u['一级'], u['二级'], u['三级']].filter(Boolean).join(' / ')
        return { value: label, label }
      })
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadData(), loadCategories(), loadUnits()])
  pollTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
