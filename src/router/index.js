import { createRouter, createWebHashHistory } from 'vue-router'
import { checkAuth } from '@/api/auth'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/views/WorkplaceLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'home', name: 'home', component: () => import('@/views/HomeView.vue') },
      { path: 'letters', name: 'letters', component: () => import('@/views/LettersView.vue') },
      { path: 'dispatch', name: 'dispatch', component: () => import('@/views/DispatchView.vue') },
      { path: 'processing', name: 'processing', component: () => import('@/views/ProcessingView.vue') },
      { path: 'audit', name: 'audit', component: () => import('@/views/AuditView.vue') },
      { path: 'statistics', name: 'statistics', component: () => import('@/views/StatisticsView.vue') },
      { path: 'users', name: 'users', component: () => import('@/views/UsersView.vue') },
      { path: 'organization', name: 'organization', component: () => import('@/views/OrganizationView.vue') },
      { path: 'special-focus', name: 'special-focus', component: () => import('@/views/SpecialFocusView.vue') },
      { path: 'category', name: 'category', component: () => import('@/views/CategoryView.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

let authChecked = false
let isAuthenticated = false

router.beforeEach(async (to) => {
  console.log('router.beforeEach', to.path, to.name, 'authChecked=', authChecked, 'isAuthenticated=', isAuthenticated)
  if (to.meta.requiresAuth === false) return true
  if (!authChecked) {
    try {
      console.log('Checking auth...')
      const res = await checkAuth()
      console.log('checkAuth result:', res)
      isAuthenticated = res.success
      console.log('isAuthenticated set to:', isAuthenticated)
    } catch (err) {
      console.error('checkAuth failed:', err)
      isAuthenticated = false
    }
    authChecked = true
  }
  if (!isAuthenticated) {
    return '/login'
  }
  return true
})

export default router

export const resetAuthCache = () => {
  authChecked = false
  isAuthenticated = false
}

export const setAuthenticated = () => {
  authChecked = true
  isAuthenticated = true
}
