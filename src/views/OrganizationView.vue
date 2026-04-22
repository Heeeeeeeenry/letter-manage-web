<template>
  <div class="h-full flex flex-col gap-4 old-system">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-sitemap text-blue-600"></i></div>
        <div>
          <div class="wp-panel-title">管理单位组织架构和下发权限</div>
          <div class="text-xs text-gray-400 mt-0.5"></div>
        </div>
      </div>
      <div class="flex gap-2">
        <button 
          class="wp-btn" 
          :class="activeTab === 'units' ? 'wp-btn-primary' : 'wp-btn-secondary'"
          @click="activeTab = 'units'"
        >
          单位管理
        </button>
        <button 
          class="wp-btn"
          :class="activeTab === 'dispatch' ? 'wp-btn-primary' : 'wp-btn-secondary'"
          @click="activeTab = 'dispatch'"
        >
          下发权限
        </button>
      </div>
    </div>

    <!-- Unit Management -->
    <div v-if="activeTab === 'units'" class="flex flex-col flex-1 overflow-hidden">
      <!-- Toolbar -->
      <div class="wp-panel mb-4">
        <div class="wp-panel-header compact" style="padding: 12px 16px;">
          <!-- Row 1: Search + Filters -->
          <div class="flex items-center gap-3 mb-2">
            <div class="relative">
              <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                v-model="searchKeyword"
                class="wp-input pl-10"
                style="width: 220px;"
                placeholder="搜索单位名称..."
                @input="handleSearch"
              />
            </div>
            <div class="w-px h-6 bg-gray-300"></div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 whitespace-nowrap">一级单位：</span>
              <select v-model="filterLevel1" class="wp-select" style="width: 150px;" @change="handleFilter">
                <option value="">全部</option>
                <option v-for="level in level1Options" :key="level" :value="level">{{ level }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 whitespace-nowrap">二级单位：</span>
              <select v-model="filterLevel2" class="wp-select" style="width: 150px;" @change="handleFilter">
                <option value="">全部</option>
                <option v-for="level in level2Options" :key="level" :value="level">{{ level }}</option>
              </select>
            </div>
            <div class="flex-1"></div>
            <button class="wp-btn wp-btn-primary" @click="openAddUnitModal">
              <i class="fas fa-plus mr-2"></i>新增单位
            </button>
          </div>
          <!-- Row 2: Tags showing active filters -->
          <div class="flex items-center gap-2 text-xs text-gray-500" v-if="filterLevel1 || filterLevel2 || searchKeyword">
            <span>已筛选：</span>
            <span v-if="searchKeyword" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
              <i class="fas fa-search text-2xs"></i>{{ searchKeyword }}
              <button class="ml-1 hover:text-blue-900" @click="searchKeyword = ''; handleSearch()">&times;</button>
            </span>
            <span v-if="filterLevel1" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
              一级：{{ filterLevel1 }}
              <button class="ml-1 hover:text-blue-900" @click="filterLevel1 = ''; handleFilter()">&times;</button>
            </span>
            <span v-if="filterLevel2" class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
              二级：{{ filterLevel2 }}
              <button class="ml-1 hover:text-blue-900" @click="filterLevel2 = ''; handleFilter()">&times;</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="wp-panel flex-1 overflow-hidden flex flex-col">
        <div class="wp-scroll flex-1">
          <table class="wp-table">
            <thead>
              <tr>
                <th class="w-1/4">一级单位</th>
                <th class="w-1/4">二级单位</th>
                <th class="w-1/4">三级单位</th>
                <th class="w-1/4">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="unit in paginatedUnits" :key="unit.id">
                <td>{{ unit.level1 }}</td>
                <td>{{ unit.level2 }}</td>
                <td>{{ unit.level3 }}</td>
                <td>
                  <button class="wp-btn wp-btn-secondary text-xs py-1 px-2 mr-2" @click="editUnit(unit)">
                    <i class="fas fa-edit"></i>编辑
                  </button>
                  <button class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="deleteUnit(unit)">
                    <i class="fas fa-trash"></i>删除
                  </button>
                </td>
              </tr>
              <tr v-if="filteredUnits.length === 0">
                <td colspan="4" class="text-center py-8 text-gray-400">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="wp-panel-header compact border-t">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
              共 {{ totalCount }} 条记录，第 {{ currentPage }} / {{ totalPages }} 页
            </div>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-600">每页显示</span>
                <select v-model="pageSize" class="wp-select" style="width: 80px;" @change="handlePageSizeChange">
                  <option value="10">10条</option>
                  <option value="20">20条</option>
                  <option value="50">50条</option>
                </select>
              </div>
              <div class="flex items-center gap-2">
                <button class="wp-btn wp-btn-secondary" :disabled="currentPage === 1" @click="goToPage(1)">
                  首页
                </button>
                <button class="wp-btn wp-btn-secondary" :disabled="currentPage === 1" @click="prevPage">
                  上一页
                </button>
                <template v-for="p in pageNumbers" :key="p">
                  <button v-if="p !== '...'" class="wp-page-btn" :class="{ active: p === currentPage }" @click="goToPage(p)">{{ p }}</button>
                  <span v-else class="wp-page-ellipsis">...</span>
                </template>
                <button class="wp-btn wp-btn-secondary" :disabled="currentPage >= totalPages" @click="nextPage">
                  下一页
                </button>
                <button class="wp-btn wp-btn-secondary" :disabled="currentPage >= totalPages" @click="goToPage(totalPages)">
                  末页
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Unit Modal -->
      <div v-if="showUnitModal" class="wp-modal-overlay" @click.self="closeUnitModal">
        <div class="wp-modal" style="max-width: 500px;">
          <div class="flex items-center justify-between mb-6">
            <div class="font-bold text-gray-800 text-lg">{{ editingUnit ? '编辑单位' : '新增单位' }}</div>
            <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeUnitModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">一级单位</label>
              <input class="wp-input" v-model="unitForm.level1" placeholder="请输入一级单位名称" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">二级单位</label>
              <input class="wp-input" v-model="unitForm.level2" placeholder="请输入二级单位名称（可选）" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">三级单位</label>
              <input class="wp-input" v-model="unitForm.level3" placeholder="请输入三级单位名称（可选）" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 mb-1 block">系统编码 <span class="text-red-500">*</span></label>
              <input class="wp-input" v-model="unitForm.system_code" placeholder="请输入系统唯一编码" required />
              <p class="text-xs text-gray-500 mt-1">系统唯一标识，建议使用英文或数字</p>
            </div>
          </div>
          <div class="flex gap-3 justify-end mt-6">
            <button class="wp-btn wp-btn-secondary" @click="closeUnitModal">取消</button>
            <button class="wp-btn wp-btn-primary" :disabled="savingUnit" @click="saveUnit">
              <i v-if="savingUnit" class="fas fa-spinner fa-spin"></i>保存
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dispatch Permission Management -->
    <div v-if="activeTab === 'dispatch'" class="flex flex-col flex-1 overflow-hidden">
      <div class="wp-panel flex-1">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">下发权限列表</span>
          <div class="flex gap-2">
            <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadDispatchPermissions">
              <i class="fas fa-sync-alt" :class="{'fa-spin': dispatchLoading}"></i>
            </button>
            <button class="wp-btn wp-btn-primary text-xs py-1 px-2" @click="openCreateDispatchModal">
              <i class="fas fa-plus"></i>新建权限
            </button>
          </div>
        </div>
        <div class="wp-scroll">
          <table class="wp-table" v-if="dispatchPermissions.length">
            <thead>
              <tr>
                <th class="w-12">ID</th>
                <th>单位名称</th>
                <th>可下发范围</th>
                <th class="w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="perm in dispatchPermissions" :key="perm.id">
                <td>{{ perm.id }}</td>
                <td>{{ perm.unit_name }}</td>
                <td>
                  <div class="flex flex-wrap gap-1">
                    <span v-for="scope in perm.dispatch_scope" :key="scope" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      {{ scope }}
                    </span>
                  </div>
                </td>
                <td class="text-center">
                  <button class="wp-btn wp-btn-secondary text-xs py-0.5 px-2 mr-1" @click="openEditDispatchModal(perm)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="wp-btn wp-btn-danger text-xs py-0.5 px-2" @click="handleDeleteDispatch(perm)">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="text-center py-8 text-gray-400">
            <i class="fas fa-inbox text-3xl mb-2"></i>
            <div>暂无下发权限配置</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="wp-modal-overlay" @click.self="closeModal">
      <div class="wp-modal" style="max-width:480px">
        <div class="flex items-center justify-between mb-6">
          <div class="font-bold text-gray-800 text-lg">{{ editingOrg ? '编辑单位' : '新建单位' }}</div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">单位名称</label><input class="wp-input" v-model="form.name" placeholder="请输入单位名称" /></div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">单位编码</label><input class="wp-input" v-model="form.code" placeholder="请输入编码" /></div>
          <div v-if="parentOrg">
            <label class="text-sm font-medium text-gray-700 mb-1 block">上级单位</label>
            <input class="wp-input" :value="parentOrg.level1 || parentOrg.name" readonly />
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button class="wp-btn wp-btn-secondary" @click="closeModal">取消</button>
          <button class="wp-btn wp-btn-primary" :disabled="submitting" @click="handleSave">
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>保存
          </button>
        </div>
      </div>
    </div>

    <!-- Dispatch Permission Modal -->
    <div v-if="showDispatchModal" class="wp-modal-overlay" @click.self="closeDispatchModal">
      <div class="wp-modal" style="max-width:520px">
        <div class="flex items-center justify-between mb-6">
          <div class="font-bold text-gray-800 text-lg">{{ editingDispatch ? '编辑下发权限' : '新建下发权限' }}</div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeDispatchModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">单位名称</label>
            <select class="wp-input" v-model="dispatchForm.unit_name" :disabled="editingDispatch">
              <option value="">请选择单位</option>
              <option v-for="unit in availableUnits" :key="unit.id" :value="unit.name">{{ unit.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">可下发范围</label>
            <div class="space-y-2">
              <div v-for="(scope, index) in dispatchForm.dispatch_scope" :key="index" class="flex gap-2">
                <select class="wp-input flex-1" v-model="dispatchForm.dispatch_scope[index]">
                  <option value="">请选择可下发单位</option>
                  <option v-for="unit in availableUnits" :key="unit.id" :value="unit.name">{{ unit.name }}</option>
                </select>
                <button class="wp-btn wp-btn-danger text-xs py-1.5 px-2" @click="dispatchForm.dispatch_scope.splice(index, 1)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button class="wp-btn wp-btn-secondary text-xs py-1.5 px-2" @click="dispatchForm.dispatch_scope.push('')">
                <i class="fas fa-plus mr-1"></i>添加可下发单位
              </button>
            </div>
          </div>
        </div>
        <div class="flex gap-3 justify-end mt-6">
          <button class="wp-btn wp-btn-secondary" @click="closeDispatchModal">取消</button>
          <button class="wp-btn wp-btn-primary" :disabled="dispatchSubmitting" @click="handleSaveDispatch">
            <i v-if="dispatchSubmitting" class="fas fa-spinner fa-spin"></i>保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrgList, createOrg, updateOrg, deleteOrg, getDispatchPermissions, createDispatchPermission, updateDispatchPermission, deleteDispatchPermission, getDispatchUnits } from '@/api/setting'
import InfoRow from '@/components/InfoRow.vue'
import OrgTreeNode from '@/components/OrgTreeNode.vue'

const orgs = ref([])
const selectedOrg = ref(null)
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const editingOrg = ref(null)
const parentOrg = ref(null)
const form = ref({ name: '', code: '' })

// Unit management new variables
const searchKeyword = ref('')
const filterLevel1 = ref('')
const filterLevel2 = ref('')

const currentPage = ref(1)
const pageSize = ref(20)
const showUnitModal = ref(false)
const editingUnit = ref(null)
const savingUnit = ref(false)
const unitForm = ref({
  level1: '',
  level2: '',
  level3: '',
  system_code: '',
  parentId: '',
  type: 'level1'
})

// Unit data from API
const unitsLoading = ref(false)

// Filtered units computed property — client-side filtering
const filteredUnits = computed(() => {
  let result = orgs.value

  // Filter by search keyword (match any level)
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    result = result.filter(u =>
      (u.level1 && u.level1.toLowerCase().includes(kw)) ||
      (u.level2 && u.level2.toLowerCase().includes(kw)) ||
      (u.level3 && u.level3.toLowerCase().includes(kw))
    )
  }

  // Filter by level1
  if (filterLevel1.value) {
    result = result.filter(u => u.level1 === filterLevel1.value)
  }

  // Filter by level2
  if (filterLevel2.value) {
    result = result.filter(u => u.level2 === filterLevel2.value)
  }

  return result
})

// Dynamic level1 options from actual data
const level1Options = computed(() => {
  const levels = new Set()
  orgs.value.forEach(unit => {
    if (unit.level1 && unit.level1.trim()) {
      levels.add(unit.level1)
    }
  })
  return Array.from(levels).sort()
})

// Dynamic level2 options — cascade based on selected level1
const level2Options = computed(() => {
  let pool = orgs.value
  if (filterLevel1.value) {
    pool = pool.filter(u => u.level1 === filterLevel1.value)
  }
  const levels = new Set()
  pool.forEach(unit => {
    if (unit.level2 && unit.level2.trim()) {
      levels.add(unit.level2)
    }
  })
  return Array.from(levels).sort()
})

// Total count based on filtered results
const totalCount = computed(() => filteredUnits.value.length)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))
const paginatedUnits = computed(() => {
  // Client-side pagination slice
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredUnits.value.slice(start, end)
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

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadOrgs()
}

// Search and filter handlers
const handleSearch = () => {
  currentPage.value = 1
  loadOrgs()
}
const handleFilter = () => {
  currentPage.value = 1
  loadOrgs()
}
const openAddUnitModal = () => {
  editingUnit.value = null
  unitForm.value = { 
    level1: '', 
    level2: '', 
    level3: '', 
    system_code: '',
    parentId: '', 
    type: 'level1' 
  }
  showUnitModal.value = true
}
const editUnit = (unit) => {
  editingUnit.value = unit
  unitForm.value = {
    level1: unit.level1 || '',
    level2: unit.level2 || '',
    level3: unit.level3 || '',
    system_code: unit.system_code || '',
    parentId: unit.parentId || '',
    type: 'level1'
  }
  showUnitModal.value = true
}
const deleteUnit = async (unit) => {
  if (!confirm(`确认删除单位 ${unit.level1 || unit.name}？`)) return
  try {
    const res = await deleteOrg({ id: unit.id })
    if (!res.success) {
      throw new Error(res.error || '删除失败')
    }
    loadOrgs()
  } catch (error) {
    console.error('删除单位失败:', error)
    alert('删除失败: ' + (error.message || '未知错误'))
  }
}
const saveUnit = async () => {
  savingUnit.value = true
  try {
    // Prepare data for API
    const unitData = {
      level1: unitForm.value.level1,
      level2: unitForm.value.level2,
      level3: unitForm.value.level3,
      system_code: unitForm.value.system_code || generateSystemCode(unitForm.value)
    }
    
    if (!unitData.system_code) {
      alert('请输入系统编码')
      savingUnit.value = false
      return
    }
    
    let res
    if (editingUnit.value) {
      // Update existing unit
      res = await updateOrg({ ...unitData, id: editingUnit.value.id })
    } else {
      // Create new unit
      res = await createOrg(unitData)
    }
    // Check if operation succeeded
    if (!res.success) {
      throw new Error(res.error || '操作失败')
    }
    
    // Refresh data
    loadOrgs()
    showUnitModal.value = false
    editingUnit.value = null
  } catch (error) {
    console.error('保存单位失败:', error)
    alert('保存失败: ' + (error.message || '未知错误'))
  } finally {
    savingUnit.value = false
  }
}

// Helper function to generate system code if not provided
function generateSystemCode(formData) {
  if (formData.system_code && formData.system_code.trim()) {
    return formData.system_code
  }
  // Generate from level1 + timestamp
  const prefix = formData.level1 ? formData.level1.substring(0, 2) : 'U'
  return `${prefix}_${Date.now().toString(36).slice(-6)}`
}
const closeUnitModal = () => {
  showUnitModal.value = false
  editingUnit.value = null
}
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadOrgs()
  }
}
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadOrgs()
  }
}
const handlePageSizeChange = () => {
  currentPage.value = 1
  loadOrgs()
}

