<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
          <i class="fas fa-chart-bar text-blue-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">统计工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">数据统计与分析</div>
        </div>
      </div>
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

    <!-- Summary cards -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="card in summaryCards" :key="card.key" class="wp-stat-card">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center" :style="{ background: card.bg }">
            <i :class="['fas', card.icon, card.color]"></i>
          </div>
        </div>
        <div class="wp-stat-value text-2xl">{{ statsData[card.key] ?? '-' }}</div>
        <div class="wp-stat-label">{{ card.label }}</div>
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
import { getStatistics } from '@/api/letter'
import * as echarts from 'echarts'

const currentPeriod = ref('month')
const statsData = ref({})
const pieChart = ref(null)
const lineChart = ref(null)
const barChart = ref(null)
const donutChart = ref(null)

let charts = []

const periods = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '今年' },
]

const summaryCards = [
  { key: '信件总量', label: '信件总量', icon: 'fa-envelope', color: 'text-blue-600', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  { key: '预处理', label: '预处理', icon: 'fa-clock', color: 'text-yellow-600', bg: 'linear-gradient(135deg,#fef9c3,#fef08a)' },
  { key: '处理中', label: '处理中', icon: 'fa-spinner', color: 'text-green-600', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
  { key: '已完成', label: '已完成', icon: 'fa-check-circle', color: 'text-purple-600', bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
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
    const trendData = data?.['趋势'] || { dates: ['周一','周二','周三','周四','周五','周六','周日'], values: [5,8,6,12,9,4,7] }
    const c = echarts.init(lineChart.value)
    c.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '5%', right: '5%', top: '10%', bottom: '10%' },
      xAxis: { type: 'category', data: trendData.dates, axisLabel: { fontSize: 11 } },
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
    const catData = data?.['分类统计'] || { categories: ['环境', '交通', '安全', '其他', '医疗'], values: [15, 22, 8, 30, 12] }
    const c = echarts.init(barChart.value)
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
    charts.push(c)
  }

  // Donut - source
  if (donutChart.value) {
    const sourceData = data?.['来源分布'] || [
      { name: '网络平台', value: 40 },
      { name: '电话', value: 25 },
      { name: '实体信箱', value: 20 },
      { name: '其他', value: 15 },
    ]
    const c = echarts.init(donutChart.value)
    c.setOption({
      tooltip: { trigger: 'item' },
      color: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
      series: [{
        type: 'pie',
        radius: ['50%', '70%'],
        data: sourceData,
        label: { fontSize: 11 },
      }],
    })
    charts.push(c)
  }
}

const loadData = async () => {
  try {
    const res = await getStatistics({ period: currentPeriod.value })
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

const handleResize = () => charts.forEach(c => c.resize())

onMounted(async () => {
  await loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
})
</script>
