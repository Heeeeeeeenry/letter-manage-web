<template>
  <div class="h-full flex flex-col gap-5">
    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <div class="relative z-10">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ greeting.emoji }}</span>
          <span class="text-blue-100 text-base">{{ greeting.text }}</span>
        </div>
        <h2 class="text-3xl font-bold text-white mb-2">
          欢迎回来，{{ userInfo?.name || '管理员' }}
        </h2>
        <p class="text-blue-100 text-sm">
          {{ userInfo?.org || '' }}
          <span v-if="userInfo?.role" class="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">{{ userInfo.role }}</span>
        </p>
      </div>
      <div class="absolute top-4 right-8 text-right z-10">
        <div class="text-white/80 text-sm mb-1">{{ currentDate }}</div>
        <div class="text-white text-3xl font-mono font-bold">{{ currentTime }}</div>
      </div>
    </div>

    <!-- Time filter -->
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-500">统计周期：</span>
      <div class="flex gap-2">
        <button
          v-for="p in periods"
          :key="p.value"
          class="wp-filter-chip"
          :class="{ active: currentPeriod === p.value }"
          @click="changePeriod(p.value)"
        >{{ p.label }}</button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="wp-stat-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
            <i class="fas fa-envelope text-blue-600"></i>
          </div>
          <span class="text-xs text-gray-400">信件总量</span>
        </div>
        <div class="wp-stat-value">{{ stats.total ?? '-' }}</div>
        <div class="wp-stat-label">信件总量</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" style="width:75%"></div>
        </div>
      </div>

      <div class="wp-stat-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#fef9c3,#fef08a)">
            <i class="fas fa-clock text-yellow-600"></i>
          </div>
          <span class="text-xs text-gray-400">预处理</span>
        </div>
        <div class="wp-stat-value">{{ stats.preprocessing ?? '-' }}</div>
        <div class="wp-stat-label">预处理中</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" style="background:#eab308;width:60%"></div>
        </div>
      </div>

      <div class="wp-stat-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0)">
            <i class="fas fa-spinner text-green-600"></i>
          </div>
          <span class="text-xs text-gray-400">正在处理</span>
        </div>
        <div class="wp-stat-value">{{ stats.processing ?? '-' }}</div>
        <div class="wp-stat-label">正在处理</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" style="background:#22c55e;width:45%"></div>
        </div>
      </div>

      <div class="wp-stat-card">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe)">
            <i class="fas fa-comments text-purple-600"></i>
          </div>
          <span class="text-xs text-gray-400">正在反馈</span>
        </div>
        <div class="wp-stat-value">{{ stats.feedbacking ?? '-' }}</div>
        <div class="wp-stat-label">正在反馈</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" style="background:#8b5cf6;width:85%"></div>
        </div>
      </div>
    </div>

    <!-- Recent letters -->
    <div class="wp-panel flex-1">
      <div class="wp-panel-header">
        <div class="flex items-center gap-3">
          <div class="wp-panel-icon">
            <i class="fas fa-list-ul"></i>
          </div>
          <div>
            <div class="wp-panel-title">最近信件</div>
            <div class="text-xs text-gray-400 mt-0.5">最新收到的信件</div>
          </div>
        </div>
        <button class="wp-btn wp-btn-secondary text-xs" @click="$router.push('/letters')">
          <i class="fas fa-arrow-right"></i>查看全部
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="wp-table">
          <thead>
            <tr>
              <th>编号</th>
              <th>来信人</th>
              <th>手机</th>
              <th>渠道</th>
              <th>分类</th>
              <th>状态</th>
              <th>来信时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentLetters.length === 0">
              <td colspan="7" class="text-center text-gray-400 py-8">暂无数据</td>
            </tr>
            <tr
              v-for="letter in recentLetters"
              :key="letter['信件编号']"
              @click="$router.push('/letters')"
            >
              <td class="font-mono text-xs text-blue-600">{{ letter['信件编号'] }}</td>
              <td>{{ letter['群众姓名'] }}</td>
              <td>{{ letter['手机号'] }}</td>
              <td>{{ letter['来源渠道'] }}</td>
              <td class="text-xs">{{ letter['信件三级分类'] || letter['信件二级分类'] || letter['信件一级分类'] }}</td>
              <td><StatusBadge :status="letter['信件状态']" /></td>
              <td class="text-xs text-gray-500">{{ formatTime(letter['来信时间']) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getList, getStatistics } from '@/api/letter'
import StatusBadge from '@/components/StatusBadge.vue'

const userInfo = ref(null)
const stats = ref({})
const recentLetters = ref([])
const currentPeriod = ref('day')
const currentTime = ref('')
const currentDate = ref('')
const pollingTimer = ref(null)

const periods = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '今年' },
]

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return { text: '夜深了，注意休息', emoji: '🌙' }
  if (hour < 9) return { text: '早上好，开始新的一天', emoji: '🌅' }
  if (hour < 12) return { text: '上午好，工作顺利', emoji: '☀️' }
  if (hour < 14) return { text: '中午好，记得休息', emoji: '🌤' }
  if (hour < 18) return { text: '下午好，继续加油', emoji: '💪' }
  return { text: '晚上好，辛苦了', emoji: '🌆' }
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour12: false })
  currentDate.value = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const loadStats = async () => {
  try {
    const res = await getStatistics({ period: currentPeriod.value })
    if (res.success) {
      const d = res.data || {}
      stats.value = {
        total: d['信件总量'] ?? 0,
        preprocessing: d['预处理'] ?? 0,
        processing: d['正在处理'] ?? 0,
        feedbacking: d['正在反馈'] ?? 0,
      }
    }
  } catch {}
}

const loadUserInfo = async () => {
  try {
    const { getMenu } = await import('@/api/config')
    const res = await getMenu()
    if (res.success) {
      userInfo.value = res.data.user || null
    }
  } catch {}
}

const loadRecentLetters = async () => {
  try {
    const res = await getList({ limit: 10, page: 1, order_by: '来信时间', order_desc: true })
    if (res.success) {
      recentLetters.value = res.data?.list || res.data || []
    }
  } catch {}
}

const changePeriod = async (period) => {
  currentPeriod.value = period
  await loadStats()
}

onMounted(async () => {
  updateTime()
  setInterval(updateTime, 1000)
  await loadUserInfo()
  await Promise.all([loadStats(), loadRecentLetters()])
  pollingTimer.value = setInterval(loadStats, 5000)
})

onUnmounted(() => {
  if (pollingTimer.value) clearInterval(pollingTimer.value)
})
</script>
