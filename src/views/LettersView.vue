<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="wp-header" id="letters-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-envelope-open-text"></i></div>
        <div>
          <div class="wp-panel-title">所有信件</div>
          <div class="text-xs text-gray-400 mt-0.5">共 <span class="text-blue-600 font-medium">{{ totalCount }}</span> 封信件</div>
        </div>
      </div>
    </div>

    <!-- Filter panel -->
    <div class="wp-panel p-4" id="letters-filter-panel">
      <div class="flex flex-col gap-4">
        <!-- First row: status, categories, search -->
        <div class="flex flex-wrap gap-3 items-center">
          <!-- Status dropdown -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">状态：</span>
            <select class="wp-select" style="width:120px" v-model="filters.status" @change="doSearch">
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <!-- Category selects -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">分类：</span>
            <select class="wp-select" style="width:120px" v-model="filters.level1" @change="onLevel1Change">
              <option value="">全部分类</option>
              <option v-for="k in Object.keys(categoryData)" :key="k" :value="k">{{ k }}</option>
            </select>
            <select class="wp-select" style="width:120px" v-model="filters.level2" @change="onLevel2Change">
              <option value="">全部</option>
              <option v-for="k in level2Options" :key="k" :value="k">{{ k }}</option>
            </select>
            <select class="wp-select" style="width:120px" v-model="filters.level3" @change="onLevel3Change">
              <option value="">全部</option>
              <option v-for="k in level3Options" :key="k" :value="k">{{ k }}</option>
            </select>
          </div>
          <!-- Search box -->
          <div class="flex-1 flex justify-end">
            <div class="relative">
              <i class="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              <input
                v-model="filters.keyword"
                class="wp-input pl-12"
                style="width:200px"
                placeholder="搜索关键词..."
                @input="debounceSearch"
                @keydown.enter="doSearch"
              />
            </div>
          </div>
        </div>
        <!-- Second row: field filters -->
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">编号：</span>
            <input
              v-model="filters.letter_no"
              class="wp-input"
              style="width:150px"
              placeholder="信件编号"
              @input="debounceSearch"
              @keydown.enter="doSearch"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">来信人：</span>
            <input
              v-model="filters.citizen_name"
              class="wp-input"
              style="width:120px"
              placeholder="姓名"
              @input="debounceSearch"
              @keydown.enter="doSearch"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">电话：</span>
            <input
              v-model="filters.phone"
              class="wp-input"
              style="width:130px"
              placeholder="手机号"
              @input="debounceSearch"
              @keydown.enter="doSearch"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">身份证号：</span>
            <input
              v-model="filters.id_card"
              class="wp-input"
              style="width:180px"
              placeholder="身份证号码"
              @input="debounceSearch"
              @keydown.enter="doSearch"
            />
          </div>
        </div>
        <!-- Third row: time filters -->
        <div class="flex flex-wrap gap-3 items-center">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 whitespace-nowrap">时间段：</span>
            <input
              type="date"
              v-model="filters.start_time"
              class="wp-input"
              style="width:140px"
              @input="debounceSearch"
            />
            <span class="text-gray-400">至</span>
            <input
              type="date"
              v-model="filters.end_time"
              class="wp-input"
              style="width:140px"
              @input="debounceSearch"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="wp-panel flex-1 flex flex-col overflow-hidden">
      <div class="overflow-x-auto flex-1">
        <table class="wp-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>来信人</th>
              <th>手机</th>
              <th>渠道</th>
              <th>分类</th>
              <th>状态</th>
              <th>来信时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="letters-list-body">
            <tr v-if="loading">
              <td colspan="8" class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
              </td>
            </tr>
            <tr v-else-if="letters.length === 0">
              <td colspan="8" class="text-center py-12 text-gray-400">
                <i class="fas fa-inbox text-4xl mb-3 block"></i>
                暂无信件
              </td>
            </tr>
            <tr
              v-for="letter in letters"
              :key="letter['信件编号']"
              class="cursor-pointer"
              @click="viewDetail(letter['信件编号'])"
            >
              <td class="font-mono text-xs text-blue-600">{{ letter['信件编号'] }}</td>
              <td>{{ letter['群众姓名'] }}</td>
              <td class="text-gray-500">{{ letter['手机号'] }}</td>
              <td>{{ letter['来源渠道'] }}</td>
              <td class="text-xs text-gray-600">
                <span v-if="letter['信件一级分类']">{{ letter['信件一级分类'] }}</span>
                <span v-if="letter['信件二级分类']" class="text-gray-400"> / {{ letter['信件二级分类'] }}</span>
                <span v-if="letter['信件三级分类']" class="text-gray-400"> / {{ letter['信件三级分类'] }}</span>
              </td>
              <td><StatusBadge :status="letter['信件状态']" /></td>
              <td class="text-xs text-gray-500">{{ formatTime(letter['来信时间']) }}</td>
              <td>
                <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click.stop="viewDetail(letter['信件编号'])">
                  详情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100" id="letters-pagination">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            共 {{ totalCount }} 条记录，第 {{ currentPage }}/{{ totalPages }} 页
          </span>
          <select class="wp-select text-sm" style="width:90px" v-model="pageSize" @change="onPageSizeChange">
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}条/页</option>
          </select>
        </div>
        <div class="wp-pagination">
          <button class="wp-page-btn" :disabled="currentPage <= 1" @click="goToPage(1)">
            <i class="fas fa-angle-double-left text-xs"></i>
          </button>
          <button class="wp-page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">
            <i class="fas fa-angle-left text-xs"></i>
          </button>
          <template v-for="p in pageNumbers" :key="p">
            <button v-if="p !== '...'" class="wp-page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
            <span v-else class="wp-page-btn" style="cursor:default">...</span>
          </template>
          <button class="wp-page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">
            <i class="fas fa-angle-right text-xs"></i>
          </button>
          <button class="wp-page-btn" :disabled="currentPage >= totalPages" @click="goToPage(totalPages)">
            <i class="fas fa-angle-double-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <LetterDetailModal
      v-if="detailVisible"
      :letter-no="selectedLetterNo"
      @close="detailVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getList, getCategories } from '@/api/letter'
