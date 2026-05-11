<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header" style="display:flex;align-items:center;gap:12px">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
          <i class="fas fa-chart-bar text-blue-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">统计工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">数据统计与分析</div>
        </div>
      </div>
      <div class="flex gap-2 ml-4">
        <button
          v-for="p in periods"
          :key="p.value"
          class="wp-filter-chip"
          :class="{ active: currentPeriod === p.value }"
          @click="changePeriod(p.value)"
        >{{ p.label }}</button>
      </div>
      <select v-if="viewMode === 'unit' && !isOfficer()" class="wp-select" style="width:160px" v-model="selectedUnitId" @change="loadData">
        <option value="">全部地区</option>
        <option v-for="u in unitList" :key="u.id" :value="u.id">{{ u.name }}</option>
      </select>
      <div class="ml-auto flex items-center gap-3">
        <button class="wp-btn wp-btn-secondary text-xs py-1.5 px-3" @click="handleExportMonthly" :disabled="exportingMonthly">
          <i :class="exportingMonthly ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
          {{ exportingMonthly ? '导出中...' : '导出' }}
        </button>
        <div class="flex bg-gray-100 rounded-xl p-0.5 gap-0.5 shadow-sm" v-if="isDistrict() || isCity()">
          <button
            class="px-3 py-1.5 text-xs rounded-lg transition-all duration-150 font-medium"
            :class="viewMode === 'personal' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            @click="viewMode = 'personal'; loadData()"
          >个人</button>
          <button
            class="px-3 py-1.5 text-xs rounded-lg transition-all duration-150 font-medium"
            :class="viewMode === 'unit' ? 'bg-white text-blue-600 shadow-sm font-semibold' : 'text-gray-500 hover:text-gray-700'"
            @click="viewMode = 'unit'; loadData()"
          >单位</button>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-5 gap-4">
      <div v-for="card in summaryCards" :key="card.key" class="wp-stat-card cursor-pointer hover:shadow-md transition-shadow" @click="navToLetters(card.key)">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: card.bg }">
            <i :class="['fas', card.icon, card.color]"></i>
          </div>
        </div>
        <div class="wp-stat-value text-2xl">{{ statsData[card.key] ?? '-' }}</div>
        <div class="wp-stat-label">{{ card.label }}</div>
        <div class="text-xs mt-1" :class="comparisonClass(card.key)">环比 {{ comparisonText(card.key) }}</div>
      </div>
    </div>

    <!-- Charts grid -->
    <div class="grid grid-cols-2 gap-4 flex-1">
      <div class="wp-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">信件状态分布</span>
        </div>
        <div class="wp-panel-body" style="height:260px">
          <div ref="pieChart" class="w-full h-full"></div>
        </div>
      </div>

      <div class="wp-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">信件趋势</span>
        </div>
        <div class="wp-panel-body" style="height:260px">
          <div ref="lineChart" class="w-full h-full"></div>
        </div>
      </div>

      <div class="wp-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">分类统计</span>
        </div>
        <div class="wp-panel-body" style="height:260px">
          <div ref="barChart" class="w-full h-full"></div>
        </div>
      </div>

      <div class="wp-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">来源渠道分布</span>
        </div>
        <div class="wp-panel-body" style="height:260px">
          <div ref="donutChart" class="w-full h-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStatistics } from '@/api/letter'
import { getOrgList } from '@/api/setting'
import { useUser } from '@/stores/user'
import * as echarts from 'echarts'

const { state: userState, loadUser, isCity, isDistrict, isOfficer } = useUser()
const router = useRouter()

const currentPeriod = ref('all')
const statsData = ref({})
const selectedUnitId = ref('')
const unitList = ref([])

const navToLetters = (status) => {
  const query = {}
  if (status && status !== '信件总量') query.status = status
  router.push({ name: 'letters', query })
}
const viewMode = ref('unit')
const exportingMonthly = ref(false)
const pieChart = ref(null)
const lineChart = ref(null)
const barChart = ref(null)
const donutChart = ref(null)

let charts = []

const periods = [
  { value: 'all', label: '全部' },
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '今年' },
]

