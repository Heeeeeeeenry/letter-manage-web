<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#ffedd5,#fed7aa)">
          <i class="fas fa-tags text-orange-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">分类管理</div>
          <div class="text-xs text-gray-400 mt-0.5">三级分类管理</div>
        </div>
      </div>
      <button class="wp-btn wp-btn-primary" @click="openCreateModal(null, null)">
        <i class="fas fa-plus"></i>新建一级分类
      </button>
    </div>

    <div class="wp-panel flex-1 overflow-hidden">
      <div class="flex h-full">
        <!-- Level 1 -->
        <div class="border-r border-gray-100 flex flex-col" style="width:200px;flex-shrink:0">
          <div class="p-3 border-b border-gray-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500 uppercase">一级分类</span>
            <button class="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500" @click="openCreateModal(null, null)">
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div class="wp-scroll">
            <div
              v-for="l1 in level1List"
              :key="l1.id"
              class="wp-tree-node text-sm"
              :class="{ active: selectedL1?.id === l1.id }"
              @click="selectL1(l1)"
            >
              <i class="fas fa-folder text-sm text-yellow-500"></i>
              <span class="flex-1">{{ l1.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-400"
                @click.stop="handleDelete(l1, 1)">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Level 2 -->
        <div class="border-r border-gray-100 flex flex-col" style="width:200px;flex-shrink:0">
          <div class="p-3 border-b border-gray-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500 uppercase">二级分类</span>
            <button
              v-if="selectedL1"
              class="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500"
              @click="openCreateModal(selectedL1, null)"
            >
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div class="wp-scroll">
            <div v-if="!selectedL1" class="text-center text-xs text-gray-400 py-6">请先选择一级分类</div>
            <div
              v-for="l2 in level2List"
              :key="l2.id"
              class="wp-tree-node text-sm group"
              :class="{ active: selectedL2?.id === l2.id }"
              @click="selectL2(l2)"
            >
              <i class="fas fa-folder-open text-sm text-blue-400"></i>
              <span class="flex-1">{{ l2.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-400"
                @click.stop="handleDelete(l2, 2)">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Level 3 -->
        <div class="flex flex-col flex-1">
          <div class="p-3 border-b border-gray-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-500 uppercase">三级分类</span>
            <button
              v-if="selectedL2"
              class="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-500"
              @click="openCreateModal(selectedL1, selectedL2)"
            >
              <i class="fas fa-plus text-xs"></i>
            </button>
          </div>
          <div class="wp-scroll">
            <div v-if="!selectedL2" class="text-center text-xs text-gray-400 py-6">请先选择二级分类</div>
            <div
              v-for="l3 in level3List"
              :key="l3.id"
              class="wp-tree-node text-sm group"
              :class="{ active: selectedL3?.id === l3.id }"
              @click="selectedL3 = l3"
            >
              <i class="fas fa-tag text-sm text-green-400"></i>
              <span class="flex-1">{{ l3.name }}</span>
              <button class="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-red-400"
                @click.stop="handleDelete(l3, 3)">
                <i class="fas fa-times text-xs"></i>
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
          <div class="font-bold text-gray-800 text-lg">新建分类</div>
          <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500" @click="closeModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div v-if="createParentL1">
            <label class="text-sm text-gray-500 mb-1 block">上级一级分类</label>
            <input class="wp-input" :value="createParentL1.name" readonly />
          </div>
          <div v-if="createParentL2">
            <label class="text-sm text-gray-500 mb-1 block">上级二级分类</label>
            <input class="wp-input" :value="createParentL2.name" readonly />
          </div>
          <div><label class="text-sm font-medium text-gray-700 mb-1 block">分类名称</label><input class="wp-input" v-model="form.name" placeholder="请输入分类名称" /></div>
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
import { getCategoryList, createCategory, deleteCategory } from '@/api/setting'

const rawData = ref([])
const loading = ref(false)
const submitting = ref(false)
const showModal = ref(false)
const form = ref({ name: '' })
const createParentL1 = ref(null)
const createParentL2 = ref(null)
const selectedL1 = ref(null)
const selectedL2 = ref(null)
const selectedL3 = ref(null)

const level1List = computed(() => rawData.value.filter(d => !d.parent_id && d.level === 1))
const level2List = computed(() => rawData.value.filter(d => d.parent_id === selectedL1.value?.id && d.level === 2))
const level3List = computed(() => rawData.value.filter(d => d.parent_id === selectedL2.value?.id && d.level === 3))

const selectL1 = (l1) => { selectedL1.value = l1; selectedL2.value = null; selectedL3.value = null }
const selectL2 = (l2) => { selectedL2.value = l2; selectedL3.value = null }

const openCreateModal = (l1, l2) => {
  createParentL1.value = l1
  createParentL2.value = l2
  form.value = { name: '' }
  showModal.value = true
}

const closeModal = () => { showModal.value = false }

const handleSave = async () => {
  submitting.value = true
  try {
    const level = createParentL2.value ? 3 : createParentL1.value ? 2 : 1
    const parent_id = createParentL2.value?.id || createParentL1.value?.id || null
    await createCategory({ name: form.value.name, level, parent_id })
    closeModal()
    load()
  } catch {}
  submitting.value = false
}

const handleDelete = async (item, level) => {
  if (!confirm(`确认删除分类"${item.name}"？`)) return
  try {
    await deleteCategory({ id: item.id })
    if (level === 1) { selectedL1.value = null; selectedL2.value = null; selectedL3.value = null }
    if (level === 2) { selectedL2.value = null; selectedL3.value = null }
    if (level === 3) selectedL3.value = null
    load()
  } catch {}
}

const load = async () => {
  loading.value = true
  try {
    const res = await getCategoryList()
    if (res.success) rawData.value = res.data || []
  } catch {}
  loading.value = false
}

onMounted(load)
</script>
