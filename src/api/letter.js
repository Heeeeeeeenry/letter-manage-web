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

export const transcribeAudioStream = (audio_url, onChunk, onDone, onError, onStatus) => {
  const controller = new AbortController()
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${location.host}/api/tool/transcribe_ws`

  let ws = null
  let fullText = ''

  try {
    ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      ws.send(JSON.stringify({ audio_url }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'status':
            if (onStatus) onStatus(msg.message || '')
            break

          case 'vad':
            if (onStatus) onStatus(msg.is_active ? '🎙️ 检测到语音...' : '')
            break

          case 'transcription':
            // 支持两种格式：{text} 或 {stable, unstable}
            const chunk = msg.text || ((msg.stable || '') + (msg.unstable || ''))
            if (chunk.length > fullText.length) {
              const delta = chunk.slice(fullText.length)
              fullText = chunk
              onChunk(delta)
            } else if (chunk && chunk !== fullText) {
              // 纠正文本替换（例如 AI 纠错后）
              fullText = chunk
              onChunk(chunk)
            }
            if (msg.is_final) {
              onDone(msg.text || fullText)
            }
            if (onStatus) onStatus('')
            break

          case 'error':
            onError(msg.message || '转译失败')
            break

          case 'done':
            if (ws) ws.close()
            break
        }
      } catch (e) {
        // 忽略非 JSON
      }
    }

    ws.onerror = () => onError('WebSocket 连接失败')
    ws.onclose = () => {}
  } catch (e) {
    onError('WebSocket 初始化失败: ' + e.message)
  }

  controller.abort = () => {
    if (ws) { ws.close(); ws = null }
  }
  return controller
}