import StatusBadge from '@/components/StatusBadge.vue'
import LetterDetailModal from '@/components/LetterDetailModal.vue'

const letters = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const detailVisible = ref(false)
const selectedLetterNo = ref('')
const categoryData = ref({})

const filters = ref({
  status: '',
  level1: '',
  level2: '',
  level3: '',
  keyword: '',
  letter_no: '',
  citizen_name: '',
  phone: '',
  id_card: '',
  start_time: '',
  end_time: '',
})

const statusOptions = [
  { value: '', label: '全部' },
  { value: '预处理', label: '预处理' },
  { value: '市局已签收', label: '市局已签收' },
  { value: '区县局已签收', label: '区县局已签收' },
  { value: '办理单位已签收', label: '办理单位已签收' },
  { value: '市局处理中', label: '市局处理中' },
  { value: '区县局处理中', label: '区县局处理中' },
  { value: '办理单位处理中', label: '办理单位处理中' },
  { value: '已办结', label: '已办结' },
]

const fieldOptions = [
  { value: '', label: '选择字段' },
  { value: 'letter_no', label: '信件编号' },
  { value: 'citizen_name', label: '来信人' },
  { value: 'phone', label: '电话' },
  { value: 'id_card', label: '身份证号' },
]

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const level2Options = computed(() => {
  if (!filters.value.level1 || !categoryData.value[filters.value.level1]) return []
  return Object.keys(categoryData.value[filters.value.level1])
})

const level3Options = computed(() => {
  if (!filters.value.level1 || !filters.value.level2) return []
  const l2 = categoryData.value[filters.value.level1]
  if (!l2) return []
  return l2[filters.value.level2] || []
})

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
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

let debounceTimer = null

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const setStatus = (status) => {
  filters.value.status = status
  currentPage.value = 1
  loadLetters()
}

