<template>
  <div class="h-full flex flex-col gap-4">
    <div class="wp-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon"><i class="fas fa-cog text-gray-600"></i></div>
        <div>
          <div class="wp-panel-title">系统设置</div>
          <div class="text-xs text-gray-400 mt-0.5">个人信息与设置</div>
        </div>
      </div>
    </div>

    <div class="flex gap-4 flex-1">
      <!-- Profile card -->
      <div class="wp-panel" style="width:320px;flex-shrink:0;height:fit-content">
        <div class="wp-panel-body text-center">
          <!-- Avatar -->
          <div class="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <i class="fas fa-user text-blue-500 text-3xl"></i>
          </div>
          <div class="text-xl font-bold text-gray-800 mb-1">{{ userInfo?.name || '-' }}</div>
          <div class="text-sm text-gray-500 mb-3">{{ userInfo?.police_number || userInfo?.['警号'] || '' }}</div>
          <span class="wp-badge" :class="roleBadge">{{ roleLabel }}</span>
          <div class="mt-4 pt-4 border-t border-gray-100 space-y-2 text-left">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">所属单位</span>
              <span class="text-gray-800">{{ userInfo?.org || '-' }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">权限级别</span>
              <span class="text-gray-800">{{ userInfo?.role || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings panels -->
      <div class="flex-1 flex flex-col gap-4">
        <!-- Change password -->
        <div class="wp-panel">
          <div class="wp-panel-header">
            <div class="flex items-center gap-2">
              <i class="fas fa-lock text-gray-500"></i>
              <span class="font-semibold text-gray-800">修改密码</span>
            </div>
          </div>
          <div class="wp-panel-body">
            <div v-if="pwdMsg" class="mb-4 px-4 py-3 rounded-lg text-sm" :class="pwdMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'">
              {{ pwdMsg.text }}
            </div>
            <div class="grid grid-cols-2 gap-4 max-w-lg">
              <div class="col-span-2">
                <label class="text-sm font-medium text-gray-700 mb-1 block">当前密码</label>
                <input type="password" class="wp-input" v-model="pwdForm.oldPassword" placeholder="请输入当前密码" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">新密码</label>
                <input type="password" class="wp-input" v-model="pwdForm.newPassword" placeholder="请输入新密码（至少6位）" />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700 mb-1 block">确认新密码</label>
                <input type="password" class="wp-input" v-model="pwdForm.confirmPassword" placeholder="请再次输入新密码" />
              </div>
            </div>
            <div class="mt-4">
              <button class="wp-btn wp-btn-primary" :disabled="changingPwd" @click="handleChangePwd">
                <i v-if="changingPwd" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                保存新密码
              </button>
            </div>
          </div>
        </div>

        <!-- System info -->
        <div class="wp-panel">
          <div class="wp-panel-header">
            <div class="flex items-center gap-2">
              <i class="fas fa-info-circle text-gray-500"></i>
              <span class="font-semibold text-gray-800">系统信息</span>
            </div>
          </div>
          <div class="wp-panel-body">
            <div class="grid grid-cols-2 gap-4 text-sm max-w-lg">
              <div>
                <div class="text-gray-500 mb-1">系统名称</div>
                <div class="text-gray-800 font-medium">民意智感中心</div>
              </div>
              <div>
                <div class="text-gray-500 mb-1">子系统</div>
                <div class="text-gray-800 font-medium">局长信箱管理系统</div>
              </div>
              <div>
                <div class="text-gray-500 mb-1">版本</div>
                <div class="text-gray-800 font-medium">v1.0.0</div>
              </div>
              <div>
                <div class="text-gray-500 mb-1">版权</div>
                <div class="text-gray-800 font-medium">© 2026 民意智感中心</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUserInfo, changePassword } from '@/api/setting'

const userInfo = ref(null)
const changingPwd = ref(false)
const pwdMsg = ref(null)
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const roleLabel = computed(() => {
  const r = userInfo.value?.role || ''
  if (r === 'CITY') return '市级管理员'
  if (r === 'DISTRICT') return '区级管理员'
  if (r === 'UNIT') return '基层用户'
  return r || '用户'
})

const roleBadge = computed(() => {
  const r = userInfo.value?.role || ''
  if (r === 'CITY') return 'wp-badge-red'
  if (r === 'DISTRICT') return 'wp-badge-blue'
  return 'wp-badge-gray'
})

const handleChangePwd = async () => {
  pwdMsg.value = null
  if (!pwdForm.value.oldPassword || !pwdForm.value.newPassword) {
    pwdMsg.value = { type: 'error', text: '请填写所有密码字段' }
    return
  }
  if (pwdForm.value.newPassword.length < 6) {
    pwdMsg.value = { type: 'error', text: '新密码至少6位' }
    return
  }
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdMsg.value = { type: 'error', text: '两次密码不一致' }
    return
  }
  changingPwd.value = true
  try {
    const res = await changePassword({ old_password: pwdForm.value.oldPassword, new_password: pwdForm.value.newPassword })
    if (res.success) {
      pwdMsg.value = { type: 'success', text: '密码修改成功' }
      pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      pwdMsg.value = { type: 'error', text: res.error || '密码修改失败' }
    }
  } catch {
    pwdMsg.value = { type: 'error', text: '请求失败，请稍后重试' }
  }
  changingPwd.value = false
}

const loadUserInfo = async () => {
  try {
    const res = await getUserInfo()
    if (res.success) userInfo.value = res.data
  } catch {
    // Fallback: try to get from menu API
    try {
      const { getMenu } = await import('@/api/config')
      const res2 = await getMenu()
      if (res2.success) userInfo.value = res2.data?.user || null
    } catch {}
  }
}

onMounted(loadUserInfo)
</script>
