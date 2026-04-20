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
      <div class="flex flex-wrap gap-3 items-center">
        <!-- Status filters -->
        <div class="flex gap-2 flex-wrap" id="letters-status-filters">
          <button
            v-for="s in statusOptions"
            :key="s.value"
            class="wp-filter-chip"
            :class="{ active: filters.status === s.value }"
            @click="setStatus(s.value)"
          >{{ s.label }}</button>
        </div>

        <div class="flex-1 flex gap-2 flex-wrap justify-end">
          <!-- Category selects -->
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

          <!-- Search -->
          <div class="relative">
            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              v-model="filters.keyword"
              class="wp-input pl-8"
              style="width:200px"
              placeholder="搜索关键词..."
              @input="debounceSearch"
              @keydown.enter="doSearch"
            />
          </div>

          <!-- Page size -->
          <select class="wp-select" style="width:90px" v-model="pageSize" @change="onPageSizeChange">
            <option v-for="n in [10,20,50]" :key="n" :value="n">{{ n }}条/页</option>
          </select>
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
        <span class="text-sm text-gray-500">
          共 {{ totalCount }} 条记录，第 {{ currentPage }}/{{ totalPages }} 页
        </span>
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
})

const statusOptions = [
  { value: '', label: '全部' },
  { value: '预处理', label: '预处理' },
  { value: '正在处理', label: '处理中' },
  { value: '正在反馈', label: '反馈中' },
  { value: '已完成', label: '已完成' },
  { value: '已无效', label: '已无效' },
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
  loading.value = true
  try {
    const args = {
      limit: pageSize.value,
      page: currentPage.value,
      order_by: '来信时间',
      order_desc: true,
    }
    if (filters.value.level1) args['信件一级分类'] = filters.value.level1
    if (filters.value.level2) args['信件二级分类'] = filters.value.level2
    if (filters.value.level3) args['信件三级分类'] = filters.value.level3
    if (filters.value.status) args['信件状态'] = filters.value.status
    if (filters.value.keyword) args['搜索关键字'] = filters.value.keyword

    const res = await getList(args)
    if (res.success) {
      letters.value = res.data?.list || res.data || []
      totalCount.value = res.data?.total || res.total || 0
    }
  } catch {}
  loading.value = false
}

const loadCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      categoryData.value = res.data || {}
    }
  } catch {}
}

const viewDetail = (letterNo) => {
  selectedLetterNo.value = letterNo
  detailVisible.value = true
}

onMounted(async () => {
  await loadCategories()
  await loadLetters()
})
</script>
