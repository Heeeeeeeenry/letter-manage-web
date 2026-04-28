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
  http.post('/api/setting/', { order: 'get_units', args })

export const createOrg = (args) =>
  http.post('/api/setting/', { order: 'create_unit', args })

export const updateOrg = (args) =>
  http.post('/api/setting/', { order: 'update_unit', args })

export const deleteOrg = (args) =>
  http.post('/api/setting/', { order: 'delete_unit', args })

export const getSpecialFocusList = () =>
  http.post('/api/setting/', { order: 'get_special_focus_list', args: {} })

export const createSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'create_special_focus', args })

export const updateSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'update_special_focus', args })

export const deleteSpecialFocus = (args) =>
  http.post('/api/setting/', { order: 'delete_special_focus', args })

export const getCategoryList = () =>
  http.post('/api/setting/', { order: 'category_list', args: {} })

export const createCategory = (args) =>
  http.post('/api/setting/', { order: 'category_create', args })

export const updateCategory = (args) =>
  http.post('/api/setting/', { order: 'category_update', args })

export const deleteCategory = (args) =>
  http.post('/api/setting/', { order: 'category_delete', args })

export const changePassword = (args) =>
  http.post('/api/setting/', { order: 'change_password', args })

export const getUserInfo = () =>
  http.post('/api/setting/', { order: 'get_user_info', args: {} })

// Dispatch permissions
export const getDispatchPermissions = () =>
  http.post('/api/setting/', { order: 'get_dispatch_permissions', args: {} })

export const createDispatchPermission = (args) =>
  http.post('/api/setting/', { order: 'create_dispatch_permission', args })

export const updateDispatchPermission = (args) =>
  http.post('/api/setting/', { order: 'update_dispatch_permission', args })

export const deleteDispatchPermission = (args) =>
  http.post('/api/setting/', { order: 'delete_dispatch_permission', args })

export const getDispatchUnits = () =>
  http.post('/api/setting/', { order: 'get_dispatch_units', args: {} })

export const getUsersInUnit = (unitId) =>
  http.post('/api/setting/', { order: 'get_users_in_unit', args: { unit_id: unitId } })