const summaryCards = [
  { key: '信件总量', label: '信件总量', icon: 'fa-envelope', color: 'text-blue-600', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  { key: '预处理', label: '预处理', icon: 'fa-clock', color: 'text-yellow-600', bg: 'linear-gradient(135deg,#fef9c3,#fef08a)' },
  { key: '处理中', label: '处理中', icon: 'fa-spinner', color: 'text-green-600', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
  { key: '待分县局/支队审核', label: '待审核', icon: 'fa-comments', color: 'text-purple-600', bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
  { key: '已完成', label: '已办结', icon: 'fa-check-circle', color: 'text-pink-600', bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)' },
]

const initCharts = (data) => {
  // Destroy old charts
  charts.forEach(c => c.dispose())
  charts = []

  const statusData = data?.['状态分布'] || [
    { name: '预处理', value: data?.['预处理'] || 0 },
    { name: '处理中', value: data?.['处理中'] || 0 },
    { name: '待分县局/支队审核', value: data?.['待分县局/支队审核'] || 0 },
    { name: '已完成', value: data?.['已完成'] || 0 },
    { name: '已无效', value: data?.['已无效'] || 0 },
  ]

  const colors = ['#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444']

  // Pie chart - status distribution
  if (pieChart.value) {
    const c = echarts.init(pieChart.value)
    c.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      color: colors,
      series: [{
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '50%'],
        data: statusData,
        label: { fontSize: 11 },
      }],
    })
    charts.push(c)
  }

  // Line chart - trend
  if (lineChart.value) {
    const trendData = data?.['趋势'] || { dates: [], values: [] }
    const weekDayNames = ['周日','周一','周二','周三','周四','周五','周六']
    const labels = trendData.dates.map(d => {
      // 只有纯数字(且值在0-6)才转为星期名，日期如"04-10"不转换
      if (/^[0-6]$/.test(d)) return weekDayNames[parseInt(d)]
      return d
    })
    const c = echarts.init(lineChart.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '5%', right: '5%', top: '10%', bottom: '10%' },
      xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
      series: [{
        type: 'line',
        data: trendData.values,
        smooth: true,
        lineStyle: { color: '#3b82f6', width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(59,130,246,0.3)' }, { offset: 1, color: 'rgba(59,130,246,0)' }] } },
        itemStyle: { color: '#3b82f6' },
      }],
    })
    charts.push(c)
  }

  // Bar chart - category
  if (barChart.value) {
    const catData = data?.['分类统计'] || {}
    const c = echarts.init(barChart.value)
    if (catData.categories && catData.values && catData.categories.length > 0) {
      c.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '5%', right: '5%', top: '10%', bottom: '15%', containLabel: true },
        xAxis: { type: 'category', data: catData.categories, axisLabel: { fontSize: 10, rotate: 20 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
        series: [{
          type: 'bar',
          data: catData.values,
          itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] },
        }],
      })
    } else {
      c.setOption({
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } },
        xAxis: { type: 'category', data: [] },
        yAxis: { type: 'value' },
        series: [],
      })
    }
    charts.push(c)
  }

  // Donut - source
  if (donutChart.value) {
    const sourceData = data?.['来源分布']
    const c = echarts.init(donutChart.value)
    if (sourceData && sourceData.length > 0) {
      c.setOption({
        tooltip: { trigger: 'item' },
        color: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4'],
        series: [{
          type: 'pie',
          radius: ['50%', '70%'],
          data: sourceData,
          label: { fontSize: 11, formatter: '{b}: {d}%' },
        }],
      })
    } else {
      c.setOption({
        title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } },
        series: [{ type: 'pie', radius: ['50%', '70%'], data: [] }],
      })
    }
    charts.push(c)
  }
}

const handleExportMonthly = async () => {
  exportingMonthly.value = true
  try {
    const period = currentPeriod.value
    const now = new Date().toISOString().slice(0,10)
    const downloadName = period === 'all'
      ? `letters_export_${now}.xlsx`
      : `report_${period}_${now}.zip`
    const resp = await fetch('/api/letter/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: 'export_monthly_report', args: { period } })
    })
    if (!resp.ok) throw new Error('导出失败')
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = downloadName
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('导出失败: ' + e.message)
  }
  exportingMonthly.value = false
}

const loadData = async () => {
  try {
    const args = { period: currentPeriod.value }
    if (isOfficer()) {
      args.view_mode = 'personal'
    } else if (viewMode.value === 'personal') {
      args.view_mode = 'personal'
    }
    if (selectedUnitId.value && viewMode.value === 'unit') {
      args.unit_id = parseInt(selectedUnitId.value)
    }
    const res = await getStatistics(args)
    if (res.success) {
      statsData.value = res.data || {}
      initCharts(res.data)
    }
  } catch {
    initCharts({})
  }
}

const changePeriod = (p) => {
  currentPeriod.value = p
  loadData()
}

const comparisonText = (key) => {
  const comp = statsData.value?.comparison?.[key]
  if (!comp || comp === '-') return '-'
  const arrow = comp.direction === 'up' ? '↑' : '↓'
  return `${arrow} ${comp.pct}%`
}

const comparisonClass = (key) => {
  const comp = statsData.value?.comparison?.[key]
  if (!comp || comp === '-' || comp.direction === '-') return 'text-gray-400'
  return comp.direction === 'up' ? 'text-red-500' : 'text-green-500'
}

const loadUnits = async () => {
  try {
    const res = await getOrgList({ page_size: 500 })
    if (res.success) {
      const all = res.data?.list || res.data || []
      // Deduplicate by Level2
      const seen = new Set()
      unitList.value = all
        .filter(u => u.level2 && !seen.has(u.level1 + '/' + u.level2) && seen.add(u.level1 + '/' + u.level2))
        .map(u => ({ id: u.id, name: u.level1 + ' / ' + u.level2 }))
    }
  } catch {}
}

const handleResize = () => charts.forEach(c => c.resize())

onMounted(async () => {
  await loadUser()
  if (isOfficer()) {
    viewMode.value = 'personal'
  } else if (isDistrict()) {
    viewMode.value = 'unit'
  } else {
    viewMode.value = 'unit'
  }
  await loadUnits()
  await loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>
