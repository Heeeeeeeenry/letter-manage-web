<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header -->
    <div class="wp-header" id="processing-header">
      <div class="flex items-center gap-3">
        <div class="wp-panel-icon" style="background:linear-gradient(135deg,#fef3c7,#fde68a)">
          <i class="fas fa-tasks text-amber-600"></i>
        </div>
        <div>
          <div class="wp-panel-title">处理工作台</div>
          <div class="text-xs text-gray-400 mt-0.5">以最快的速度核实情况，处理群众诉求</div>
        </div>
      </div>
      <span class="wp-badge wp-badge-blue font-bold">{{ Object.keys(letters).length }} 封待处理</span>
    </div>

    <div class="flex gap-4 flex-1 overflow-hidden">
      <!-- Left list -->
      <div class="wp-panel flex flex-col" style="width:250px;flex-shrink:0" id="letter-list-panel">
        <div class="wp-panel-header compact">
          <span class="text-sm font-semibold">待处理信件</span>
          <button class="wp-btn wp-btn-secondary text-xs py-1 px-2" @click="loadData">
            <i class="fas fa-sync-alt" :class="{ 'fa-spin': loadingList }"></i>
          </button>
        </div>
        <div class="wp-scroll">
          <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin"></i>
          </div>
          <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
            <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>暂无待处理信件
          </div>
          <div
            v-for="letter in Object.values(letters)"
            :key="letter['信件编号']"
            class="wp-list-item"
            :class="{ active: selectedLetter?.['信件编号'] === letter['信件编号'] }"
            @click="selectLetter(letter)"
          >
            <span v-if="letter['信件三级分类']" class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium inline-block mb-2">
              {{ letter['信件三级分类'] }}
            </span>
            <div class="text-xs font-mono text-blue-600 font-medium">{{ letter['信件编号'] }}</div>
            <div class="flex items-center justify-between mt-1">
              <div class="flex items-center gap-1.5">
                <i class="fas fa-user text-gray-400" style="font-size:12px"></i>
                <span class="text-sm font-medium text-gray-800">{{ letter['群众姓名'] || '匿名' }}</span>
              </div>
              <span class="text-xs text-gray-400">{{ formatTime(letter['来信时间']) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right detail -->
      <div class="wp-panel flex-1 flex flex-col" id="letter-detail-panel">
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            请从左侧选择信件
          </div>
        </div>

        <template v-else>
          <!-- Detail top: left info + right content (matching old platform) -->
          <div class="detail-top">
            <!-- Left 40% - 7 rows of info -->
            <div class="detail-info">
              <div class="info-row">
                <i class="fas fa-envelope"></i>
                <span class="info-value">{{ selectedLetter['信件编号'] }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-tags"></i>
                <span class="info-value">{{ [selectedLetter['信件一级分类'],selectedLetter['信件二级分类'],selectedLetter['信件三级分类']].filter(Boolean).join(' / ') || '—' }}</span>
              </div>
              <div class="info-row">
                <i class="fas fa-clock"></i>
                <input type="text" class="info-input" readonly :value="formatTime(selectedLetter['来信时间'])" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-user"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['群众姓名'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-phone"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['手机号'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-id-card"></i>
                <input type="text" class="info-input" readonly :value="selectedLetter['身份证号'] || ''" placeholder="-" title="点击可编辑">
              </div>
              <div class="info-row">
                <i class="fas fa-inbox"></i>
                <span class="info-value">{{ selectedLetter['来源'] || '—' }}</span>
              </div>
            </div>

            <!-- Right 60% - Appeal content -->
            <div class="detail-content flex flex-col">
              <div class="content-header">
                <i class="fas fa-align-left"></i>
                <span>诉求内容</span>
              </div>
              <textarea class="flex-1 w-full text-sm text-gray-700 leading-relaxed bg-transparent border-none outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 rounded px-1 py-0.5 transition cursor-pointer resize-none" rows="4" readonly :value="selectedLetter['诉求内容'] || ''" placeholder="-" title="点击可编辑"></textarea>
            </div>
          </div>

          <!-- Main area with vertical tabs (matching old platform) -->
          <div class="flex flex-1" style="min-height:0">
            <!-- Left sidebar of detail (tabs + countdown) -->
            <div class="w-44 border-r border-gray-100 p-4 flex flex-col">
              <div class="space-y-1">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  :class="activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'"
                  @click="switchTab(tab.id)"
                >
                  <i :class="tab.icon + ' mr-1.5'" class="w-4 text-center"></i>{{ tab.label }}
                </button>
              </div>
              <!-- Processing countdown at bottom -->
              <div class="mt-auto pt-4 border-t border-gray-100">
                <div class="text-xs text-gray-400 mb-1.5">处理倒计时</div>
                <div class="text-lg font-bold" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">{{ countdownTimerStr || '-' }}</div>
              </div>
            </div>

            <!-- Main content area - all tabs content in one scrollable box -->
            <div class="workspace-main" ref="workspaceMainRef">
              <!-- 流转记录 Section -->
              <div id="section-flow" class="tab-section" ref="sectionFlowRef">
                <div class="section-header">
                  <i class="fas fa-exchange-alt"></i> 流转记录
                </div>
                <div class="tab-body">
                  <div v-if="loadingFlow" class="placeholder-text">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                  </div>
                  <div v-else-if="!flowRecords.length" class="placeholder-text">
                    <i class="fas fa-info-circle mr-1"></i>暂无流转记录
                  </div>
                  <div v-else class="flow-timeline">
                    <div v-for="(rec, idx) in flowRecords" :key="idx" class="flow-item" :class="{ latest: idx === 0 }">
                      <div class="flow-item-content">
                        <div class="flow-item-header">
                          <span class="flow-item-type">{{ rec['操作类型'] || '-' }}</span>
                          <span class="flow-item-time">{{ formatTime(rec['操作时间']) }}</span>
                        </div>
                        <div class="flow-item-operator">
                          操作人: {{ rec['操作人'] || rec['操作人姓名'] || '-' }} ({{ rec['操作人警号'] || '-' }})
                        </div>
                        <div class="flow-item-unit" v-if="rec['操作单位']">
                          操作单位: {{ rec['操作单位'] }}
                        </div>
                        <div class="flow-item-status" v-if="rec['操作前状态'] || rec['操作后状态']">
                          <span class="status-before">{{ rec['操作前状态'] || '-' }}</span>
                          <span class="status-arrow"><i class="fas fa-arrow-right"></i></span>
                          <span class="status-after">{{ rec['操作后状态'] || '-' }}</span>
                        </div>
                        <div v-if="rec['目标单位']" class="flow-item-target">目标单位: {{ rec['目标单位'] }}</div>
                        <div v-if="rec['备注']" class="flow-item-remark">
                          <template v-if="typeof rec['备注'] === 'object'">
                            <div v-for="(val, key) in rec['备注']" :key="key" class="flow-item-remark-item">
                              <span class="remark-key">{{ key }}:</span> {{ Array.isArray(val) ? val.join(' / ') : val }}
                            </div>
                          </template>
                          <div v-else class="flow-item-remark-item">{{ rec['备注'] }}</div>
                        </div>
                        <div class="flow-item-detail-toggle" @click="toggleFlowDetail(idx)">
                          <i class="fas" :class="expandedFlowIdx === idx ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                          {{ expandedFlowIdx === idx ? '收起详情' : '查看详情' }}
                        </div>
                        <div v-if="expandedFlowIdx === idx" class="flow-item-detail">
                          <div class="flow-detail-grid">
                            <div class="flow-detail-row">
                              <span class="flow-detail-label">操作类型</span>
                              <span class="flow-detail-value">{{ rec['操作类型'] || '-' }}</span>
                            </div>
                            <div class="flow-detail-row">
                              <span class="flow-detail-label">操作人</span>
                              <span class="flow-detail-value">{{ rec['操作人'] || '-' }}<span v-if="rec['操作人警号']"> ({{ rec['操作人警号'] }})</span></span>
                            </div>
                            <div class="flow-detail-row">
                              <span class="flow-detail-label">操作时间</span>
                              <span class="flow-detail-value">{{ formatTime(rec['操作时间']) }}</span>
                            </div>
                            <div class="flow-detail-row">
                              <span class="flow-detail-label">操作单位</span>
                              <span class="flow-detail-value">{{ rec['操作单位'] || '-' }}</span>
                            </div>
                            <div class="flow-detail-row" v-if="rec._raw?.['操作前单位'] || rec._raw?.from_unit">
                              <span class="flow-detail-label">操作前单位</span>
                              <span class="flow-detail-value">{{ rec._raw['操作前单位'] || rec._raw?.from_unit || '-' }}</span>
                            </div>
                            <div class="flow-detail-row" v-if="rec._raw?.['操作后单位'] || rec._raw?.to_unit">
                              <span class="flow-detail-label">操作后单位</span>
                              <span class="flow-detail-value">{{ rec._raw['操作后单位'] || rec._raw?.to_unit || '-' }}</span>
                            </div>
                            <div class="flow-detail-row" v-if="rec['操作前状态'] || rec['操作后状态']">
                              <span class="flow-detail-label">状态变更</span>
                              <span class="flow-detail-value">
                                <span class="status-before">{{ rec['操作前状态'] || '-' }}</span>
                                <span class="status-arrow inline-mx-1"><i class="fas fa-arrow-right"></i></span>
                                <span class="status-after">{{ rec['操作后状态'] || '-' }}</span>
                              </span>
                            </div>
                            <div class="flow-detail-row" v-if="rec['目标单位']">
                              <span class="flow-detail-label">目标单位</span>
                              <span class="flow-detail-value">{{ rec['目标单位'] }}</span>
                            </div>
                            <div class="flow-detail-row flow-detail-row-full" v-if="rec['备注']">
                              <span class="flow-detail-label">备注</span>
                              <span class="flow-detail-value" v-if="typeof rec['备注'] === 'object'">
                                <div v-for="(val, key) in rec['备注']" :key="key" class="flow-detail-remark-item">
                                  <span class="remark-key">{{ key }}:</span> {{ Array.isArray(val) ? val.join(' / ') : val }}
                                </div>
                              </span>
                              <span class="flow-detail-value" v-else>{{ rec['备注'] }}</span>
                            </div>
                          </div>
                          <div v-if="rec._raw" class="flow-detail-raw-toggle" @click.stop="showRawJson[idx] = !showRawJson[idx]">
                            <i class="fas" :class="showRawJson[idx] ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                            {{ showRawJson[idx] ? '收起原始数据' : '查看原始数据' }}
                          </div>
                          <pre v-if="rec._raw && showRawJson[idx]" class="flow-detail-raw">{{ JSON.stringify(rec._raw, null, 2) }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 历史来信 Section -->
              <div id="section-history" class="tab-section" ref="sectionHistoryRef">
                <div class="section-header">
                  <i class="fas fa-history"></i> 历史来信
                </div>
                <div class="tab-body">
                  <div v-if="loadingHistory" class="placeholder-text">
                    <i class="fas fa-spinner fa-spin"></i> 加载中...
                  </div>
                  <div v-else-if="!historyLetters.length" class="placeholder-text">
                    <i class="fas fa-info-circle mr-1"></i>该群众暂无历史来信
                  </div>
                  <div v-else class="history-letters-list">
                    <div v-for="(letter, idx) in historyLetters" :key="idx" class="history-letter-item" :data-letter-number="letter['信件编号']" @click="scrollToHistoryLetter($event)">
                      <div class="history-letter-header">
                        <span class="history-letter-number">{{ letter['信件编号'] || '-' }}</span>
                        <span class="history-letter-time">{{ formatTime(letter['来信时间']) }}</span>
                      </div>
                      <span class="history-letter-status">{{ letter['当前信件状态'] || letter['信件状态'] || '-' }}</span>
                      <div class="history-letter-category">{{ [letter['信件一级分类'],letter['信件二级分类'],letter['信件三级分类']].filter(Boolean).join(' / ') || '-' }}</div>
                      <div class="history-letter-content">{{ letter['诉求内容'] || '' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 信件处理 Section -->
              <div id="section-handle" class="tab-section" ref="sectionHandleRef">
                <!-- <div class="section-header">
                  <i class="fas fa-edit"></i> 信件处理
                </div> -->
                <div class="tab-body">
                  <!-- 步骤标题 + 指示器 -->
                  <div class="handle-step-tab-header" style="display:flex;align-items:center;gap:6px;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #e5e7eb;">
                    <i class="fas fa-edit" style="color:#3b82f6;font-size:14px;"></i>
                    <span style="font-size:14px;font-weight:600;color:#374151;margin-right:auto;">信件处理</span>
                    <div class="handle-step-indicator" :class="{ active: handleStep === 1 }" @click.stop="handleStep = 1">
                      <div class="handle-step-number">1</div>
                      <span class="handle-step-title">联系群众</span>
                    </div>
                    <div class="handle-step-line"></div>
                    <div class="handle-step-indicator" :class="{ active: handleStep === 2 }" @click.stop="handleStep = 2">
                      <div class="handle-step-number">2</div>
                      <span class="handle-step-title">诉求处理</span>
                    </div>
                  </div>
                  <!-- 步骤内容: 使用v-show切换 -->
                  <div class="handle-steps-container">
                    <!-- 步骤1: 联系群众 -->
                    <div v-show="handleStep === 1" class="handle-step-panel">
                      <div class="handle-panel-content">
                        <div class="content-section section-letter">
                          <div class="section-title"><i class="fas fa-phone-alt"></i> 联系群众</div>
                          <div class="section-content">
                            <div class="contact-info">
                              <div class="contact-item">
                                <span class="contact-label">姓名：</span>
                                <span class="contact-value">{{ selectedLetter['群众姓名'] || '-' }}</span>
                              </div>
                              <div class="contact-item">
                                <span class="contact-label">手机号：</span>
                                <span class="contact-value">{{ selectedLetter['手机号'] || '-' }}</span>
                              </div>
                              <div v-if="selectedLetter['身份证号']" class="contact-item">
                                <span class="contact-label">身份证号：</span>
                                <span class="contact-value">{{ selectedLetter['身份证号'] }}</span>
                              </div>
                            </div>
                            <div class="upload-area mt-3">
                              <div class="upload-label">上传通话录音</div>
                              <div class="wp-upload-zone" @dragover.prevent @drop.prevent="handleFileDrop($event, 'recording')" @click="$refs.recordingInput.click()">
                                <i class="fas fa-microphone text-2xl mb-2 block"></i>
                                <div class="text-sm">点击或拖拽上传通话录音</div>
                                <div class="text-xs text-gray-400 mt-1">支持 .mp3 .wav .m4a 格式，最多10个文件</div>
                                <input ref="recordingInput" type="file" accept=".mp3,.wav,.m4a" class="hidden" multiple @change="handleFileSelect($event, 'recording')" />
                              </div>
                              <div v-if="recordings.length" class="mt-2">
                                <div class="file-list">
                                  <div v-for="(f, i) in recordings" :key="i" class="file-item">
                                    <i class="fas fa-file-audio text-blue-400"></i>
                                    <span class="file-name">{{ f.name }}</span>
                                    <span class="file-size">{{ formatFileSize(f.size) }}</span>
                                    <button class="file-remove" @click="recordings.splice(i,1)" title="移除"><i class="fas fa-times"></i></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="feedback-area">
                              <div class="section-title"><i class="fas fa-comment-dots"></i> 联系情况反馈</div>
                              <textarea class="wp-input text-sm resize-none" rows="5" v-model="contactFeedback" placeholder="请填写联系群众的情况反馈..."></textarea>
                            </div>
                            <div class="step-actions" style="text-align:right">
                              <button class="wp-btn wp-btn-primary" @click="handleStep = 2" :disabled="!contactFeedback.trim()">
                                <span>下一步：诉求处理</span>
                                <i class="fas fa-arrow-right"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- 步骤2: 诉求处理 -->
                    <div v-show="handleStep === 2" class="handle-step-panel">
                      <div class="handle-panel-content">
                        <div class="content-section section-letter">
                          <div class="section-title"><i class="fas fa-lightbulb"></i> AI 处理建议</div>
                          <div class="section-content">
                            <div v-if="processingSuggestion" class="suggestion-text">{{ processingSuggestion }}</div>
                            <div v-else class="suggestion-empty" @click="getAISuggestion">
                              <i class="fas fa-robot"></i>
                              <span>点击获取AI处理建议</span>
                            </div>
                          </div>
                        </div>
                        <div class="content-section section-flow mt-3">
                          <div class="section-title"><i class="fas fa-pen"></i> 处理结果</div>
                          <div class="section-content">
                            <div class="countdown-banner" :class="processingExpired ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50'">
                              <div class="flex items-center gap-2">
                                <i class="fas fa-hourglass-half" :class="processingExpired ? 'text-red-500' : 'text-blue-500'"></i>
                                <span class="text-sm font-medium" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">处理倒计时</span>
                                <span class="ml-auto text-sm font-bold" :class="processingExpired ? 'text-red-600' : 'text-blue-600'">{{ countdownTimerStr || '-' }}</span>
                              </div>
                              <div class="text-xs text-gray-600 mt-1">
                                <span v-if="processingExpired" class="font-medium">处理已超时，请尽快完成处理！</span>
                                <span v-else>请在4个工作日内完成群众联系和处理反馈（节假日顺延）</span>
                              </div>
                            </div>
                            <textarea class="wp-input text-sm resize-none" rows="5" v-model="handleResult" placeholder="请填写信件处理结果..." maxlength="1000"></textarea>
                            <div class="flex items-center justify-end mt-1">
                              <span class="text-xs text-gray-500">{{ handleResult.length }}/1000 字符</span>
                            </div>
                          </div>
                        </div>
                        <div class="step-actions flex justify-between mt-3">
                          <button class="wp-btn wp-btn-secondary" @click="handleStep = 1">
                            <i class="fas fa-arrow-left"></i>
                            <span>上一步：联系群众</span>
                          </button>
                          <button class="wp-btn wp-btn-success" @click="handleSubmit">
                            <span>提交</span>
                            <i class="fas fa-check"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom action bar (matching old platform) -->
          <div class="detail-bottom">
            <div class="bottom-row controls-row">
              <!-- Category dropdown (searchable) - left side -->
              <div class="searchable-select" :class="{ active: categoryDropdownOpen }" id="category-select-container">
                <div class="select-input-wrapper" @click="toggleCategoryDropdown">
                  <input type="text" class="select-input" id="category-select-input"
                    :value="selectedCategory"
                    placeholder="选择信件分类..." readonly>
                  <i class="fas fa-chevron-down select-arrow"></i>
                </div>
                <div class="select-dropdown" v-show="categoryDropdownOpen">
                  <div class="select-search">
                    <input type="text" class="search-input" id="category-search"
                      v-model="categorySearch" @input="filterCategories"
                      placeholder="搜索分类..." @click.stop>
                  </div>
                  <div class="select-options" id="category-select-options">
                    <div v-for="cat in filteredCategories" :key="cat['三级分类']"
                      class="select-option"
                      :class="{ selected: selectedCategory === cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }"
                      @click="selectCategory(cat)"
                    >{{ cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }}</div>
                    <div v-if="filteredCategories.length === 0" class="select-option disabled text-gray-400">无匹配分类</div>
                  </div>
                </div>
              </div>

              <!-- Action buttons - right side -->
              <div class="action-buttons-right">
                <!-- Remark button -->
                <button class="remark-btn" id="btn-remark" @click="showRemarkModal = true" title="添加备注">
                  <i class="fas fa-comment-alt"></i>
                  <span>备注</span>
                </button>

                <!-- Action buttons -->
                <button class="action-btn return" id="btn-return" @click="handleReturn" title="退回信件">
                  <i class="fas fa-undo"></i>
                  <span>退回</span>
                </button>
                <button class="action-btn invalid" id="btn-invalid" @click="handleInvalid" title="标记为不属实">
                  <i class="fas fa-times-circle"></i>
                  <span>不属实</span>
                </button>
                <button class="action-btn submit" id="btn-submit" @click="handleSubmitFromBar" title="提交处理">
                  <i class="fas fa-check-circle"></i>
                  <span>提交</span>
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>

  <!-- Return confirm modal -->
  <div class="modal-overlay" :style="{ display: showReturnModal ? 'flex' : 'none' }" @click.self="showReturnModal = false">
    <div class="modal-container remark-modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-undo text-orange-500"></i>
          退回信件
        </h3>
        <button class="modal-close" @click="showReturnModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="text-sm text-gray-600 mb-3 bg-orange-50 border border-orange-200 rounded p-2">
          <i class="fas fa-info-circle text-orange-500 mr-1"></i>
          信件将退回到上一个处理节点（上一状态/单位），流转记录会保留，倒计时重新开始。
        </div>
        <label class="text-sm font-medium text-gray-700 block mb-1">退回原因</label>
        <textarea class="form-textarea remark-textarea" v-model="returnRemark" placeholder="请输入退回原因..." rows="4"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showReturnModal = false">取消</button>
        <button class="btn" style="background:#f59e0b;color:#fff" @click="confirmReturn">
          <i class="fas fa-undo mr-1"></i>
          确认退回
        </button>
      </div>
    </div>
  </div>

  <!-- Remark modal -->
  <div class="modal-overlay" id="remark-modal" :style="{ display: showRemarkModal ? 'flex' : 'none' }" @click.self="showRemarkModal = false">
    <div class="modal-container remark-modal-container">
      <div class="modal-header">
        <h3 class="modal-title">
          <i class="fas fa-comment-alt"></i>
          请填写处理备注：
        </h3>
        <button class="modal-close" @click="showRemarkModal = false">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <textarea class="form-textarea remark-textarea" id="remark-textarea"
          v-model="remarkText"
          placeholder="请输入处理备注..."
          rows="6"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="showRemarkModal = false">取消</button>
        <button class="btn btn-primary" @click="saveRemark">
          <i class="fas fa-save"></i>
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { getProcessingList, getDetail, submitProcessing, returnLetter, markInvalid, analyzeLetter, getCategories, getByIdcard } from '@/api/letter'
import { normalizeFlowRecords } from '@/utils/flow'
import StatusBadge from '@/components/StatusBadge.vue'

const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const recordings = ref([])
const remark = ref('')
const activeTab = ref('flow')
const loadingFlow = ref(false)
const loadingHistory = ref(false)
const historyLetters = ref([])

// Handle steps state (1-联系群众, 2-诉求处理)
const handleStep = ref(1)
const contactFeedback = ref('')
const handleResult = ref('')
const processingSuggestion = ref('')

// Bottom action bar state
const selectedCategory = ref('')
const categoryDropdownOpen = ref(false)
const categorySearch = ref('')
const showRemarkModal = ref(false)
const remarkText = ref('')
const categories = ref([])

// Processing 30-minute countdown
const processingStartTime = ref(null)
const countdownTimerStr = ref('')
const processingExpired = ref(false)
let processingTimer = null

const filteredCategories = computed(() => {
  if (!categorySearch.value) return categories.value
  const q = categorySearch.value.toLowerCase()
  return categories.value.filter(cat =>
    (cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类']).toLowerCase().includes(q)
  )
})

// AI state
const aiAnalyzing = ref(false)
const aiResult = ref(null)

let pollTimer = null

const tabs = [
  { id: 'flow', label: '流转记录', icon: 'fas fa-exchange-alt' },
  { id: 'history', label: '历史来信', icon: 'fas fa-history' },
  { id: 'handle', label: '信件处理', icon: 'fas fa-edit' },
]

const flowRecords = computed(() => selectedLetter.value?.['流转记录'] || [])

// 展开/收起流转记录详情
const expandedFlowIdx = ref(-1)
const showRawJson = ref({})
const toggleFlowDetail = (idx) => {
  expandedFlowIdx.value = expandedFlowIdx.value === idx ? -1 : idx
  showRawJson.value = {}
}

// ──── Detail loading ────
const formatFileSize = (bytes) => {
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const urgencyBadgeClass = (u) => {
  const val = parseInt(u)
  if (isNaN(val)) return 'bg-gray-100 text-gray-500'
  if (val >= 4) return 'bg-red-100 text-red-600'
  if (val >= 3) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
}

const workspaceMainRef = ref(null)
const sectionFlowRef = ref(null)
const sectionHistoryRef = ref(null)
const sectionHandleRef = ref(null)

const selectLetter = async (letter) => {
  selectedLetter.value = letter
  handleStep.value = 1
  contactFeedback.value = ''
  handleResult.value = ''
  processingSuggestion.value = ''
  recordings.value = []

  activeTab.value = 'flow'
  historyLetters.value = []

  // Auto-select category from letter details
  if (letter['信件一级分类'] || letter['信件二级分类'] || letter['信件三级分类']) {
    selectedCategory.value = [letter['信件一级分类'], letter['信件二级分类'], letter['信件三级分类']].filter(Boolean).join(' / ')
  } else {
    selectedCategory.value = ''
  }

  // Fetch detail for flow records
  await loadFlowRecords(letter['信件编号'])
  // Fetch history letters
  await loadHistoryLetters(letter['手机号'] || letter['身份证号'])
  // Start 30-minute processing countdown
  startProcessingCountdown()
}

const startProcessingCountdown = () => {
  // 使用后端返回的 deadline_at 字段（由 Dispatch 方法设置 4 个工作日截止时间）
  const deadlineAt = selectedLetter.value?._raw?.deadline_at
  if (deadlineAt) {
    const deadlineMs = new Date(deadlineAt).getTime()
    if (isNaN(deadlineMs)) {
      console.warn('无效的 deadline_at:', deadlineAt)
    } else {
      const remaining = deadlineMs - Date.now()
      if (remaining <= 0) {
        countdownTimerStr.value = '已超时'
        processingExpired.value = true
        return
      }
      processingStartTime.value = 'backend:' + deadlineAt
      processingExpired.value = false
      const updateFromDeadline = () => {
        const remain = deadlineMs - Date.now()
        if (remain <= 0) {
          countdownTimerStr.value = '已超时'
          processingExpired.value = true
          if (processingTimer) {
            clearInterval(processingTimer)
            processingTimer = null
          }
          return
        }
        countdownTimerStr.value = formatRemainingTime(remain)
      }
      updateFromDeadline()
      if (processingTimer) clearInterval(processingTimer)
      processingTimer = setInterval(updateFromDeadline, 1000)
      return
    }
  }

  // 后备方案：从流转记录中找最新一次 dispatch 操作时间，加4个工作日作为截止时间
  const records = selectedLetter.value?.['流转记录'] || []
  let startTime = null
  for (let i = records.length - 1; i >= 0; i--) {
    const rec = records[i]
    const opType = rec['操作类型'] || ''
    if (opType === '下发' || opType === 'dispatch') {
      startTime = rec['操作时间']
      break
    }
  }
  if (!startTime) {
    for (const rec of records) {
      if (rec['操作类型'] === '自行处理') {
        startTime = rec['操作时间']
        break
      }
    }
  }
  if (!startTime && selectedLetter.value?.['处理开始时间']) {
    startTime = selectedLetter.value['处理开始时间']
  }
  if (!startTime && selectedLetter.value?.['更新时间']) {
    startTime = selectedLetter.value['更新时间']
  }
  
  if (startTime) {
    // 简单的4天估算（前端无法精确计算工作日，依赖后端 deadline_at）
    const deadlineMs = new Date(startTime).getTime() + 4 * 24 * 60 * 60 * 1000
    const remaining = deadlineMs - Date.now()
    if (remaining <= 0) {
      countdownTimerStr.value = '已超时'
      processingExpired.value = true
      return
    }
    processingStartTime.value = 'flow:' + startTime
    processingExpired.value = false
    const updateFromDeadline = () => {
      const remain = deadlineMs - Date.now()
      if (remain <= 0) {
        countdownTimerStr.value = '已超时'
        processingExpired.value = true
        if (processingTimer) {
          clearInterval(processingTimer)
          processingTimer = null
        }
        return
      }
      countdownTimerStr.value = formatRemainingTime(remain)
    }
    updateFromDeadline()
    if (processingTimer) clearInterval(processingTimer)
    processingTimer = setInterval(updateFromDeadline, 1000)
    return
  }
  
  processingStartTime.value = Date.now()
  processingExpired.value = false
  updateCountdownDisplay()
  if (processingTimer) clearInterval(processingTimer)
  processingTimer = setInterval(updateCountdownDisplay, 1000)
}

// 格式化剩余时间为可读格式
const formatRemainingTime = (ms) => {
  if (ms <= 0) return '已超时'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}

const updateCountdownDisplay = () => {
  if (!processingStartTime.value) {
    countdownTimerStr.value = ''
    return
  }
  const elapsed = Date.now() - processingStartTime.value
  const remaining = 4 * 24 * 60 * 60 * 1000 - elapsed
  if (remaining <= 0) {
    countdownTimerStr.value = '已超时'
    processingExpired.value = true
    if (processingTimer) {
      clearInterval(processingTimer)
      processingTimer = null
    }
    return
  }
  countdownTimerStr.value = formatRemainingTime(remaining)
}

const loadFlowRecords = async (letterNo) => {
  if (!letterNo) return
  loadingFlow.value = true
  try {
    const res = await getDetail(letterNo)
    const records = res?.data?.flow?.flow_records
    if (Array.isArray(records) && records.length > 0) {
      selectedLetter.value['流转记录'] = normalizeFlowRecords(records)
    } else {
      selectedLetter.value['流转记录'] = []
    }
    // 从详情接口提取 deadline_at，用于倒计时计算
    if (res?.data?.letter?.deadline_at) {
      if (!selectedLetter.value._raw) {
        selectedLetter.value._raw = {}
      }
      selectedLetter.value._raw.deadline_at = res.data.letter.deadline_at
      selectedLetter.value['截止时间'] = res.data.letter.deadline_at
    }
  } catch (e) {
    console.error('Failed to fetch flow records:', e)
    selectedLetter.value['流转记录'] = []
  }
  loadingFlow.value = false
}

const loadHistoryLetters = async (idCard) => {
  if (!idCard) {
    historyLetters.value = []
    return
  }
  loadingHistory.value = true
  try {
    const res = await getByIdcard({ id_card: idCard })
    if (res.success && Array.isArray(res.data)) {
      // Filter out current letter and map fields
      const currentNo = selectedLetter.value?.['信件编号']
      historyLetters.value = res.data
        .filter(item => item.letter_no !== currentNo)
        .map(item => ({
          '信件编号': item.letter_no,
          '群众姓名': item.citizen_name,
          '手机号': item.phone,
          '身份证号': item.id_card,
          '诉求内容': item.content,
          '来信时间': item.received_at,
          '信件一级分类': item.category_l1,
          '信件二级分类': item.category_l2,
          '信件三级分类': item.category_l3,
          '信件状态': item.current_status,
          '当前信件状态': item.current_status,
        }))
    } else {
      historyLetters.value = []
    }
  } catch (e) {
    console.error('Failed to fetch history letters:', e)
    historyLetters.value = []
  }
  loadingHistory.value = false
}

const handleFileSelect = (e, type) => {
  const files = Array.from(e.target.files)
  if (type === 'recording') recordings.value = [...recordings.value, ...files]
}

const handleFileDrop = (e, type) => {
  const files = Array.from(e.dataTransfer.files)
  if (type === 'recording') recordings.value = [...recordings.value, ...files]
}

// 退回弹窗状态
const showReturnModal = ref(false)
const returnRemark = ref('')

const handleReturn = () => {
  if (!selectedLetter.value) return
  returnRemark.value = ''
  showReturnModal.value = true
}

const confirmReturn = async () => {
  if (!selectedLetter.value) return
  showReturnModal.value = false
  try {
    await returnLetter({ letter_no: selectedLetter.value['信件编号'], remark: returnRemark.value })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

const handleSubmit = async () => {
  if (!selectedLetter.value) return
  if (!handleResult.value.trim()) {
    alert('请填写处理结果')
    return
  }
  submitting.value = true
  try {
    // Upload recordings first if any — one file at a time
    if (recordings.value.length > 0) {
      for (const file of recordings.value) {
        const formData = new FormData()
        formData.append('letter_no', selectedLetter.value['信件编号'])
        formData.append('file', file)
        formData.append('file_type', 'call_recordings')
        await fetch('/api/letter/', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })
      }
    }
    await submitProcessing({
      letter_no: selectedLetter.value['信件编号'],
      remark: handleResult.value,
      contact_feedback: contactFeedback.value,
      category: selectedCategory.value,
    })
    // 重新加载信件列表
    selectedLetter.value = null
    await loadData()
    // 不清除已有状态，但不再自动选中已提交的信件
    handleStep.value = 1
    contactFeedback.value = ''
    handleResult.value = ''
    recordings.value = []
    // 如果列表还有未处理的，自动选中第一封
    const remaining = Object.values(letters.value)
    if (remaining.length > 0) {
      await selectLetter(remaining[0])
    }
  } catch {}
  submitting.value = false
}

const runAIAnalysis = async () => {
  if (!selectedLetter.value) return
  aiAnalyzing.value = true
  aiResult.value = null
  try {
    const res = await analyzeLetter({ letter_no: selectedLetter.value['信件编号'] })
    aiResult.value = res.success ? res.data : { _error: true, message: res.message || '分析失败' }
  } catch {
    aiResult.value = { _error: true, message: '网络错误' }
  }
  aiAnalyzing.value = false
}

const handleInvalid = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认标记此信件为无效？')) return
  try {
    await markInvalid({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

const getAISuggestion = async () => {
  if (!selectedLetter.value || !selectedLetter.value['诉求内容']) {
    processingSuggestion.value = '暂无诉求内容可供分析'
    return
  }
  try {
    const res = await analyzeLetter({ letter_no: selectedLetter.value['信件编号'] })
    processingSuggestion.value = res.success
      ? (res.data?.suggestion || res.data?.analysis || '分析完成，请查看')
      : 'AI分析暂不可用'
  } catch {
    processingSuggestion.value = 'AI分析暂不可用'
  }
}

// Bottom action bar methods
const loadCategories = async () => {
  try {
    const res = await getCategories()
    if (res.success) {
      categories.value = flattenCategories(res.data || [])
    }
  } catch {}
}

const toggleCategoryDropdown = () => {
  categoryDropdownOpen.value = !categoryDropdownOpen.value
  if (categoryDropdownOpen.value) {
    categorySearch.value = ''
  }
}

// Flatten the category tree (name/children) into flat objects (一级分类/二级分类/三级分类)
const flattenCategories = (cats, level1 = '', level2 = '') => {
  const result = []
  for (const cat of cats) {
    if (cat.children && cat.children.length > 0) {
      if (!level1) {
        // Top level — recurse with this as level1
        result.push(...flattenCategories(cat.children, cat.name, ''))
      } else if (!level2) {
        // Second level — recurse with this as level2
        result.push(...flattenCategories(cat.children, level1, cat.name))
      }
    } else {
      // Leaf node — create flat object
      result.push({
        '一级分类': level1,
        '二级分类': level2 || '',
        '三级分类': cat.name,
      })
    }
  }
  // If a 2nd-level node has no children, add it directly
  if (cats.length > 0 && !cats[0].children) {
    result.push(...cats.map(c => ({
      '一级分类': level1 || c.name,
      '二级分类': level2,
      '三级分类': c.name,
    })))
  }
  return result
}

const filterCategories = () => {
  // computed handles filtering
}

const selectCategory = (cat) => {
  selectedCategory.value = `${cat['一级分类']} / ${cat['二级分类']} / ${cat['三级分类']}`
  categoryDropdownOpen.value = false
  
  // Update letter info
  if (selectedLetter.value) {
    selectedLetter.value['信件一级分类'] = cat['一级分类']
    selectedLetter.value['信件二级分类'] = cat['二级分类']
    selectedLetter.value['信件三级分类'] = cat['三级分类']
  }
}

const saveRemark = () => {
  if (remarkText.value.trim()) {
    remark.value = remarkText.value
  }
  showRemarkModal.value = false
}

const handleSubmitFromBar = async () => {
  await handleSubmit()
}

// Close category dropdown on click outside
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const container = document.getElementById('category-select-container')
    if (container && !container.contains(e.target)) {
      categoryDropdownOpen.value = false
    }
  })
}

// ──── Tab switching (matching old platform) ────
// 点击左侧标签 → 切换中间内容区，对标老系统 sidebar-item 点击事件
const switchTab = (tabId) => {
  activeTab.value = tabId
  const container = workspaceMainRef.value
  if (!container) return
  const sectionMap = {
    flow: sectionFlowRef.value,
    history: sectionHistoryRef.value,
    handle: sectionHandleRef.value
  }
  const targetSection = sectionMap[tabId]
  if (targetSection) {
    container.scrollTo({
      top: targetSection.offsetTop - container.offsetTop - 12,
      behavior: 'smooth'
    })
  }
}

// 点击历史来信条目 → 滚动到该条目的位置（在当前 tab-body 内部滚动）
const scrollToHistoryLetter = (e) => {
  const el = e.currentTarget
  if (!el) return
  // 找到最近的 .tab-body（overflow-y:auto 的滚动容器）
  const container = el.closest('.tab-body')
  if (!container) return
  // 选中高亮：先移除所有历史来信的高亮，再给当前点击的添加高亮
  document.querySelectorAll('.history-letter-item').forEach(item => item.classList.remove('history-letter-selected'))
  el.classList.add('history-letter-selected')
  container.scrollTo({
    top: el.offsetTop - container.offsetTop - 12,
    behavior: 'smooth'
  })
}

const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getProcessingList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(letter => {
        // Map backend fields (English) to frontend field names (Chinese)
        const mapped = {
          '信件编号': letter.letter_no,
          '群众姓名': letter.citizen_name,
          '手机号': letter.phone,
          '身份证号': letter.id_card,
          '诉求内容': letter.content,
          '信件一级分类': letter.category_l1,
          '信件二级分类': letter.category_l2,
          '信件三级分类': letter.category_l3,
          '信件状态': letter.current_status,
          '来信时间': letter.received_at,
          '当前信件处理单位': letter.current_unit,
          '紧急程度': letter.urgency_level,
          '截止时间': letter.deadline_at,
          '来源': letter.source || letter.channel || '局长信箱',
          '更新时间': letter.updated_at,
          // Keep original object for debugging
          _raw: letter
        }
        dict[mapped['信件编号']] = mapped
      })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

// ──── Scroll spy ────
const setupScrollSpy = () => {
  const container = workspaceMainRef.value
  if (!container) return
  const sectionIds = ['flow', 'history', 'handle']
  const sectionRefs = [sectionFlowRef, sectionHistoryRef, sectionHandleRef]
  const handleScroll = () => {
    const scrollTop = container.scrollTop
    for (let i = sectionRefs.length - 1; i >= 0; i--) {
      const section = sectionRefs[i].value
      if (section && section.offsetTop - container.offsetTop <= scrollTop + 60) {
        activeTab.value = sectionIds[i]
        break
      }
    }
  }
  container.addEventListener('scroll', handleScroll)
  return () => container.removeEventListener('scroll', handleScroll)
}

let removeScrollSpy = null
watch(selectedLetter, async (newVal) => {
  if (removeScrollSpy) {
    removeScrollSpy()
    removeScrollSpy = null
  }
  if (newVal) {
    await nextTick()
    removeScrollSpy = setupScrollSpy()
  }
})

onMounted(async () => {
  await loadData()
  await loadCategories()
  // Auto-select first letter
  const lettersList = Object.values(letters.value)
  if (lettersList.length > 0) {
    await selectLetter(lettersList[0])
  }
  pollTimer = setInterval(loadData, 5000)
})

onUnmounted(() => {
  if (removeScrollSpy) removeScrollSpy()
  if (pollTimer) clearInterval(pollTimer)
  if (processingTimer) clearInterval(processingTimer)
})
</script>

<style scoped>
/* 标签页内容切换 (对标老系统 workspace-main / .tab-section / .tab-body) */
.workspace-main {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.tab-section {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.tab-section:last-child {
  border-bottom: none;
}
.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}
.section-header i {
  color: #3b82f6;
}
.tab-body {
  padding: 0;
}

/* Bottom action bar layout */
.detail-bottom {
  flex-shrink: 0;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
}
.bottom-row.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 12px;
}
.action-buttons-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

/* 信件处理步骤指示器（老系统风格） */
.handle-steps-header {
  display: flex;
  align-items: center;
  gap: 6px;
}
.handle-step-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}
.handle-step-number {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #e5e7eb;
  color: #6b7280;
  transition: all 0.3s ease;
}
.handle-step-title {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.3s ease;
}
.handle-step-line {
  width: 30px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px;
  transition: all 0.3s ease;
}
.handle-step-indicator.active .handle-step-number {
  background: #3b82f6;
  color: #ffffff;
}
.handle-step-indicator.active .handle-step-title {
  color: #3b82f6;
  font-weight: 600;
}
.handle-steps-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.handle-step-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 8px;
}
.handle-panel-content {
  padding: 16px;
  overflow: auto;
}
.suggestion-text {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #1e40af;
  line-height: 1.6;
}
.suggestion-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  color: #6b7280;
  font-size: 13px;
  transition: all 0.2s;
}
.suggestion-empty:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #3b82f6;
}
.step-actions {
  margin-top: 16px;
}
.step-actions .wp-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.step-actions .wp-btn-primary {
  background: #3b82f6;
  color: white;
}
.step-actions .wp-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.step-actions .wp-btn-primary:hover:not(:disabled) {
  background: #2563eb;
}
.step-actions .wp-btn-secondary {
  background: #f3f4f6;
  color: #374151;
}
.step-actions .wp-btn-secondary:hover {
  background: #e5e7eb;
}
.step-actions .wp-btn-success {
  background: #10b981;
  color: white;
}
.step-actions .wp-btn-success:hover {
  background: #059669;
}

/* 流转记录详情展开/收起 */
.flow-item-detail-toggle {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e5e7eb;
  font-size: 12px;
  color: #3b82f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}
.flow-item-detail-toggle:hover {
  color: #2563eb;
}
.flow-item-detail {
  margin-top: 8px;
  padding: 10px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.flow-detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  font-size: 12px;
}
.flow-detail-row {
  display: contents;
}
.flow-detail-row-full {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid #e5e7eb;
}
.flow-detail-label {
  color: #6b7280;
  white-space: nowrap;
  padding: 3px 0;
}
.flow-detail-value {
  color: #374151;
  padding: 3px 0;
}
.flow-detail-row-full .flow-detail-label {
  white-space: normal;
}
.flow-detail-remark-item {
  margin-bottom: 2px;
}
.flow-detail-remark-item .remark-key {
  font-weight: 500;
  color: #6b7280;
}
.flow-detail-raw-toggle {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px dashed #e5e7eb;
  font-size: 11px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}
.flow-detail-raw-toggle:hover {
  color: #6b7280;
}
.flow-detail-raw {
  margin: 6px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #6b7280;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
}
.inline-mx-1 {
  margin: 0 4px;
}
.flow-item-unit {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
</style>
