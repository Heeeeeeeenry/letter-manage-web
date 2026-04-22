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
      <span class="wp-badge wp-badge-purple font-bold">{{ Object.keys(letters).length }} 件待核查</span>
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
          <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>暂无待核查信件
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
              <button class="wp-btn wp-btn-danger text-xs py-1 px-2" :disabled="submitting" @click="handleReject">
                <i class="fas fa-times"></i>不通过
              </button>
              <button class="wp-btn wp-btn-success text-xs py-1 px-2" :disabled="submitting" @click="handleApprove">
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
                    <div v-if="rec['备注']" class="text-xs text-gray-500 mt-1">{{ rec['备注'] }}</div>
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
import { getAuditList, auditApprove, auditReject } from '@/api/letter'
import StatusBadge from '@/components/StatusBadge.vue'

const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const auditComment = ref('')
let pollTimer = null

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const selectLetter = (letter) => {
  selectedLetter.value = letter
  auditComment.value = ''
}

const handleApprove = async () => {
  if (!selectedLetter.value) return
  submitting.value = true
  try {
    await auditApprove({ letter_no: selectedLetter.value['信件编号'], comment: auditComment.value })
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

const handleReject = async () => {
  if (!selectedLetter.value) return
  if (!auditComment.value.trim()) { alert('请填写不通过原因'); return }
  submitting.value = true
  try {
    await auditReject({ letter_no: selectedLetter.value['信件编号'], comment: auditComment.value })
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getAuditList({})
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
  pollTimer = setInterval(loadData, 5000)
})
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>