// Dispatch permissions
const activeTab = ref('units')
const dispatchPermissions = ref([])
const dispatchLoading = ref(false)
const dispatchSubmitting = ref(false)
const showDispatchModal = ref(false)
const editingDispatch = ref(null)
const dispatchForm = ref({ unit_name: '', dispatch_scope: [] })
const availableUnits = ref([])

const topLevelOrgs = computed(() => orgs.value.filter(o => !o.parent_id))
const parentName = computed(() => {
  if (!selectedOrg.value?.parent_id) return '顶级单位'
  const p = orgs.value.find(o => o.id === selectedOrg.value.parent_id)
  return p?.level1 || p?.name || '-'
})

const selectOrg = (org) => { selectedOrg.value = org }

const openCreateModal = (parent) => {
  editingOrg.value = null
  parentOrg.value = parent
  form.value = { name: '', code: '' }
  showModal.value = true
}

const openEditModal = (org) => {
  editingOrg.value = org
  parentOrg.value = orgs.value.find(o => o.id === org.parent_id) || null
  form.value = { name: org.level1 || org.name || '', code: org.code || '' }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editingOrg.value = null; parentOrg.value = null }

const handleSave = async () => {
  submitting.value = true
  try {
    const data = { name: form.value.name, code: form.value.code, parent_id: parentOrg.value?.id }
    if (editingOrg.value) {
      await updateOrg({ ...data, id: editingOrg.value.id })
    } else {
      await createOrg(data)
    }
    closeModal()
    loadOrgs()
  } catch {}
  submitting.value = false
}

