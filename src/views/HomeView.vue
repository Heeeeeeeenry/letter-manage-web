<template>
  <div class="h-full overflow-y-auto">
    <div class="flex flex-col gap-5">
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

    <!-- View mode toggle + Time filter -->
    <div class="flex items-center justify-between gap-3">
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
      <div class="flex bg-gray-100 rounded-xl p-0.5 gap-0.5 shadow-sm ml-auto" v-if="isDistrict() || isCity()">
        <button
          class="px-4 py-2 text-sm rounded-lg transition-all duration-150 font-medium"
          :class="viewMode === 'personal' ? 'bg-white text-blue-600 shadow-md font-semibold' : 'text-gray-500 hover:text-gray-700'"
          @click="viewMode = 'personal'; refreshData()"
        >个人</button>
        <button
          class="px-4 py-2 text-sm rounded-lg transition-all duration-150 font-medium"
          :class="viewMode === 'unit' ? 'bg-white text-blue-600 shadow-md font-semibold' : 'text-gray-500 hover:text-gray-700'"
          @click="viewMode = 'unit'; refreshData()"
        >单位</button>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters('')">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
            <i class="fas fa-envelope text-blue-600"></i>
          </div>
          <span class="text-xs text-gray-400">信件总量</span>
        </div>
        <div class="wp-stat-value">{{ stats.total ?? '-' }}</div>
        <div class="wp-stat-label">信件总量</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" :style="{ width: stats.total > 0 ? '100%' : '0%' }"></div>
        </div>
      </div>

      <div class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters('预处理')">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#fef9c3,#fef08a)">
            <i class="fas fa-clock text-yellow-600"></i>
          </div>
          <span class="text-xs text-gray-400">预处理</span>
        </div>
        <div class="wp-stat-value">{{ stats.preprocessing ?? '-' }}</div>
        <div class="wp-stat-label">预处理中</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" style="background:#eab308" :style="{ width: stats.total > 0 ? (stats.preprocessing / stats.total * 100) + '%' : '0%', background: '#eab308' }"></div>
        </div>
      </div>

      <div class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters('处理中')">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#dcfce7,#bbf7d0)">
            <i class="fas fa-spinner text-green-600"></i>
          </div>
          <span class="text-xs text-gray-400">处理中</span>
        </div>
        <div class="wp-stat-value">{{ stats.processing ?? '-' }}</div>
        <div class="wp-stat-label">处理中</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" :style="{ width: stats.total > 0 ? (stats.processing / stats.total * 100) + '%' : '0%', background: '#22c55e' }"></div>
        </div>
      </div>

      <div class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters('待分县局/支队审核')">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe)">
            <i class="fas fa-comments text-purple-600"></i>
          </div>
          <span class="text-xs text-gray-400">待分县局/支队审核</span>
        </div>
        <div class="wp-stat-value">{{ stats.feedbacking ?? '-' }}</div>
        <div class="wp-stat-label">待分县局/支队审核</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" :style="{ width: stats.total > 0 ? (stats.feedbacking / stats.total * 100) + '%' : '0%', background: '#8b5cf6' }"></div>
        </div>
      </div>

      <div class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters('已完成')">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#fce7f3,#fbcfe8)">
            <i class="fas fa-check-circle text-pink-600"></i>
          </div>
          <span class="text-xs text-gray-400">已完成</span>
        </div>
        <div class="wp-stat-value">{{ stats.done ?? '-' }}</div>
        <div class="wp-stat-label">已办结</div>
        <div class="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div class="wp-stat-progress-bar" :style="{ width: stats.total > 0 ? (stats.done / stats.total * 100) + '%' : '0%', background: '#ec4899' }"></div>
        </div>
      </div>
    </div>

    <!-- Recent letters -->
    <div class="wp-panel flex flex-col">
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
      <div>
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getList, getStatistics } from '@/api/letter'
import { useUser } from '@/stores/user'
import { channelName, statusName } from '@/utils/mappings'
import StatusBadge from '@/components/StatusBadge.vue'

const { state: userState, loadUser, isCity, isDistrict, isOfficer } = useUser()
const router = useRouter()

const userInfo = ref(null)
const stats = ref({})

const navToLetters = (status) => {
  const query = {}
  if (status) query.status = status
  router.push({ name: 'letters', query })
}
const recentLetters = ref([])
const currentPeriod = ref('all')
const currentTime = ref('')
const currentDate = ref('')
const pollingTimer = ref(null)
const viewMode = ref('unit')

const periods = [
  { value: 'all', label: '全部' },
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
    const args = { period: currentPeriod.value }
    if (isOfficer()) {
      args.view_mode = 'personal'
    } else if (viewMode.value === 'personal') {
      args.view_mode = 'personal'
    }
    const res = await getStatistics(args)
    if (res.success) {
      const d = res.data || {}
      stats.value = {
        total: d['total'] || 0,
        preprocessing: d['preprocessing'] || 0,
        processing: d['processing'] || 0,
        feedbacking: d['pending_audit'] || 0,
        done: d['done'] || 0,
      }
    }
  } catch {}
}

const loadRecentLetters = async () => {
  try {
    const args = { page: 1, page_size: 10 }
    if (isOfficer()) {
      args.view_mode = 'personal'
    } else if (viewMode.value === 'personal') {
      args.view_mode = 'personal'
    }
    const res = await getList(args)
    if (res.success) {
      const list = res.data?.list || res.data || []
      recentLetters.value = list.map(item => ({
        '信件编号': item.letter_no,
        '群众姓名': item.citizen_name,
        '手机号': item.phone,
        '身份证号': item.id_card,
        '诉求内容': item.content,
        '来信时间': item.received_at,
        '来源渠道': channelName(item.channel),
        '信件状态': statusName(item.current_status),
        '更新时间': item.updated_at,
      }))
    }
  } catch {}
}

const changePeriod = async (period) => {
  currentPeriod.value = period
  await loadStats()
}

const refreshData = async () => {
  await Promise.all([loadStats(), loadRecentLetters()])
}

onMounted(async () => {
  updateTime()
  setInterval(updateTime, 1000)
  await loadUser()
  if (isOfficer()) {
    viewMode.value = 'personal'
  } else if (isDistrict()) {
    viewMode.value = 'unit'
  } else {
    viewMode.value = 'unit'
  }
  userInfo.value = { name: userState.name, org: '', role: userState.permission_level }
  await refreshData()
  pollingTimer.value = setInterval(loadStats, 5000)
})

onUnmounted(() => {
  if (pollingTimer.value) clearInterval(pollingTimer.value)
})
</script>
