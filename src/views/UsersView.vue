<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-users text-blue-600"></i></div>
        <div>
          <div class="wp-panel-title">用户管理</div>
          <div class="text-xs text-gray-400 mt-0.5">共 {{ totalCount }} 个用户</div>
        </div>
      </div>
      <div class="flex gap-3 items-center">
        <div class="relative">
          <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input v-model="searchKeyword" class="wp-input pl-8" style="width:200px" placeholder="搜索用户..." @input="debounceSearch" />
        </div>
        <button class="wp-btn wp-btn-primary" @click="openCreateModal">
          <i class="fas fa-plus"></i>新建用户
        </button>
      </div>
    </div>

    <div class="wp-panel flex-1 flex flex-col overflow-hidden">
      <div class="overflow-x-auto flex-1">
        <table class="wp-table">
          <thead>
            <tr>
              <th>姓名</th>
              <th>警号</th>
              <th>所属单位</th>
              <th>权限级别</th>
              <th>手机号</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="7" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>
            <tr v-else-if="users.length === 0"><td colspan="7" class="text-center py-12 text-gray-400"><i class="fas fa-users text-4xl mb-2 block"></i>暂无用户</td></tr>
            <tr v-for="user in users" :key="user.id || user['警号']">
              <td class="font-medium">{{ user['姓名'] || user.name }}</td>
              <td class="font-mono text-sm">{{ user['警号'] || user.police_number }}</td>
              <td>{{ getUnitFullName(user.unit_id) }}</td>
              <td>
                <span class="wp-badge" :class="roleBadge(user['权限级别'] || user.role)">
                  {{ user['权限级别'] || user.role }}
                </span>
                <span v-if="user.is_admin" class="text-xs text-purple-500 ml-1">(管理员)</span>
              </td>
              <td>
                <span v-if="showPhone(user)" class="font-mono text-sm">{{ user.phone || '-' }}</span>
                <span v-else class="text-gray-300 text-sm">---</span>
              </td>
              <td>
                <span class="wp-badge cursor-pointer" :class="user['状态'] === '已激活' || user.is_active === true ? 'wp-badge-green' : 'wp-badge-red'"
                  @click="confirmToggleStatus(user)">
                  {{ user['状态'] || (user.is_active === true ? '已激活' : '已禁用') }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button v-if="canEdit(user)" class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="openEditModal(user)">
                    <i class="fas fa-edit"></i>编辑
                  </button>
                  <button v-if="canEdit(user)" class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="handleResetPwd(user)">
                    <i class="fas fa-key"></i>重置密码
                  </button>
                  <button v-if="canEdit(user)" class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="handleDelete(user)">
                    <i class="fas fa-trash"></i>删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">共 {{ totalCount }} 个用户</span>
        <div class="wp-pagination">
          <button class="wp-page-btn" :disabled="page <= 1" @click="goPage(page-1)"><i class="fas fa-angle-left text-xs"></i></button>
          <button class="wp-page-btn" :class="{active: page===p}" v-for="p in totalPages" :key="p" @click="goPage(p)">{{ p }}</button>
          <button class="wp-page-btn" :disabled="page >= totalPages" @click="goPage(page+1)"><i class="fas fa-angle-right text-xs"></i></button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="wp-modal-overlay" @click.self="closeModal">
      <div class="wp-modal" style="max-width:500px">
        <div class="flex items-center justify-between mb-6">
          <div class="font-bold text-gray-800 text-lg">{{ editingUser ? '编辑用户' : '新建用户' }}</div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">姓名</label><input class="wp-input" v-model="form.name" placeholder="请输入姓名" /></div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">警号</label><input class="wp-input" v-model="form.policeNumber" placeholder="请输入警号" :readonly="!!editingUser" /></div>
          <div v-if="!editingUser"><label class="text-sm font-medium text-gray-700 mb-1 block">密码</label><input type="password" class="wp-input" v-model="form.password" placeholder="请输入初始密码" /></div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">手机号</label>
            <input class="wp-input" v-model="form.phone" placeholder="请输入手机号"
              :readonly="editingUser && form.phoneReadonly"
              :class="{ 'opacity-60 cursor-not-allowed': editingUser && form.phoneReadonly }" />
            <span v-if="editingUser && form.phoneReadonly" class="text-xs text-amber-500 mt-0.5 block">
              <i class="fas fa-info-circle mr-1"></i>同级用户手机号只读，不可编辑
            </span>
          </div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">所属单位</label>
            <div class="relative">
              <!-- 显示选中的单位 -->
              <div class="wp-input cursor-pointer flex items-center justify-between" @click="showUnitDropdown = !showUnitDropdown">
                <span class="truncate">{{ form.org || '请选择单位' }}</span>
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
                  <div v-if="filteredUnits.length === 0" class="text-center py-4 text-gray-400 text-sm">
                    未找到匹配的单位
                  </div>
                  <div 
                    v-else
                    v-for="u in filteredUnits" 
                    :key="u.system_code || u.id"
                    class="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
                    :class="{ 'bg-blue-50 text-blue-600': form.org === u.fullName }"
                    @click="selectUnit(u)"
                  >
                    {{ u.fullName }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 点击外部关闭下拉的透明层 -->
            <div v-if="showUnitDropdown" class="fixed inset-0 z-40" @click="showUnitDropdown = false"></div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">权限级别</label>
            <select class="wp-select" v-model="form.role">
              <option value="CITY">市级 (CITY)</option>
              <option value="DISTRICT">区级 (DISTRICT)</option>
              <option value="OFFICER">基层单位 (OFFICER)</option>
            </select>
          </div>
          <div v-if="editingUser || form.role">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.isAdmin" class="w-3.5 h-3.5 accent-purple-500" />
              <span class="text-sm text-gray-700">管理员权限</span>
              <span class="text-xs text-gray-400">（勾选后可管理同级用户）</span>
            </label>
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

    <!-- Disable user confirm modal -->
    <div v-if="showDisableModal" class="wp-modal-overlay" @click.self="showDisableModal = false">
      <div class="wp-modal" style="max-width:400px">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-exclamation-triangle" :class="disableTargetUser?.is_active === false ? 'text-green-500' : 'text-red-500'"></i>
          <span class="text-lg font-bold text-gray-800">{{ disableTargetUser?.is_active === false ? '启用用户' : '禁用用户' }}</span>
        </div>
        <p class="text-sm text-gray-600 mb-4">
          <template v-if="disableTargetUser?.is_active === false">
            确认启用用户 <strong>{{ disableTargetUser?.姓名 || disableTargetUser?.name || '' }}</strong>？
            <br>启用后该用户可以正常登录此平台。
          </template>
          <template v-else>
            确认禁用用户 <strong>{{ disableTargetUser?.姓名 || disableTargetUser?.name || '' }}</strong>？
            <br>禁用后该用户将无法登录此平台。
          </template>
        </p>
        <div class="flex gap-3 justify-end">
          <button class="wp-btn wp-btn-secondary" @click="showDisableModal = false">取消</button>
          <button class="wp-btn" :class="disableTargetUser?.is_active === false ? 'wp-btn-success' : 'wp-btn-danger'" :disabled="submittingDisable" @click="handleDisableUser">
            <i v-if="submittingDisable" class="fas fa-spinner fa-spin mr-1"></i>
            {{ disableTargetUser?.is_active === false ? '确认启用' : '确认禁用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getUserList, createUser, updateUser, deleteUser, resetPassword, getOrgList } from '@/api/setting'
import { getMenu } from '@/api/config'

const currentUser = ref(null)

const levelRank = (level) => {
  if (level === 'CITY') return 3
  if (level === 'DISTRICT') return 2
  if (level === 'OFFICER') return 1
  return 0
}

const canEdit = (targetUser) => {
  if (!currentUser.value) return false
  const viewerLevel = levelRank(currentUser.value.permission_level)
  const targetLevel = levelRank(targetUser.role || targetUser.permission_level || '')
  
  // 不能操作更高级别的用户
  if (viewerLevel < targetLevel) return false
  // 非admin不能操作同级
  if (!currentUser.value.is_admin && viewerLevel === targetLevel) return false
  // admin不能操作同级admin
  if (currentUser.value.is_admin && targetUser.is_admin && viewerLevel === targetLevel) return false
  
  return true
}

const showPhone = (targetUser) => {
  if (!currentUser.value) return false
  const viewerLevel = levelRank(currentUser.value.permission_level)
  const targetLevel = levelRank(targetUser.role || targetUser.permission_level || '')
  
  // 不同级（上级看下级）：可见
  if (viewerLevel !== targetLevel) return true
  // 同级：仅admin可见
  return currentUser.value.is_admin
}

const users = ref([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const editingUser = ref(null)
const units = ref([])
const unitSearchKeyword = ref('')
const showUnitDropdown = ref(false)

// 过滤后的单位列表（根据搜索关键词）
const filteredUnits = computed(() => {
  if (!unitSearchKeyword.value.trim()) {
    return units.value
  }
  const keyword = unitSearchKeyword.value.toLowerCase().trim()
  return units.value.filter(u => {
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

const form = ref({ name: '', policeNumber: '', password: '', phone: '', org: '', role: 'OFFICER', isAdmin: false, phoneReadonly: false })

let debounceTimer = null

const roleBadge = (role) => {
  if (role === 'CITY' || role === '市级') return 'wp-badge-red'
  if (role === 'DISTRICT' || role === '区级') return 'wp-badge-blue'
  return 'wp-badge-gray'
}

const debounceSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadUsers() }, 400)
}

const goPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  loadUsers()
}

const loadUnits = async () => {
  try {
    const res = await getOrgList({ page_size: 10000 }) // 获取所有单位，使用大数避免分页
    if (res.success) {
      // 获取全部单位列表（无分页，用于下拉选择）
      const list = res.data?.list || res.data || []
      units.value = list.map(u => {
        const parts = [u.level1, u.level2, u.level3].filter(Boolean)
        return { ...u, fullName: parts.join(' / ') }
      })
    } else {
      console.error('获取单位列表失败:', res.message)
    }
  } catch (err) {
    console.error('获取单位列表异常:', err)
  }
}

// 选择单位
const selectUnit = (unit) => {
  form.value.org = unit.fullName
  showUnitDropdown.value = false
  unitSearchKeyword.value = '' // 清空搜索关键词
}



// 根据 unit_id 获取单位完整层级名
const getUnitFullName = (unitId) => {
  if (unitId == null) return ''
  const unit = units.value.find(u => u.id === unitId)
  return unit ? unit.fullName : ''
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({ page: page.value, limit: pageSize.value, keyword: searchKeyword.value })
    if (res.success) {
      users.value = res.data?.list || res.data || []
      totalCount.value = res.data?.total || res.total || 0
      totalPages.value = Math.max(1, Math.ceil(totalCount.value / pageSize.value))
    }
  } catch {}
  loading.value = false
}

const openCreateModal = () => {
  editingUser.value = null
  form.value = { name: '', policeNumber: '', password: '', phone: '', org: '', role: 'OFFICER', isAdmin: false, phoneReadonly: false }
  // 重置单位搜索状态
  unitSearchKeyword.value = ''
  showUnitDropdown.value = false
  showModal.value = true
}

const openEditModal = (user) => {
  editingUser.value = user
  let matchedFullName = ''
  // 按 unit_id 匹配
  if (user.unit_id != null) {
    const match = units.value.find(u => u.id === user.unit_id)
    if (match) matchedFullName = match.fullName
  }
  // 权限级别映射：中文转英文
  let roleValue = user.role || 'OFFICER'
  if (!roleValue || (roleValue !== 'CITY' && roleValue !== 'DISTRICT' && roleValue !== 'OFFICER')) {
    // 可能是中文，尝试映射
    const chineseRole = user['权限级别'] || ''
    if (chineseRole === '市级') roleValue = 'CITY'
    else if (chineseRole === '区级') roleValue = 'DISTRICT'
    else if (chineseRole === '基层单位') roleValue = 'OFFICER'
    else roleValue = 'OFFICER'
  }
  
  form.value = {
    name: user['姓名'] || user.name || '',
    policeNumber: user['警号'] || user.police_number || '',
    password: '',
    phone: user.phone || '',
    org: matchedFullName,
    role: roleValue,
    isAdmin: user.is_admin === true,
    phoneReadonly: user.phone_editable === false
  }
  // 重置单位搜索状态
  unitSearchKeyword.value = ''
  showUnitDropdown.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
  // 重置单位搜索状态
  unitSearchKeyword.value = ''
  showUnitDropdown.value = false
}

const handleSave = async () => {
  submitting.value = true
  try {
    // 通过 fullName 找到匹配的 unit 对象，提取 unit_id
    let unitId = null
    if (form.value.org) {
      const unit = units.value.find(u => u.fullName === form.value.org)
      if (unit) unitId = unit.id
    }
    const data = { 
      name: form.value.name, 
      police_number: form.value.policeNumber, 
      phone: form.value.phone,
      unit_name: form.value.org, 
      unit_id: unitId,
      permission_level: form.value.role,
      is_admin: form.value.isAdmin || false
    }
    if (editingUser.value) {
      await updateUser({ ...data, id: editingUser.value.id || editingUser.value['警号'] })
    } else {
      await createUser({ ...data, password: form.value.password })
    }
    closeModal()
    loadUsers()
  } catch (e) {
    alert(e.message || '操作失败')
  }
  submitting.value = false
}

const handleResetPwd = async (user) => {
  const newPwd = prompt('请输入新密码：')
  if (!newPwd) return
  try {
    await resetPassword({ id: user.id || user['警号'], password: newPwd })
    alert('密码重置成功')
  } catch {}
}

const handleDelete = async (user) => {
  if (!confirm(`确认删除用户 ${user['姓名'] || user.name}？`)) return
  try {
    await deleteUser({ id: user.id || user['警号'] })
    loadUsers()
  } catch {}
}

// Disable user state
const showDisableModal = ref(false)
const submittingDisable = ref(false)
const disableTargetUser = ref(null)

const confirmToggleStatus = (user) => {
  disableTargetUser.value = user
  showDisableModal.value = true
}

const handleDisableUser = async () => {
  if (!disableTargetUser.value) return
  submittingDisable.value = true
  const isCurrentlyActive = disableTargetUser.value.is_active !== false && disableTargetUser.value['状态'] !== '已禁用'
  try {
    await updateUser({ id: disableTargetUser.value.id || disableTargetUser.value['警号'], is_active: !isCurrentlyActive })
    showDisableModal.value = false
    disableTargetUser.value = null
    loadUsers()
  } catch (e) {
    alert(e.message || '操作失败')
  }
  submittingDisable.value = false
}

onMounted(async () => { 
  try {
    const res = await getMenu()
    if (res.success) {
      currentUser.value = res.data?.user || null
    }
  } catch {}
  await loadUnits()
  loadUsers() 
})
</script>
