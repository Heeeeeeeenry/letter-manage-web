import http from './http'

export const getMenu = () =>
  http.post('/api/config/', { order: 'get_menu', args: {} })

export const getSystemConfig = () =>
  http.post('/api/config/', { order: 'get_system_config', args: {} })
