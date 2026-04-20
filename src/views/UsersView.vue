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
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</td></tr>
            <tr v-else-if="users.length === 0"><td colspan="6" class="text-center py-12 text-gray-400"><i class="fas fa-users text-4xl mb-2 block"></i>暂无用户</td></tr>
            <tr v-for="user in users" :key="user.id || user['警号']">
              <td class="font-medium">{{ user['姓名'] || user.name }}</td>
              <td class="font-mono text-sm">{{ user['警号'] || user.police_number }}</td>
              <td>{{ user['所属单位'] || user.org }}</td>
              <td>
                <span class="wp-badge" :class="roleBadge(user['权限级别'] || user.role)">
                  {{ user['权限级别'] || user.role }}
                </span>
              </td>
              <td>
                <span class="wp-badge" :class="user['状态'] === '正常' || user.status === 'active' ? 'wp-badge-green' : 'wp-badge-red'">
                  {{ user['状态'] || (user.status === 'active' ? '正常' : '停用') }}
                </span>
              </td>
              <td>
                <div class="flex gap-2">
                  <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="openEditModal(user)">
                    <i class="fas fa-edit"></i>编辑
                  </button>
                  <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="handleResetPwd(user)">
                    <i class="fas fa-key"></i>重置密码
                  </button>
                  <button class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="handleDelete(user)">
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
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">所属单位</label><input class="wp-input" v-model="form.org" placeholder="请输入单位" /></div>
          <div>
            <label class="text-sm font-medium text-gray-700 mb-1 block">权限级别</label>
            <select class="wp-select" v-model="form.role">
              <option value="CITY">市级 (CITY)</option>
              <option value="DISTRICT">区级 (DISTRICT)</option>
              <option value="UNIT">基层单位 (UNIT)</option>
            </select>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserList, createUser, updateUser, deleteUser, resetPassword } from '@/api/setting'

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

const form = ref({ name: '', policeNumber: '', password: '', org: '', role: 'UNIT' })

let debounceTimer = null

const roleBadge = (role) => {
  if (role === 'CITY') return 'wp-badge-red'
  if (role === 'DISTRICT') return 'wp-badge-blue'
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
  form.value = { name: '', policeNumber: '', password: '', org: '', role: 'UNIT' }
  showModal.value = true
}

const openEditModal = (user) => {
  editingUser.value = user
  form.value = {
    name: user['姓名'] || user.name || '',
    policeNumber: user['警号'] || user.police_number || '',
    password: '',
    org: user['所属单位'] || user.org || '',
    role: user['权限级别'] || user.role || 'UNIT',
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingUser.value = null
}

const handleSave = async () => {
  submitting.value = true
  try {
    const data = { name: form.value.name, police_number: form.value.policeNumber, org: form.value.org, role: form.value.role }
    if (editingUser.value) {
      await updateUser({ ...data, id: editingUser.value.id || editingUser.value['警号'] })
    } else {
      await createUser({ ...data, password: form.value.password })
    }
    closeModal()
    loadUsers()
  } catch {}
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

onMounted(loadUsers)
</script>