const handleDelete = async (org) => {
  if (!confirm(`确认删除单位 ${org.level1 || org.name}？`)) return
  try { await deleteOrg({ id: org.id }); loadOrgs(); selectedOrg.value = null } catch {}
}

const loadOrgs = async () => {
  loading.value = true
  window.__debug_orgs_loaded = false
  try {
    const res = await getOrgList({})
    console.log('loadOrgs res:', res)
    if (res.success) {
      // Backend now returns all units as a plain array
      if (Array.isArray(res.data)) {
        orgs.value = res.data
      } else if (res.data?.list) {
        orgs.value = res.data.list
      } else {
        orgs.value = []
      }
    }
    console.log('orgs:', orgs.value, 'total:', orgs.value.length)
    window.__debug_orgs_loaded = true
    window.__debug_orgs_data = orgs.value
  } catch (e) {
    console.error('loadOrgs error:', e)
    // Fallback mock data for debugging
    orgs.value = [
      { id: 1, level1: '市局', level2: '', level3: '', name: '市局', code: 'SJ', parent_id: null },
      { id: 2, level1: '分局', level2: '桃城分局', level3: '', name: '桃城分局', code: 'TCFJ', parent_id: 1 },
    ]
    console.log('Using mock data:', orgs.value)
  }
  loading.value = false
}

