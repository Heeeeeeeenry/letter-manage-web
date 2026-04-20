<template>
  <div class="bg-gray-50 min-h-screen flex items-center justify-center">
    <div class="login-container">
      <!-- Logo and title -->
      <div class="login-header">
        <div class="logo mx-auto mb-6 flex items-center justify-center" style="width:80px;height:80px">
          <canvas ref="logoCanvas" width="80" height="80" class="ai-logo-canvas"></canvas>
        </div>
        <h1 class="system-title" style="font-size:28px;font-weight:700;color:#1f2937;margin-bottom:8px;letter-spacing:-0.5px;text-align:center">
          民意智感中心
        </h1>
        <p style="font-size:15px;color:#6b7280;text-align:center">局长信箱管理系统</p>
      </div>

      <!-- Login form -->
      <div class="login-form-container">
        <!-- Error message -->
        <div v-if="errorMsg" class="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <i class="fas fa-exclamation-circle text-base"></i>
          <span>{{ errorMsg }}</span>
        </div>

        <form @submit.prevent="handleLogin">
          <!-- Police number -->
          <div class="form-group mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2" for="police-number">警号</label>
            <div class="relative flex items-center">
              <i class="fas fa-id-badge absolute left-4 text-gray-400 text-base z-10"></i>
              <input
                id="police-number"
                v-model="form.policeNumber"
                type="text"
                placeholder="请输入警号"
                required
                autocomplete="username"
                style="width:100%;padding:12px 16px 12px 44px;font-size:15px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;color:#1f2937;outline:none;transition:all 0.2s ease"
                @focus="e => { e.target.style.borderColor='#3b82f6'; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)' }"
                @blur="e => { e.target.style.borderColor='#d1d5db'; e.target.style.background='#f9fafb'; e.target.style.boxShadow='none' }"
              />
            </div>
          </div>

          <!-- Password -->
          <div class="form-group mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2" for="password">密码</label>
            <div class="relative flex items-center">
              <i class="fas fa-lock absolute left-4 text-gray-400 text-base z-10"></i>
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                required
                autocomplete="current-password"
                style="width:100%;padding:12px 44px 12px 44px;font-size:15px;border:1px solid #d1d5db;border-radius:10px;background:#f9fafb;color:#1f2937;outline:none;transition:all 0.2s ease"
                @focus="e => { e.target.style.borderColor='#3b82f6'; e.target.style.background='white'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.1)' }"
                @blur="e => { e.target.style.borderColor='#d1d5db'; e.target.style.background='#f9fafb'; e.target.style.boxShadow='none' }"
              />
              <button
                type="button"
                class="absolute right-3 text-gray-400 hover:text-gray-600 p-1"
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" class="text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="flex items-center justify-between mb-7">
            <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                class="w-4 h-4 rounded cursor-pointer"
                style="accent-color:#3b82f6"
              />
              <span>记住我</span>
            </label>
            <a href="#" class="text-sm text-blue-500 hover:text-blue-700 hover:underline">忘记密码？</a>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            class="login-button"
            :disabled="loading"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-6 border-t border-gray-200 text-center">
        <p class="text-xs text-gray-400">© 2026 民意智感中心 版权所有</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api/auth'
import { setAuthenticated } from '@/router'

const router = useRouter()

const form = ref({ policeNumber: '', password: '', rememberMe: false })
const loading = ref(false)
const errorMsg = ref('')
const showPassword = ref(false)
const logoCanvas = ref(null)

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const res = await login(form.value.policeNumber, form.value.password, form.value.rememberMe)
    if (res.success) {
      setAuthenticated()
      router.push('/home')
    } else {
      errorMsg.value = res.error || '登录失败，请检查警号和密码'
    }
  } catch (e) {
    errorMsg.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
}

// Draw animated AI logo on canvas
const drawLogo = () => {
  const canvas = logoCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const cx = w / 2
  const cy = h / 2
  let angle = 0

  const animate = () => {
    ctx.clearRect(0, 0, w, h)
    // Outer ring
    ctx.beginPath()
    ctx.arc(cx, cy, 32, 0, Math.PI * 2)
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.stroke()
    // Animated arc
    ctx.beginPath()
    ctx.arc(cx, cy, 32, angle, angle + Math.PI * 1.2)
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.stroke()
    // Inner dots
    for (let i = 0; i < 3; i++) {
      const dotAngle = angle + (i * Math.PI * 2) / 3
      const dx = cx + Math.cos(dotAngle) * 16
      const dy = cy + Math.sin(dotAngle) * 16
      ctx.beginPath()
      ctx.arc(dx, dy, 3, 0, Math.PI * 2)
      ctx.fillStyle = i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#ec4899'
      ctx.fill()
    }
    // Center
    ctx.beginPath()
    ctx.arc(cx, cy, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#4b5563'
    ctx.fill()
    angle += 0.02
    requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  drawLogo()
})
</script>
