<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-sitemap text-blue-600"></i></div>
        <div>
          <div class="wp-panel-title">组织管理</div>
          <div class="text-xs text-gray-400 mt-0.5">单位树形结构</div>
        </div>
      </div>
      <button class="wp-btn wp-btn-primary" @click="openCreateModal(null)">
        <i class="fas fa-plus"></i>新建单位
      </button>
    </div>

    <div class="flex gap-4 flex-1 overflow-hidden">
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
            <InfoRow label="单位名称" :value="selectedOrg['一级'] || selectedOrg.name" />
            <InfoRow label="单位编码" :value="selectedOrg.code" />
            <InfoRow label="上级单位" :value="parentName" />
            <InfoRow label="层级" :value="selectedOrg.level" />
          </div>
        </template>
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
            <input class="wp-input" :value="parentOrg['一级'] || parentOrg.name" readonly />
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
import { ref, computed, onMounted } from 'vue'
import { getOrgList, createOrg, updateOrg, deleteOrg } from '@/api/setting'
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

const topLevelOrgs = computed(() => orgs.value.filter(o => !o.parent_id))
const parentName = computed(() => {
  if (!selectedOrg.value?.parent_id) return '顶级单位'
  const p = orgs.value.find(o => o.id === selectedOrg.value.parent_id)
  return p?.['一级'] || p?.name || '-'
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
  form.value = { name: org['一级'] || org.name || '', code: org.code || '' }
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
  if (!confirm(`确认删除单位 ${org['一级'] || org.name}？`)) return
  try { await deleteOrg({ id: org.id }); loadOrgs(); selectedOrg.value = null } catch {}
}

const loadOrgs = async () => {
  loading.value = true
  try {
    const res = await getOrgList({})
    if (res.success) orgs.value = res.data || []
  } catch {}
  loading.value = false
}

onMounted(loadOrgs)
</script>