// Dispatch permission methods
const loadDispatchPermissions = async () => {
  dispatchLoading.value = true
  try {
    const res = await getDispatchPermissions()
    if (res.success) dispatchPermissions.value = res.data || []
  } catch {}
  dispatchLoading.value = false
}

const loadAvailableUnits = async () => {
  try {
    const res = await getDispatchUnits()
    if (res.success) {
      // Format unit names from level1/level2/level3
      availableUnits.value = (res.data || []).map(unit => {
        const parts = [unit.level1, unit.level2, unit.level3].filter(p => p && p.trim())
        return {
          id: unit.id,
          name: parts.join(' / '),
          raw: unit
        }
      })
    }
  } catch {}
}

const openCreateDispatchModal = () => {
  editingDispatch.value = null
  dispatchForm.value = { unit_name: '', dispatch_scope: [] }
  loadAvailableUnits()
  showDispatchModal.value = true
}

const openEditDispatchModal = (perm) => {
  editingDispatch.value = perm
  dispatchForm.value = {
    unit_name: perm.unit_name,
    dispatch_scope: [...perm.dispatch_scope]
  }
  loadAvailableUnits()
  showDispatchModal.value = true
}

const closeDispatchModal = () => {
  showDispatchModal.value = false
  editingDispatch.value = null
  dispatchForm.value = { unit_name: '', dispatch_scope: [] }
}

