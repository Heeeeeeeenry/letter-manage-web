<template>
  <!-- Loading overlay -->
  <div v-if="pageLoading" class="page-loading-overlay" :class="{ 'fade-out': fadeOutLoading }">
    <div class="loading-pinwheel">
      <div class="pinwheel-blade"></div>
      <div class="pinwheel-center"></div>
    </div>
    <div class="loading-text">正在加载...</div>
  </div>

  <div v-show="!pageLoading || !fadeOutLoading" class="workplace-container">
    <!-- Header -->
    <header class="workplace-header">
      <div class="flex items-center">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition mr-4"
          @click="toggleSidebar"
        >
          <i class="fas fa-bars text-gray-600 text-lg"></i>
        </button>
        <h1 class="text-xl font-bold text-gray-800">民意智感中心</h1>
      </div>

      <div class="flex items-center space-x-4">
        <button class="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition">
          <i class="fas fa-bell text-gray-600 text-lg"></i>
          <span class="notification-badge"></span>
        </button>
        <div class="flex items-center px-4 py-2 bg-gray-50 rounded-xl">
          <i class="fas fa-user text-gray-500 mr-2"></i>
          <span class="text-gray-700 font-medium">{{ currentUser?.name || '管理员' }}</span>
        </div>
      </div>
    </header>

    <!-- Body -->
    <div class="workplace-body">
      <!-- Sidebar -->
      <aside class="workplace-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <nav class="p-4 pt-6">
          <template v-for="(group, index) in menuData" :key="index">
            <div v-if="index > 0" class="pt-4 border-t border-gray-200 mt-4">
              <p class="px-4 text-xs text-gray-400 uppercase tracking-wider mb-2">{{ group.group }}</p>
            </div>
            <ul class="space-y-1">
              <li v-for="item in group.items" :key="item.id">
                <a
                  href="#"
                  class="menu-item flex items-center px-4 py-3 rounded-xl transition"
                  :class="[
                    item.is_action
                      ? 'text-red-600 hover:bg-red-50'
                      : currentRoute === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                  ]"
                  @click.prevent="handleMenuClick(item)"
                >
                  <i :class="['fas', item.icon, 'w-6']"></i>
                  <span class="font-medium">{{ item.name }}</span>
                </a>
              </li>
            </ul>
          </template>
        </nav>
      </aside>

      <!-- Main content -->
      <main class="workplace-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getMenu } from '@/api/config'
import { logout } from '@/api/auth'
import { resetAuthCache } from '@/router'

const router = useRouter()
const route = useRoute()

const pageLoading = ref(true)
const fadeOutLoading = ref(false)
const sidebarCollapsed = ref(false)
const menuData = ref([])
const currentUser = ref(null)

const currentRoute = computed(() => route.name)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleMenuClick = async (item) => {
  if (item.is_action) {
    if (item.id === 'logout') {
      await handleLogout()
    }
    return
  }
  router.push(`/${item.id}`)
}

const handleLogout = async () => {
  try {
    await logout()
    resetAuthCache()
    router.push('/login')
  } catch {
    resetAuthCache()
    router.push('/login')
  }
}

const loadMenu = async () => {
  try {
    const res = await getMenu()
    if (res.success) {
      let menu = res.data.menu || []
      // 调换“处理工作台”和“下发工作台”的位置
      menu.forEach(group => {
        if (group.group === '业务办理') {
          const processingIdx = group.items.findIndex(i => i.id === 'processing')
          const dispatchIdx = group.items.findIndex(i => i.id === 'dispatch')
          if (processingIdx !== -1 && dispatchIdx !== -1) {
            const temp = group.items[processingIdx]
            group.items[processingIdx] = group.items[dispatchIdx]
            group.items[dispatchIdx] = temp
          }
        }
      })
      menuData.value = menu
      currentUser.value = res.data.user || null
    }
  } catch (e) {
    console.error('Failed to load menu:', e)
  }
}

onMounted(async () => {
  await loadMenu()

  // Animate out loading overlay
  setTimeout(() => {
    fadeOutLoading.value = true
    setTimeout(() => {
      pageLoading.value = false
    }, 600)
  }, 500)
})
</script>
