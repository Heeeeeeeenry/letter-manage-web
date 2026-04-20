import http from './http'

export const getList = (args) =>
  http.post('/api/letter/', { order: 'get_list', args })

export const getDetail = (letterNo) =>
  http.post('/api/letter/', { order: 'get_detail', args: { letter_no: letterNo } })

export const create = (args) =>
  http.post('/api/letter/', { order: 'create', args })

export const update = (args) =>
  http.post('/api/letter/', { order: 'update', args })

export const dispatch = (args) =>
  http.post('/api/letter/', { order: 'dispatch', args })

export const markInvalid = (args) =>
  http.post('/api/letter/', { order: 'mark_invalid', args })

export const submitProcessing = (args) =>
  http.post('/api/letter/', { order: 'submit_processing', args })

export const handleBySelf = (args) =>
  http.post('/api/letter/', { order: 'handle_by_self', args })

export const returnLetter = (args) =>
  http.post('/api/letter/', { order: 'return_letter', args })

export const auditApprove = (args) =>
  http.post('/api/letter/', { order: 'audit_approve', args })

export const auditReject = (args) =>
  http.post('/api/letter/', { order: 'audit_reject', args })

export const getStatistics = (args) =>
  http.post('/api/letter/', { order: 'get_statistics', args })

export const getCategories = () =>
  http.post('/api/letter/', { order: 'get_categories', args: {} })

export const getDispatchList = (args) =>
  http.post('/api/letter/', { order: 'get_dispatch_list', args })

export const getProcessingList = (args) =>
  http.post('/api/letter/', { order: 'get_processing_list', args })

export const getAuditList = (args) =>
  http.post('/api/letter/', { order: 'get_audit_list', args })

export const getByPhone = (phone) =>
  http.post('/api/letter/', { order: 'get_by_phone', args: { phone } })

export const getByIdcard = (idcard) =>
  http.post('/api/letter/', { order: 'get_by_idcard', args: { idcard } })

export const updateAttachments = (args) =>
  http.post('/api/letter/', { order: 'update_attachments', args })
