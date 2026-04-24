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
      <div class="wp-panel-body p-0">
        <div v-if="loading" class="text-center py-8 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>加载中...</div>
        <div v-else-if="!items.length" class="text-center py-12 text-gray-400">
          <i class="fas fa-star text-4xl mb-2 block text-gray-200"></i>暂无专项关注标签
        </div>
        <table v-else class="wp-table w-full">
          <thead>
            <tr>
              <th style="width:60px">ID</th>
              <th style="width:180px">标签名称</th>
              <th>描述</th>
              <th style="width:100px">信件数量</th>
              <th style="width:150px">创建时间</th>
              <th style="width:100px" class="text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50">
              <td class="text-gray-500 text-xs font-mono">{{ item.id }}</td>
              <td>
                <span class="wp-badge wp-badge-purple">{{ item['专项关注标题'] || item.tag_name || item.title }}</span>
              </td>
              <td class="text-sm text-gray-600 max-w-0">
                <span class="truncate block">{{ item['专项关注描述'] || item.description || '-' }}</span>
              </td>
              <td class="text-center text-sm text-gray-700">-</td>
              <td class="text-xs text-gray-400 font-mono">{{ item.created_at ? formatTime(item.created_at) : '-' }}</td>
              <td class="text-center">
                <div class="flex gap-1 justify-center">
                  <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 text-blue-500" @click="viewLetters(item)" title="查看信件">
                    <i class="fas fa-list text-xs"></i>
                  </button>
                  <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-100 text-purple-500" @click="openEditModal(item)" title="编辑">
                    <i class="fas fa-edit text-xs"></i>
                  </button>
                  <button class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-500" @click="handleDelete(item)" title="删除">
                    <i class="fas fa-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const openCreateModal = () => {
  editingItem.value = null
  form.value = { title: '', description: '' }
  showModal.value = true
}

const openEditModal = (item) => {
  editingItem.value = item
  form.value = { title: item['专项关注标题'] || item.tag_name || item.title || '', description: item['专项关注描述'] || item.description || '' }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editingItem.value = null }

const handleSave = async () => {
  submitting.value = true
  try {
    if (editingItem.value) {
      await updateSpecialFocus({ id: editingItem.value.id, tag_name: form.value.title, description: form.value.description })
    } else {
      await createSpecialFocus({ tag_name: form.value.title, description: form.value.description })
    }
    closeModal()
    load()
  } catch (e) {
    console.error('保存标签失败:', e)
    alert('保存失败: ' + (e.message || '未知错误'))
  }
  submitting.value = false
}

const viewLetters = (item) => {
  alert(`查看标签 "${item['专项关注标题'] || item.tag_name || item.title}" 的信件列表（功能待实现）`)
}

const handleDelete = async (item) => {
  if (!confirm(`确认删除标签"${item['专项关注标题'] || item.tag_name || item.title}"？`)) return
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
