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

export const analyzeLetter = (letterNo) =>
  http.post('/api/letter/', { order: 'analyze_letter', args: { letter_no: letterNo } })

export const autoDispatch = (args) =>
  http.post('/api/letter/', { order: 'auto_dispatch', args })

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

export const setSpecialFocus = (args) =>
  http.post('/api/letter/', { order: 'set_special_focus', args })

export const getLetterSpecialFocus = (args) =>
  http.post('/api/letter/', { order: 'get_letter_special_focus', args })

export const transcribeAudio = (audio_url) =>
  http.post('/api/tool/transcribe/', { audio_url })

export const transcribeAudioStream = (audio_url, onChunk, onDone, onError) => {
  const controller = new AbortController()
  fetch('/api/tool/transcribe_stream/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio_url }),
    signal: controller.signal,
  }).then(async (response) => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE 消息以 \n\n 分隔（不是按行），避免 event/data 跨 chunk 丢失
      const messages = buffer.split('\n\n')
      buffer = messages.pop() // 保留不完整的最后一条消息
      for (const msg of messages) {
        const trimmed = msg.trim()
        if (!trimmed) continue
        // 提取 event 字段
        const eventMatch = trimmed.match(/^event:\s*(.+)$/m)
        if (!eventMatch) continue
        const event = eventMatch[1].trim()
        // 提取所有 data 字段（支持多行），用 \n 拼接
        const dataLines = trimmed.match(/^data:\s*(.*)$/gm)
        const data = dataLines ? dataLines.map(l => l.replace(/^data:\s*/, '')).join('\n') : ''
        if (event === 'chunk') onChunk(data)
        else if (event === 'done') onDone(data)
        else if (event === 'error') onError(data)
      }
    }
  }).catch(err => {
    if (err.name !== 'AbortError') onError(err.message || '连接失败')
  })
  return controller
}