const onLevel1Change = () => {
  filters.value.level2 = ''
  filters.value.level3 = ''
  currentPage.value = 1
  loadLetters()
}

const onLevel2Change = () => {
  filters.value.level3 = ''
  currentPage.value = 1
  loadLetters()
}

const onLevel3Change = () => {
  currentPage.value = 1
  loadLetters()
}

const debounceSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(doSearch, 500)
}

const doSearch = () => {
  currentPage.value = 1
  loadLetters()
}

const onPageSizeChange = () => {
  currentPage.value = 1
  loadLetters()
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadLetters()
}

const loadLetters = async () => {
  console.log('loadLetters called');
  loading.value = true
  try {
    const args = {
      page: currentPage.value,
      page_size: pageSize.value,
      order_by: 'received_at',
      order_desc: true,
    }
    if (filters.value.level1) args.category_l1 = filters.value.level1
    if (filters.value.level2) args.category_l2 = filters.value.level2
    if (filters.value.level3) args.category_l3 = filters.value.level3
    if (filters.value.status) args.status = filters.value.status
    if (filters.value.keyword) args.keyword = filters.value.keyword
    if (filters.value.letter_no) args.letter_no = filters.value.letter_no
    if (filters.value.citizen_name) args.citizen_name = filters.value.citizen_name
    if (filters.value.phone) args.phone = filters.value.phone
    if (filters.value.id_card) args.id_card = filters.value.id_card
    if (filters.value.start_time) args.start_time = filters.value.start_time
    if (filters.value.end_time) args.end_time = filters.value.end_time

    const res = await getList(args)
    console.log('res', res)
    if (res.success) {
      // Map backend fields to frontend field names
      const rawList = res.data?.list || res.data || []
      letters.value = rawList.map(letter => ({
        '信件编号': letter.letter_no,
        '群众姓名': letter.citizen_name,
        '手机号': letter.phone,
        '来源渠道': letter.channel,
        '信件一级分类': letter.category_l1,
        '信件二级分类': letter.category_l2,
        '信件三级分类': letter.category_l3,
        '信件状态': letter.current_status,
        '来信时间': letter.received_at,
        // Include original object for debugging
        _raw: letter
      }))
      totalCount.value = res.data?.total || res.total || 0
    }
  } catch (err) {
    console.error('loadLetters error:', err)
    // Ensure UI renders with empty list
    letters.value = []
    totalCount.value = 0
  }
  loading.value = false
}

const loadCategories = async () => {
  console.log('loadCategories called');
  try {
    const res = await getCategories()
    console.log('categories res', res)
    if (res.success) {
      // Transform nested array to hierarchical object
      const transformed = {}
      const data = res.data || []
      for (const level1 of data) {
        const level1Name = level1.name
        const level2Map = {}
        for (const level2 of level1.children || []) {
          const level2Name = level2.name
          const level3Names = (level2.children || []).map(item => item.name)
          level2Map[level2Name] = level3Names
        }
        transformed[level1Name] = level2Map
      }
      console.log('transformed categories', transformed)
      categoryData.value = transformed
    }
  } catch (err) {
    console.error('loadCategories error:', err)
    // Fallback data for UI rendering
    categoryData.value = {
      '投诉举报类': {
        '接处警投诉': ['不出警、出警慢'],
        '执法办案投诉': ['有案不立', '压案不查，久拖不决']
      },
      '意见建议类': {
        '执法办案建议': ['案件办理效率', '公正文明执法']
      }
    }
    console.log('Using fallback category data')
  }
}

const viewDetail = (letterNo) => {
  console.log('viewDetail called with letterNo:', letterNo)
  selectedLetterNo.value = letterNo
  detailVisible.value = true
  console.log('detailVisible set to:', detailVisible.value)
  window.debugDetailVisible = detailVisible.value
  window.debugSelectedLetterNo = selectedLetterNo.value
}

onMounted(async () => {
  console.log('LettersView mounted')
  await loadCategories()
  await loadLetters()
})
</script>
