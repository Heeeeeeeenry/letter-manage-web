<template>
  <div class="h-full flex flex-col gap-4 old-system">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-sitemap text-blue-600"></i></div>
        <div>
          <div class="wp-panel-title">组织管理</div>
          <div class="text-xs text-gray-400 mt-0.5">单位树形结构与下发权限</div>
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
    <div v-if="activeTab === 'units'" class="flex gap-4 flex-1 overflow-hidden">
      <!-- Tree -->
      <div class="wp-panel flex flex-col" style="width:320px;flex-shrink:0">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">单位列表</span>
          <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadOrgs">
            <i class="fas fa-sync-alt" :class="{'fa-spin': loading}"></i>
          </button>
        </div>
        <div class="wp-scroll p-3">
          <div v-if="loading" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin"></i></div>
          <div v-else-if="!orgs.length" class="text-center py-8 text-gray-400">暂无数据</div>
          <OrgTreeNode
            v-for="org in topLevelOrgs"
            :key="org.id"
            :node="org"
            :all-nodes="orgs"
            :selected-id="selectedOrg?.id"
            @select="selectOrg"
          />
        </div>
      </div>

      <!-- Detail -->
      <div class="wp-panel flex-1">
        <div v-if="!selectedOrg" class="h-full flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            请从左侧选择单位
          </div>
        </div>
        <template v-else>
          <div class="wp-panel-header compact">
            <div class="text-sm font-semibold">单位详情</div>
            <div class="flex gap-2">
              <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="openCreateModal(selectedOrg)">
                <i class="fas fa-plus"></i>添加子单位
              </button>
              <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="openEditModal(selectedOrg)">
                <i class="fas fa-edit"></i>编辑
              </button>
              <button class="wp-btn wp-btn-danger text-xs py-1 px-2" @click="handleDelete(selectedOrg)">
                <i class="fas fa-trash"></i>删除
              </button>
            </div>
          </div>
          <div class="wp-panel-body space-y-3">
            <InfoRow label="单位名称" :value="selectedOrg.level1 || selectedOrg.name" />
            <InfoRow label="单位编码" :value="selectedOrg.system_code" />
            <InfoRow label="上级单位" :value="parentName" />
            <InfoRow label="层级" :value="selectedOrg.level" />
          </div>
        </template>
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
    if (res.success) orgs.value = res.data?.list || []
    console.log('orgs:', orgs.value)
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
