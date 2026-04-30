import { reactive } from 'vue'
import { getMenu } from '@/api/config'

const state = reactive({
  id: null,
  name: '',
  nickname: '',
  police_number: '',
  unit_id: null,
  permission_level: '',
  is_admin: false,
  loaded: false,
})

export function useUser() {
  const loadUser = async () => {
    if (state.loaded) return
    try {
      const res = await getMenu()
      if (res.success && res.data?.user) {
        const u = res.data.user
        state.id = u.id
        state.name = u.name
        state.nickname = u.nickname
        state.police_number = u.police_number
        state.unit_id = u.unit_id
        state.permission_level = u.permission_level
        state.is_admin = u.is_admin
        state.loaded = true
      }
    } catch (e) {
      console.error('Failed to load user:', e)
    }
  }

  const resetUser = () => {
    state.id = null
    state.name = ''
    state.nickname = ''
    state.police_number = ''
    state.unit_id = null
    state.permission_level = ''
    state.is_admin = false
    state.loaded = false
  }

  const isCity = () => state.permission_level === 'CITY'
  const isDistrict = () => state.permission_level === 'DISTRICT'
  const isOfficer = () => state.permission_level === 'OFFICER'

  return { state, loadUser, resetUser, isCity, isDistrict, isOfficer }
}