const handleSaveDispatch = async () => {
  dispatchSubmitting.value = true
  try {
    const data = {
      unit_name: dispatchForm.value.unit_name,
      dispatch_scope: dispatchForm.value.dispatch_scope.filter(s => s.trim())
    }
    if (editingDispatch.value) {
      await updateDispatchPermission({ ...data, id: editingDispatch.value.id })
    } else {
      await createDispatchPermission(data)
    }
    closeDispatchModal()
    loadDispatchPermissions()
  } catch {}
  dispatchSubmitting.value = false
}

const handleDeleteDispatch = async (perm) => {
  if (!confirm(`确认删除 ${perm.unit_name} 的下发权限？`)) return
  try {
    await deleteDispatchPermission({ id: perm.id })
    loadDispatchPermissions()
  } catch {}
}

onMounted(() => {
  console.log('OrganizationView mounted')
  loadOrgs()
  if (activeTab.value === 'dispatch') {
    loadDispatchPermissions()
  }
})
</script>

<style scoped>
/* 老系统样式覆盖 */
.old-system .wp-panel {
  border-radius: 0;
  box-shadow: none;
  border: 1px solid #ccc;
}
.old-system .wp-btn {
  border-radius: 2px;
  box-shadow: none;
}
.old-system .wp-panel-header {
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}
.old-system .wp-table th {
  background: #eaeaea;
}
/* 更多样式 */
.old-system .wp-panel-icon {
  color: #333;
}
.old-system .wp-panel-title {
  font-size: 16px;
  color: #333;
}
.old-system .wp-scroll {
  border: 1px solid #eee;
}
</style>
