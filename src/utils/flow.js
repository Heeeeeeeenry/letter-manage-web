/**
 * 流转记录归一化工具
 * 
 * 数据库中的流转记录存在两种格式：
 * 1. 中文字段名格式：{ 操作类型: '生成', 操作人姓名: 'xxx', 操作时间: '...', ... }
 * 2. 英文字段名格式：{ action: 'create', operator: 'xxx', timestamp: '...', ... }
 * 
 * 本工具将两种格式统一转换为前段模板期望的中文字段名格式。
 */

// English action → Chinese action mapping
const actionToChinese = {
  create: '生成',
  dispatch: '下发',
  handle_by_self: '自行处理',
  feedback: '办案单位反馈',
  submit_processing: '提交处理',
  process: '处理',
  return: '退回',
  return_letter: '退回',
  audit_approve: '审核通过',
  audit_reject: '审核驳回',
  mark_invalid: '标记无效',
}

/**
 * 将流转记录归一化为中文字段名格式
 * 兼容中英文两种输入格式
 */
export function normalizeFlowRecord(rec) {
  if (!rec || typeof rec !== 'object') return {}

  // 已经是中文格式（有中文字段名）
  if (rec['操作类型']) {
    const remark =
      typeof rec['备注'] === 'object'
        ? JSON.stringify(rec['备注'])
        : rec['备注'] || ''
    return {
      '操作类型': rec['操作类型'] || '',
      '操作人': rec['操作人'] || rec['操作人姓名'] || '',
      '操作时间': rec['操作时间'] || '',
      '操作单位': rec['操作单位'] || rec['操作后单位'] || rec['目标单位'] || rec['to_unit'] || rec['from_unit'] || rec['unit'] || '',
      '备注': remark,
      '操作人警号': rec['操作人警号'] || '',
      _raw: rec,
    }
  }

  // 英文格式（有英文字段名）
  const action = rec.action || ''
  const remark =
    typeof rec.remark === 'object'
      ? JSON.stringify(rec.remark)
      : rec.remark || ''
  return {
    '操作类型': actionToChinese[action] || action || '',
    '操作人': rec.operator || rec.operator_name || '',
    '操作时间': rec.timestamp || rec.created_at || rec.operated_at || '',
    '操作单位': rec.operator_unit || rec.to_unit || rec.from_unit || rec.target_unit || rec.source_unit || rec.unit || '',
    '备注': remark,
    '操作人警号': rec.operator_id || '',
    _raw: rec,
  }
}

/**
 * 批量归一化流转记录列表
 */
export function normalizeFlowRecords(records) {
  if (!records) return []
  if (typeof records === 'string') {
    try {
      return JSON.parse(records).map(normalizeFlowRecord)
    } catch {
      return []
    }
  }
  if (Array.isArray(records)) {
    return records.map(normalizeFlowRecord)
  }
  return []
}

/**
 * 从 getDetail API 响应中提取并归一化流转记录
 */
export function extractFlowRecords(apiResponse) {
  if (!apiResponse || !apiResponse.success || !apiResponse.data) return []
  const flow = apiResponse.data.flow || {}
  const records = flow.flow_records || apiResponse.data.flow_records || []
  return normalizeFlowRecords(records)
}
