import http from './http'

export const getUserList = (args) =>
  http.post('/api/setting/', { order: 'get_user_list', args })

export const createUser = (args) =>
  http.post('/api/setting/', { order: 'create_user', args })

export const updateUser = (args) =>
  http.post('/api/setting/', { order: 'update_user', args })

export const deleteUser = (args) =>
  http.post('/api/setting/', { order: 'delete_user', args })

export const resetPassword = (args) =>
  http.post('/api/setting/', { order: 'reset_password', args })

export const getOrgList = (args) =>
  http.post('/api/setting/', { order: 'get_org_list', args })

export const createOrg = (args) =>
  http.post('/api/setting/', { order: 'create_org', args })

export const updateOrg = (args) =>
  http.post('/api/setting/', { order: 'update_org', args })

export const deleteOrg = (args) =>
  http.post('/api/setting/', { order: 'delete_org', args })

export const getSpecialFocusList = () =>
  http.post('/api/setting/', { order: 'get_special_focus_list', args: {} })

export const createSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'create_special_focus', args })

export const updateSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'update_special_focus', args })

export const deleteSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'delete_special_focus', args })

export const getCategoryList = () =>
  http.post('/api/setting/', { order: 'get_category_list', args: {} })

export const createCategory = (args) =>
  http.post('/api/setting/', { order: 'create_category', args })

export const updateCategory = (args) =>
  http.post('/api/setting/', { order: 'update_category', args })

export const deleteCategory = (args) =>
  http.post('/api/setting/', { order: 'delete_category', args })

export const changePassword = (args) =>
  http.post('/api/setting/', { order: 'change_password', args })

export const getUserInfo = () =>
  http.post('/api/setting/', { order: 'get_user_info', args: {} })
