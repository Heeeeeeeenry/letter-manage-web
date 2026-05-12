// Channel code → Chinese name mapping
export const CHANNEL_MAP = {
  1: '市民上报',
  2: '局长信箱',
  3: '来访',
  4: '电话',
  5: '信件',
  6: '网络',
  7: '其他',
  8: '12345热线',
  9: '12389举报',
  10: '网上信访',
  11: '上级交办',
}

// Status code → Chinese name mapping
export const STATUS_MAP = {
  1: '预处理',
  2: '待区县局下发',
  3: '已下发至分县局/支队',
  4: '市局越级下发',
  5: '已下发至处理单位',
  6: '处理中',
  7: '待核查',
  8: '待分县局/支队审核',
  9: '待市局审核',
  10: '已办结',
  11: '无效',
  12: '已退回',
  13: '已延期',
}

export function channelName(code) {
  return CHANNEL_MAP[code] || code || '-'
}

export function statusName(code) {
  return STATUS_MAP[code] || code || '-'
}
