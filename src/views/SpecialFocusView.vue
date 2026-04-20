<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe)">
          <i class="fas fa-star text-purple-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">专项关注</div>
          <div class="text-xs text-gray-400 mt-0.5">专项关注标签管理</div>
        </div>
      </div>
      <button class="wp-btn wp-btn-primary" @click="openCreateModal">
        <i class="fas fa-plus"></i>新建标签
      </button>
    </div>

    <div class="wp-panel flex-1">
      <div class="wp-panel-body">
        <div v-if="loading" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</div>
        <div v-else-if="!items.length" class="text-center py-12 text-gray-400">
          <i class="fas fa-star text-4xl mb-2 block text-gray-200"></i>暂无专项关注标签
        </div>
        <div v-else class="flex flex-wrap gap-3">
          <div
            v-for="item in items"
            :key="item.id"
            class="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-purple-200 transition group"
          >
            <span class="wp-badge wp-badge-purple">{{ item['专项关注标题'] || item.title }}</span>
            <span class="text-sm text-gray-600">{{ item['专项关注描述'] || item.description }}</span>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-100 text-purple-500" @click="openEditModal(item)">
                <i class="fas fa-edit text-xs"></i>
              </button>
              <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500" @click="handleDelete(item)">
                <i class="fas fa-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="wp-modal-overlay" @click.self="closeModal">
      <div class="wp-modal" style="max-width:460px">
        <div class="flex items-center justify-between mb-6">
          <div class="font-bold text-gray-800 text-lg">{{ editingItem ? '编辑标签' : '新建标签' }}</div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">标签名称</label><input class="wp-input" v-model="form.title" placeholder="请输入标签名称" /></div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">标签描述</label><textarea class="wp-input resize-none" rows="3" v-model="form.description" placeholder="请输入描述（可选）"></textarea></div>
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
import { getSpecialFocusList, createSpecialFocus, updateSpecialFocus, deleteSpecialFocus } from '@/api/setting'

const items = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ title: '', description: '' })

const openCreateModal = () => {
  editingItem.value = null
  form.value = { title: '', description: '' }
  showModal.value = true
}

const openEditModal = (item) => {
  editingItem.value = item
  form.value = { title: item['专项关注标题'] || item.title || '', description: item['专项关注描述'] || item.description || '' }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editingItem.value = null }

const handleSave = async () => {
  submitting.value = true
  try {
    if (editingItem.value) {
      await updateSpecialFocus({ id: editingItem.value.id, title: form.value.title, description: form.value.description })
    } else {
      await createSpecialFocus({ title: form.value.title, description: form.value.description })
    }
    closeModal()
    load()
  } catch {}
  submitting.value = false
}

const handleDelete = async (item) => {
  if (!confirm(`确认删除标签"${item['专项关注标题'] || item.title}"？`)) return
  try { await deleteSpecialFocus({ id: item.id }); load() } catch {}
}

const load = async () => {
  loading.value = true
  try {
    const res = await getSpecialFocusList()
    if (res.success) items.value = res.data || []
  } catch {}
  loading.value = false
}

onMounted(load)
</script>
