<template>
  <div class="wp-modal-overlay" @click.self="$emit('close')">
    <div class="wp-modal" style="max-width:720px;width:95%">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="wp-panel-icon"><i class="fas fa-envelope-open text-blue-600"></i></div>
          <div>
            <div class="font-bold text-gray-800 text-lg">信件详情</div>
            <div class="text-xs text-gray-400 font-mono">{{ letterData?.['信件编号'] }}</div>
          </div>
        </div>
        <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400">
        <i class="fas fa-spinner fa-spin text-2xl mb-2 block"></i>加载中...
      </div>

      <div v-else-if="letterData">
        <!-- Tabs -->
        <div class="flex gap-0 border-b border-gray-200 mb-5">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="wp-tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >{{ tab.label }}</button>
        </div>

        <!-- Basic Info Tab -->
        <div v-if="activeTab === 'basic'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <InfoRow label="信件编号" :value="letterData['信件编号']" mono />
            <InfoRow label="来信时间" :value="formatTime(letterData['来信时间'])" />
            <InfoRow label="来信人" :value="letterData['群众姓名']" />
            <InfoRow label="手机号" :value="letterData['手机号']" />
            <InfoRow label="身份证" :value="letterData['身份证号']" />
            <InfoRow label="来源渠道" :value="letterData['来源渠道']" />
            <InfoRow label="信件状态" :custom="true">
              <StatusBadge :status="letterData['信件状态']" />
            </InfoRow>
            <InfoRow label="分类" :value="[letterData['信件一级分类'], letterData['信件二级分类'], letterData['信件三级分类']].filter(Boolean).join(' / ')" />
          </div>
          <div>
            <div class="text-sm font-medium text-gray-600 mb-2">诉求内容</div>
            <div class="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{{ letterData['诉求内容'] }}</div>
          </div>
          <div v-if="letterData['专项关注标签']">
            <div class="text-sm font-medium text-gray-600 mb-2">专项关注</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in parseTags(letterData['专项关注标签'])"
                :key="tag"
                class="wp-badge wp-badge-purple"
              >{{ tag }}</span>
            </div>
          </div>
        </div>

        <!-- Flow records Tab -->
        <div v-if="activeTab === 'flow'">
          <div v-if="!flowRecords.length" class="text-center py-8 text-gray-400">暂无流转记录</div>
          <div v-else class="wp-timeline">
            <div
              v-for="(record, idx) in flowRecords"
              :key="idx"
              class="wp-timeline-item"
            >
              <div class="wp-timeline-dot" :style="{ background: flowDotColor(record['操作类型']) }"></div>
              <div class="bg-gray-50 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-800 text-sm">{{ record['操作类型'] }}</span>
                    <span class="wp-badge wp-badge-blue text-xs">{{ record['操作人'] }}</span>
                  </div>
                  <span class="text-xs text-gray-400">{{ formatTime(record['操作时间']) }}</span>
                </div>
                <div v-if="record['操作单位']" class="text-xs text-gray-500 mb-1">
                  <i class="fas fa-building mr-1"></i>{{ record['操作单位'] }}
                </div>
                <div v-if="record['备注']" class="text-sm text-gray-600 mt-2">
                  <template v-if="isJsonStr(record['备注'])">
                    <div v-for="(val, key) in parseJson(record['备注'])" :key="key" class="text-xs text-gray-500">
                      <span class="font-medium">{{ key }}：</span>{{ formatJsonVal(val) }}
                    </div>
                  </template>
                  <template v-else>{{ record['备注'] }}</template>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachments Tab -->
        <div v-if="activeTab === 'files'">
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-paperclip text-2xl mb-2 block"></i>
            暂无附件
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getDetail } from '@/api/letter'
import StatusBadge from './StatusBadge.vue'
import InfoRow from './InfoRow.vue'

const props = defineProps({ letterNo: String })
const emit = defineEmits(['close'])

const loading = ref(true)
const letterData = ref(null)
const activeTab = ref('basic')

const tabs = [
  { id: 'basic', label: '基本信息' },
  { id: 'flow', label: '流转记录' },
  { id: 'files', label: '附件' },
]

const flowRecords = computed(() => letterData.value?.['流转记录'] || [])

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const parseTags = (tags) => {
  if (!tags) return []
  if (Array.isArray(tags)) return tags
  return tags.split(/[,，/]/).filter(Boolean)
}

const flowDotColor = (type) => {
  if (!type) return '#9ca3af'
  if (type.includes('生成')) return '#3b82f6'
  if (type.includes('下发')) return '#f59e0b'
  if (type.includes('处理')) return '#22c55e'
  if (type.includes('反馈') || type.includes('审核')) return '#8b5cf6'
  if (type.includes('完成')) return '#10b981'
  if (type.includes('无效') || type.includes('驳回')) return '#ef4444'
  return '#6b7280'
}

const isJsonStr = (s) => {
  if (typeof s !== 'string') return false
  try { const v = JSON.parse(s); return typeof v === 'object' && v !== null }
  catch { return false }
}

const parseJson = (s) => {
  try { return JSON.parse(s) } catch { return {} }
}

const formatJsonVal = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean).join(', ') || '-'
  if (val === null || val === undefined) return '-'
  return String(val)
}

const load = async () => {
  loading.value = true
  try {
    const res = await getDetail(props.letterNo)
    if (res.success) letterData.value = res.data
  } catch {}
  loading.value = false
}

onMounted(load)
</script>
