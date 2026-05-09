<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <i class="fas fa-history text-yellow-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">操作记录</div>
          <div class="text-xs text-gray-400 mt-0.5">共 <span class="text-yellow-600 font-medium">{{ totalCount }}</span> 条记录</div>
        </div>
      </div>
    </div>

    <!-- Filter panel: 左侧筛选项，右侧重置/查询 -->
    <div class="wp-panel px-4 py-2.5">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span class="text-xs text-gray-400">对象</span>
          <select class="wp-select text-xs" style="width:105px" v-model="filters.target" @change="doSearch">
            <option value="">全部</option>
            <option v-for="t in targetOptions" :key="t" :value="t">{{ t }}</option>
          </select>
          <input v-model="filters.target_id" class="wp-input text-xs" style="width:115px" placeholder="信件编号/警号" @keydown.enter="doSearch" />
          <span class="text-xs text-gray-400">操作</span>
          <select class="wp-select text-xs" style="width:88px" v-model="filters.action" @change="doSearch">
            <option value="">全部</option>
            <option v-for="a in actionOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
          </select>
          <span class="text-xs text-gray-400">操作人</span>
          <input v-model="filters.user_name" class="wp-input text-xs" style="width:90px" placeholder="姓名" @keydown.enter="doSearch" />
          <span class="text-xs text-gray-400">时间</span>
          <input type="date" v-model="filters.start_time" class="wp-input text-xs" style="width:118px" @change="doSearch" />
          <span class="text-xs text-gray-300">-</span>
          <input type="date" v-model="filters.end_time" class="wp-input text-xs" style="width:118px" @change="doSearch" />
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button class="wp-btn wp-btn-secondary text-xs py-1.5 px-3" @click="resetFilters">
            <i class="fas fa-undo-alt mr-1"></i>重置
          </button>
          <button class="wp-btn wp-btn-primary text-xs py-1.5 px-3" @click="doSearch">
            <i class="fas fa-search mr-1"></i>查询
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="wp-panel flex-1 flex flex-col overflow-hidden">
      <div class="overflow-x-auto flex-1">
        <div v-if="loading" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</div>
        <div v-else-if="!items.length" class="text-center py-12 text-gray-400">
          <i class="fas fa-history text-4xl mb-2 block text-gray-200"></i>暂无操作记录
        </div>
        <table v-else class="wp-table w-full">
          <thead>
            <tr>
              <th style="width:60px">ID</th>
              <th style="width:150px">操作人</th>
              <th style="width:100px">操作</th>
              <th style="width:100px">对象</th>
              <th style="width:150px">对象ID</th>
              <th>详情</th>
              <th style="width:160px">时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
              <td class="text-gray-500 text-xs font-mono">{{ item.id }}</td>
              <td>
                <span class="text-sm text-gray-700">{{ item.user_name || '-' }}</span>
                <span v-if="item.police_number" class="text-xs text-gray-400 ml-1">({{ item.police_number }})</span>
              </td>
              <td>
                <span class="wp-badge" :class="actionBadge(item.action)">{{ actionLabel(item.action) }}</span>
              </td>
              <td class="text-sm text-gray-600">{{ item.target || '-' }}</td>
              <td class="text-xs text-gray-500 font-mono">{{ item.target_id || '-' }}</td>
              <td class="text-xs text-gray-500 max-w-0">
                <span class="truncate block" :title="formatDetail(item.detail)">{{ formatDetail(item.detail) }}</span>
              </td>
              <td class="text-xs text-gray-400 font-mono">{{ formatTime(item.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            共 {{ totalCount }} 条记录，第 {{ page }}/{{ totalPages }} 页
          </span>
          <select class="wp-select text-sm" style="width:90px" v-model.number="pageSize" @change="onPageSizeChange">
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}条/页</option>
          </select>
        </div>
        <div class="wp-pagination">
          <button class="wp-page-btn" :disabled="page <= 1" @click="goPage(1)">
            <i class="fas fa-angle-double-left text-xs"></i>
          </button>
          <button class="wp-page-btn" :disabled="page <= 1" @click="goPage(page - 1)">
            <i class="fas fa-angle-left text-xs"></i>
          </button>
          <template v-for="p in pageNumbers" :key="p">
            <button v-if="p !== '...'" class="wp-page-btn" :class="{ active: p === page }" @click="goPage(p)">{{ p }}</button>
            <span v-else class="wp-page-btn" style="cursor:default">...</span>
          </template>
          <button class="wp-page-btn" :disabled="page >= totalPages" @click="goPage(page + 1)">
            <i class="fas fa-angle-right text-xs"></i>
          </button>
          <button class="wp-page-btn" :disabled="page >= totalPages" @click="goPage(totalPages)">
            <i class="fas fa-angle-double-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getOperationLogs } from '@/api/setting'

const items = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)

const filters = reactive({
  target: '',
  target_id: '',
  action: '',
  user_name: '',
  start_time: '',
  end_time: '',
})

const targetOptions = [
  '下发工作台', '处理工作台', '核查工作台',
  '分类管理', '组织管理', '用户管理',
  '下发权限管理', '专项关注',
]

const actionOptions = [
  { value: 'create', label: '创建' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
  { value: 'dispatch', label: '下发' },
  { value: 'auto_dispatch', label: 'AI自动下发' },
  { value: 'mark_invalid', label: '标记无效' },
  { value: 'submit_processing', label: '提交处理' },
  { value: 'handle_by_self', label: '自行处理' },
  { value: 'return_letter', label: '退回' },
  { value: 'audit_approve', label: '审核通过' },
  { value: 'audit_reject', label: '审核不通过' },
  { value: 'reset_password', label: '重置密码' },
  { value: '审核通过', label: '审核通过' },
  { value: '审核不通过', label: '审核不通过' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  } else if (cur >= total - 3) {
    pages.push(1)
    pages.push('...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push('...')
    for (let i = cur - 1; i <= cur + 1; i++) pages.push(i)
    pages.push('...')
    pages.push(total)
  }
  return pages
})

const actionLabel = (action) => {
  const map = {
    'create': '创建', 'update': '修改', 'delete': '删除',
    'reset_password': '重置密码', 'mark_invalid': '标记无效',
    'handle_by_self': '自行处理', 'dispatch': '下发',
    'auto_dispatch': 'AI自动下发', 'submit_processing': '提交处理',
    'return_letter': '退回', 'audit_approve': '审核通过',
    'audit_reject': '审核不通过', '审核通过': '审核通过', '审核不通过': '审核不通过',
  }
  return map[action] || action
}

const actionBadge = (action) => {
  const map = {
    'create': 'wp-badge-green', 'update': 'wp-badge-blue', 'delete': 'wp-badge-red',
    'mark_invalid': 'wp-badge-red', 'handle_by_self': 'wp-badge-yellow',
    'dispatch': 'wp-badge-blue', 'auto_dispatch': 'wp-badge-purple',
    'submit_processing': 'wp-badge-green', 'return_letter': 'wp-badge-yellow',
    'audit_approve': 'wp-badge-green', 'audit_reject': 'wp-badge-red',
    '审核通过': 'wp-badge-green', '审核不通过': 'wp-badge-red',
  }
  return map[action] || 'wp-badge-gray'
}

const formatTime = (ts) => {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

const formatDetail = (detail) => {
  if (!detail || detail === '-' || detail === 'null') return '-'
  return String(detail)
}

const loadData = async () => {
  loading.value = true
  try {
    const args = { page: page.value, page_size: pageSize.value }
    if (filters.target) args.target = filters.target
    if (filters.target_id) args.target_id = filters.target_id
    if (filters.action) args.action = filters.action
    if (filters.user_name) args.user_name = filters.user_name
    if (filters.start_time) args.start_time = filters.start_time
    if (filters.end_time) args.end_time = filters.end_time
    const res = await getOperationLogs(args)
    if (res.success) {
      items.value = res.data?.list || []
      totalCount.value = res.data?.total || 0
    }
  } catch {}
  loading.value = false
}

const doSearch = () => {
  page.value = 1
  loadData()
}

const resetFilters = () => {
  filters.target = ''
  filters.target_id = ''
  filters.action = ''
  filters.user_name = ''
  filters.start_time = ''
  filters.end_time = ''
  page.value = 1
  loadData()
}

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  loadData()
}

const onPageSizeChange = () => {
  page.value = 1
  loadData()
}

onMounted(loadData)
</script>
