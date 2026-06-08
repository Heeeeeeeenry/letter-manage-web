<template>
  <div class="notification-bell" ref="bellRef">
    <button class="bell-btn" @click="toggleDropdown">
      <i class="fas fa-bell"></i>
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <div v-if="showDropdown" class="dropdown" @click.stop>
      <div class="dropdown-header">
        <span class="font-medium">消息通知</span>
        <button v-if="unreadCount > 0" class="mark-all-btn" @click="markAllRead">全部已读</button>
      </div>
      <div class="dropdown-body">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="notifications.length === 0" class="empty">暂无通知</div>
        <div
          v-for="n in notifications"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.is_read }"
          @click="openNotification(n)"
        >
          <div class="notif-icon">
            <i :class="typeIcon(n.type)" :style="{ color: typeColor(n.type) }"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title">{{ n.title }}</div>
            <div class="notif-msg">{{ n.message }}</div>
            <div class="notif-time">{{ formatTime(n.created_at) }}</div>
          </div>
          <div v-if="!n.is_read" class="unread-dot"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import http from '@/api/http'

const showDropdown = ref(false)
const unreadCount = ref(0)
const notifications = ref([])
const loading = ref(false)
const bellRef = ref(null)
let pollTimer = null

const typeIcon = (t) => ({
  dispatch: 'fas fa-paper-plane',
  handle_by_self: 'fas fa-hand-paper',
  audit: 'fas fa-check-circle',
  audit_result: 'fas fa-clipboard-check',
}[t] || 'fas fa-bell')

const typeColor = (t) => ({
  dispatch: '#f59e0b',
  handle_by_self: '#8b5cf6',
  audit: '#3b82f6',
  audit_result: '#10b981',
}[t] || '#6b7280')

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.toLocaleDateString()
}

async function fetchUnreadCount() {
  try {
    const res = await http.get('/api/notification/unread_count')
    if (res?.success || res?.data !== undefined) {
      unreadCount.value = (res.data || res)?.count || 0
    }
  } catch {}
}

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await http.get('/api/notification/list?limit=20')
    if (res?.success || Array.isArray(res?.data)) {
      notifications.value = res.data || res || []
    }
  } catch {}
  loading.value = false
}

async function markAllRead() {
  try { await http.post('/api/notification/read_all') } catch {}
  notifications.value.forEach(n => n.is_read = true)
  unreadCount.value = 0
}

async function openNotification(n) {
  if (!n.is_read) {
    try { await http.post(`/api/notification/read/${n.id}`) } catch {}
    n.is_read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  // 通过事件通知父组件跳转到对应信件
  window.dispatchEvent(new CustomEvent('notification-click', { detail: n }))
  showDropdown.value = false
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) fetchNotifications()
}

function onClickOutside(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  fetchUnreadCount()
  pollTimer = setInterval(fetchUnreadCount, 10000)
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.notification-bell { position: relative; }
.bell-btn {
  position: relative; background: none; border: none; color: #4b5563;
  font-size: 18px; cursor: pointer; padding: 4px 8px; border-radius: 6px;
}
.bell-btn:hover { background: #f3f4f6; color: #1f2937; }
.badge {
  position: absolute; top: -2px; right: -2px;
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
  min-width: 18px; height: 18px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
.dropdown {
  position: absolute; right: 0; top: 100%; margin-top: 8px;
  width: 360px; max-height: 480px; background: #fff;
  border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.12);
  z-index: 1000; overflow: hidden; display: flex; flex-direction: column;
}
.dropdown-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid #f3f4f6; font-size: 14px;
}
.mark-all-btn { font-size: 12px; color: #3b82f6; background: none; border: none; cursor: pointer; }
.mark-all-btn:hover { text-decoration: underline; }
.dropdown-body { overflow-y: auto; flex: 1; }
.loading, .empty { padding: 32px; text-align: center; color: #9ca3af; font-size: 14px; }
.notif-item {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px;
  cursor: pointer; border-bottom: 1px solid #f9fafb; transition: background 0.15s;
}
.notif-item:hover { background: #f9fafb; }
.notif-item.unread { background: #eff6ff; }
.notif-icon { font-size: 16px; width: 20px; text-align: center; margin-top: 2px; }
.notif-content { flex: 1; min-width: 0; }
.notif-title { font-size: 13px; font-weight: 600; color: #1f2937; margin-bottom: 2px; }
.notif-msg { font-size: 12px; color: #6b7280; line-height: 1.4; }
.notif-time { font-size: 11px; color: #9ca3af; margin-top: 4px; }
.unread-dot {
  width: 8px; height: 8px; border-radius: 50%; background: #3b82f6;
  flex-shrink: 0; margin-top: 6px;
}
</style>
