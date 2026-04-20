import http from './http'

export const login = (policeNumber, password, rememberMe = false) =>
  http.post('/api/auth/', { order: 'login', args: { police_number: policeNumber, password, remember_me: rememberMe } })

export const logout = () =>
  http.post('/api/auth/', { order: 'logout', args: {} })

export const checkAuth = () =>
  http.post('/api/auth/', { order: 'check', args: {} })
