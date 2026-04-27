<template>
  <div class="dispatch-container h-full flex flex-col">
    <!-- Header -->
    <div class="wp-header flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-xl border border-gray-200 mb-6 flex-shrink-0" id="dispatch-header">
      <div class="wp-header-left flex items-center gap-3">
        <div class="wp-header-icon w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <i class="fas fa-paper-plane text-yellow-600"></i>
        </div>
        <div class="wp-header-content flex flex-col gap-0.5">
          <div class="wp-header-title text-lg font-bold text-gray-900">下发工作台</div>
          <div class="wp-header-subtitle text-xs text-gray-400">将预处理信件下发至指定单位办理</div>
        </div>
      </div>
      <div class="wp-header-right flex items-center gap-4">
        <label class="wp-checkbox warning flex items-center gap-1.5 px-4 py-1.5 bg-red-50 rounded-xl cursor-pointer">
          <input type="checkbox" class="checkbox-input w-3.5 h-3.5 accent-red-500" id="auto-dispatch-check" v-model="autoDispatchEnabled" />
          <span class="wp-checkbox-label text-xs text-red-800 font-medium">自动下发</span>
        </label>
        <div class="wp-count-badge flex items-center gap-1 px-4 py-1.5 bg-blue-50 rounded-xl">
          <span class="wp-count-value text-2xl font-extrabold text-blue-600">{{ Object.keys(letters).length }}</span>
          <span class="wp-count-label text-xs text-gray-500">封待处理</span>
        </div>
        <button class="bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" @click="autoDispatchAll" :disabled="autoDispatchingAll || Object.keys(letters).length === 0">
          <i class="fas fa-robot" :class="{ 'fa-spin': autoDispatchingAll }"></i>
          {{ autoDispatchingAll ? '自动下发中...' : '全部自动下发' }}
        </button>
      </div>
    </div>

    <!-- Main content -->
    <div class="dispatch-main-content flex-1 flex overflow-hidden gap-4">
      <!-- Left: letter list panel -->
      <div class="dispatch-letter-list-panel w-[280px] bg-white rounded-xl border border-gray-200 overflow-y-auto p-3" id="letter-list-panel">
        <div v-if="loadingList && Object.keys(letters).length === 0" class="text-center py-8 text-gray-400 text-sm">
          <i class="fas fa-spinner fa-spin mr-2"></i>加载中...
        </div>
        <div v-else-if="Object.keys(letters).length === 0" class="text-center py-12 text-gray-400">
          <i class="fas fa-check-circle text-green-400 text-3xl mb-2 block"></i>
          <span class="text-sm">暂无待下发信件</span>
        </div>
        <div
          v-for="letter in sortedLetters"
          :key="letter['信件编号']"
          class="dispatch-list-item p-3.5 rounded-xl cursor-pointer border border-gray-200 mb-2.5 bg-white shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
          :class="{ 'border-blue-200 bg-blue-50': selectedLetter?.['信件编号'] === letter['信件编号'] }"
          @click="selectLetter(letter)"
        >
          <div class="dispatch-item-category text-xs text-blue-600 font-medium mb-1">{{ letter['信件三级分类'] || letter['信件二级分类'] || letter['信件一级分类'] || '未分类' }}</div>
          <div class="dispatch-item-number text-xs font-mono text-gray-700 mb-1">{{ letter['信件编号'] }}</div>
          <div class="dispatch-item-meta flex items-center gap-3 text-xs text-gray-400">
            <span class="dispatch-item-citizen"><i class="fas fa-user mr-1"></i> {{ letter['群众姓名'] || '匿名' }}</span>
            <span class="dispatch-item-time"><i class="far fa-clock mr-1"></i> {{ formatTime(letter['来信时间']) }}</span>
          </div>
          <div v-if="letter['_ai_analyzed']" class="text-xs text-purple-500 mt-1">
            <i class="fas fa-robot mr-0.5"></i>已分析
          </div>
        </div>
      </div>

      <!-- Right: detail panel -->
      <div class="dispatch-letter-detail-panel flex-1 flex flex-col overflow-hidden bg-white rounded-xl border border-gray-200" id="letter-detail-panel">
        <!-- No selection state -->
        <div v-if="!selectedLetter" class="flex-1 flex items-center justify-center text-gray-400">
          <div class="text-center">
            <i class="fas fa-hand-point-left text-4xl mb-3 block text-gray-300"></i>
            <p class="text-sm">请从左侧选择信件</p>
            <p class="text-xs text-gray-300 mt-1">选中信件后可进行AI分析、下发等操作</p>
          </div>
        </div>

        <template v-else>
          <!-- Detail header bar -->
          <div class="wp-panel-header compact flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <div class="flex items-center gap-2">
              <i class="fas fa-envelope text-gray-400"></i>
              <span class="text-sm font-semibold text-gray-700">{{ selectedLetter['信件编号'] }}</span>
              <StatusBadge :status="selectedLetter['信件状态']" />
            </div>
            <div class="flex gap-2">
              <button class="text-xs py-1 px-2 rounded-lg flex items-center gap-1" :class="aiAnalyzing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'"
                @click="runAIAnalysis" :disabled="aiAnalyzing">
                <i class="fas fa-robot" :class="{ 'fa-spin': aiAnalyzing }"></i>
                {{ aiAnalyzing ? '分析中...' : 'AI分析' }}
              </button>
              <button class="text-xs py-1 px-2 rounded-lg flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200" @click="handleInvalid">
                <i class="fas fa-ban"></i>标记无效
              </button>
            </div>
          </div>

          <!-- Scrollable middle area -->
          <div class="flex-1 overflow-y-auto flex flex-col" ref="detailScrollRef" style="contain:layout size">
            <!-- dispatch-detail-top -->
            <div class="dispatch-detail-top flex border-b border-gray-100">
              <div class="dispatch-detail-info w-2/5 border-r border-gray-100 p-3 overflow-y-auto">
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-envelope text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <span class="text-xs text-gray-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{{ selectedLetter['信件编号'] || '-' }}</span>
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-tags text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <span class="text-xs text-gray-700 font-medium overflow-hidden text-ellipsis whitespace-nowrap">{{ selectedLetter['信件一级分类'] || '' }}{{ selectedLetter['信件二级分类'] ? ' / ' + selectedLetter['信件二级分类'] : '' }}{{ selectedLetter['信件三级分类'] ? ' / ' + selectedLetter['信件三级分类'] : '' || '-' }}</span>
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-clock text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <input type="text" readonly :value="formatTime(selectedLetter['来信时间'])" placeholder="-" class="text-xs text-gray-700 font-medium border-none bg-transparent outline-none flex-1 p-0 cursor-pointer" />
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-user text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <input type="text" readonly :value="selectedLetter['群众姓名'] || ''" placeholder="-" class="text-xs text-gray-700 font-medium border-none bg-transparent outline-none flex-1 p-0 cursor-pointer" />
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-phone text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <input type="text" readonly :value="selectedLetter['手机号'] || ''" placeholder="-" class="text-xs text-gray-700 font-medium border-none bg-transparent outline-none flex-1 p-0 cursor-pointer" />
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-id-card text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <input type="text" readonly :value="selectedLetter['身份证号'] || ''" placeholder="-" class="text-xs text-gray-700 font-medium border-none bg-transparent outline-none flex-1 p-0 cursor-pointer" />
                </div>
                <div class="wp-info-row flex items-center gap-2 py-1">
                  <i class="fas fa-inbox text-gray-400 text-[13px] w-4 text-center flex-shrink-0"></i>
                  <span class="text-xs text-gray-700 font-medium">{{ selectedLetter['来源'] || '-' }}</span>
                </div>
              </div>
              <div class="dispatch-detail-content w-3/5 p-3 flex flex-col">
                <div class="dispatch-content-header flex items-center gap-1.5 mb-1">
                  <i class="fas fa-align-left text-gray-400 text-[13px]"></i>
                  <span class="text-[13px] font-semibold text-gray-700">诉求内容</span>
                </div>
                <textarea class="dispatch-appeal-textarea flex-1 w-full text-[13px] text-gray-700 bg-transparent border-none outline-none resize-none p-0 leading-relaxed"
                  v-model="form.content" placeholder="请输入诉求内容..."></textarea>
              </div>
            </div>

            <!-- AI Analysis Results banner -->
            <div v-if="aiResult" class="mx-3 mt-2 p-2.5 rounded-lg border flex-shrink-0"
              :class="aiResult._error ? 'border-red-200 bg-red-50' : 'border-purple-200 bg-purple-50'">
              <div class="flex items-center gap-2 mb-1.5">
                <i class="fas fa-robot text-purple-500"></i>
                <span class="text-xs font-semibold text-purple-700">AI分析结果</span>
                <button class="ml-auto text-gray-400 hover:text-gray-600 text-xs" @click="aiResult = null">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <template v-if="!aiResult._error">
                <div class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <div><span class="text-gray-500">摘要：</span><span class="text-gray-700">{{ aiResult.summary || '-' }}</span></div>
                  <div><span class="text-gray-500">情绪：</span>
                    <span class="px-1.5 py-0.5 rounded" :class="sentimentBadge(aiResult.sentiment)">{{ aiResult.sentiment || '-' }}</span>
                  </div>
                  <div><span class="text-gray-500">建议分类：</span><span class="text-gray-700">{{ aiResult.suggested_category_l1 || '-' }} / {{ aiResult.suggested_category_l2 || '-' }} / {{ aiResult.suggested_category_l3 || '-' }}</span></div>
                  <div><span class="text-gray-500">建议下发：</span><span class="text-blue-600 font-medium">{{ aiResult.suggested_unit || '-' }}</span></div>
                  <div><span class="text-gray-500">紧急程度：</span>
                    <span class="px-1.5 py-0.5 rounded" :class="urgencyBadgeClass(aiResult.urgency)">{{ aiResult.urgency ? aiResult.urgency + '/5' : '-' }}</span>
                  </div>
                  <div class="col-span-2"><span class="text-gray-500">建议理由：</span><span class="text-gray-600">{{ aiResult.reason || '-' }}</span></div>
                </div>
                <div class="mt-1.5 flex gap-2">
                  <button class="bg-green-500 text-white text-xs py-0.5 px-2 rounded-lg hover:bg-green-600 flex items-center gap-1" @click="applyAISuggestions">
                    <i class="fas fa-check mr-1"></i>采纳建议
                  </button>
                  <button class="bg-blue-500 text-white text-xs py-0.5 px-2 rounded-lg hover:bg-blue-600 flex items-center gap-1" @click="autoDispatchSingle(selectedLetter)">
                    <i class="fas fa-robot mr-1"></i>AI自动下发
                  </button>
                </div>
              </template>
              <template v-else>
                <div class="text-xs text-red-600">{{ aiResult._error }}</div>
              </template>
            </div>

            <!-- dispatch-detail-middle -->
            <div class="dispatch-detail-middle flex flex-col flex-1" id="detail-middle">
              <div class="dispatch-ai-chat-messages flex-1 overflow-y-auto px-3 py-2 space-y-2" id="ai-chat-messages" ref="chatMessagesRef">
                <template v-if="aiChatMessages.length === 0">
                  <div class="text-center py-6 text-gray-400 text-xs">
                    <i class="fas fa-comment-dots text-gray-300 text-xl mb-1 block"></i>
                    <p>与AI助手对话，获取信件处理建议</p>
                  </div>
                </template>
                <template v-for="(msg, idx) in aiChatMessages" :key="idx">
                  <div :class="['dispatch-ai-message', msg.role === 'user' ? 'dispatch-ai-message-user flex justify-end' : 'dispatch-ai-message-ai flex justify-start']">
                    <div class="dispatch-ai-message-content p-2 rounded-lg text-sm max-w-[85%]"
                      :class="msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'">
                      <div class="dispatch-ai-message-text whitespace-pre-wrap">{{ msg.content }}</div>
                    </div>
                  </div>
                </template>
                <!-- Typing indicator -->
                <div v-if="aiChatProcessing" class="dispatch-ai-message dispatch-ai-message-ai flex justify-start">
                  <div class="dispatch-ai-message-content p-2 rounded-lg text-sm bg-gray-100 text-gray-800 max-w-[85%]">
                    <div class="typing-indicator flex gap-1">
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0s"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.15s"></span>
                      <span class="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.3s"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- End scrollable middle area -->

          <!-- dispatch-detail-bottom -->
          <div class="dispatch-detail-bottom flex-shrink-0">

            <!-- AI chat input row -->
            <div class="dispatch-ai-chat-input-wrapper">
              <div class="dispatch-ai-chat-input-container flex items-center gap-2 px-3 py-1.5 bg-white">
                <input
                  type="text"
                  class="dispatch-ai-chat-input flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  id="ai-chat-input"
                  v-model="aiChatInput"
                  @keydown.enter.prevent="sendAIChatMessage"
                  placeholder="请输入您的问题..."
                  :disabled="aiChatProcessing"
                />
                <button
                  class="dispatch-ai-chat-send px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                  :class="aiChatProcessing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'"
                  id="btn-send-message"
                  @click="sendAIChatMessage"
                  :disabled="aiChatProcessing"
                >
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>

            <!-- dispatch-controls-row -->
            <div class="dispatch-bottom-row dispatch-controls-row flex items-center gap-2 px-3 py-1.5 flex-wrap">
              <!-- Category dropdown -->
              <div class="dispatch-searchable-select relative" style="width:240px" :class="{ active: categoryDropdownOpen }" id="category-select-container">
                <div class="dispatch-select-input-wrapper flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer select-none" @click="toggleCategoryDropdown">
                  <input type="text" class="dispatch-select-input flex-1 text-xs bg-transparent outline-none cursor-pointer min-w-0"
                    id="category-select-input"
                    :value="selectedCategory"
                    placeholder="选择信件分类..." readonly>
                  <i class="fas fa-chevron-down text-gray-400 text-xs dispatch-select-arrow"></i>
                </div>
                <div class="dispatch-select-dropdown absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg mb-1 z-50 shadow-lg max-h-60 overflow-y-auto" v-show="categoryDropdownOpen">
                  <div class="dispatch-select-search p-2 border-b border-gray-100">
                    <input type="text" class="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400" id="category-search"
                      v-model="categorySearch" @input="filterCategories"
                      placeholder="搜索分类..." @click.stop>
                  </div>
                  <div class="dispatch-select-options" id="category-select-options">
                    <div v-for="cat in filteredCategories" :key="cat['三级分类']"
                      class="dispatch-select-option px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50"
                      :class="{ 'bg-blue-100 text-blue-700 font-medium': selectedCategory === cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }"
                      @click="selectCategory(cat)"
                    >{{ cat['一级分类'] + ' / ' + cat['二级分类'] + ' / ' + cat['三级分类'] }}</div>
                    <div v-if="filteredCategories.length === 0" class="dispatch-select-option px-3 py-1.5 text-xs text-gray-400 disabled">无匹配分类</div>
                  </div>
                </div>
              </div>

              <!-- Unit dropdown -->
              <div class="dispatch-searchable-select relative" style="width:180px" :class="{ active: showUnitDropdown }" id="unit-select-container">
                <div class="dispatch-select-input-wrapper flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer select-none" @click="showUnitDropdown = !showUnitDropdown">
                  <input type="text" class="dispatch-select-input flex-1 text-xs bg-transparent outline-none cursor-pointer min-w-0" id="unit-select-input"
                    :value="form.unit"
                    placeholder="选择下发单位..." readonly>
                  <i class="fas fa-chevron-down text-gray-400 text-xs dispatch-select-arrow"></i>
                </div>
                <div class="dispatch-select-dropdown absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg mb-1 z-50 shadow-lg max-h-60 overflow-y-auto" v-show="showUnitDropdown" id="unit-select-dropdown">
                  <div class="dispatch-select-search p-2 border-b border-gray-100">
                    <input type="text" class="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400" id="unit-search"
                      v-model="unitSearchKeyword" placeholder="搜索单位..." @click.stop>
                  </div>
                  <div class="dispatch-select-options" id="unit-select-options">
                    <div v-if="filteredDispatchUnits.length === 0" class="dispatch-select-option px-3 py-1.5 text-xs text-gray-400 disabled">未找到匹配的单位</div>
                    <div v-else v-for="u in filteredDispatchUnits" :key="u.system_code || u.id"
                      class="dispatch-select-option px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50"
                      :class="{ 'bg-blue-100 text-blue-700 font-medium': form.unit === u.fullName }"
                      @click="selectDispatchUnit(u)">
                      <span class="unit-path text-gray-400 text-[10px] block leading-tight">{{ u.unitPath || '' }}</span>
                      <span>{{ u.fullName }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Focus dropdown -->
              <div class="dispatch-searchable-select flex-shrink-0 relative" style="width:140px" :class="{ active: showFocusDropdown }" id="focus-select-container">
                <div class="dispatch-select-input-wrapper flex items-center bg-white border border-gray-200 rounded-lg px-3 py-1.5 cursor-pointer select-none" @click="toggleFocusDropdown">
                  <input type="text" class="dispatch-select-input flex-1 text-xs bg-transparent outline-none cursor-pointer min-w-0" id="focus-select-input"
                    :value="selectedFocus"
                    placeholder="专项关注..." readonly>
                  <i class="fas fa-chevron-down text-gray-400 text-xs dispatch-select-arrow"></i>
                </div>
                <div class="dispatch-select-dropdown absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg mb-1 z-50 shadow-lg max-h-60 overflow-y-auto" v-show="showFocusDropdown" id="focus-select-dropdown">
                  <div class="dispatch-select-search p-2 border-b border-gray-100">
                    <input type="text" class="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 outline-none focus:border-blue-400" id="focus-search"
                      v-model="focusSearch" placeholder="搜索专项关注..." @click.stop>
                  </div>
                  <div class="dispatch-select-options" id="focus-select-options">
                    <div v-if="filteredFocusList.length === 0" class="dispatch-select-option px-3 py-1.5 text-xs text-gray-400 disabled">无匹配标签</div>
                    <div v-else v-for="f in filteredFocusList" :key="f.id"
                      class="dispatch-select-option px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50"
                      :class="{ 'bg-blue-100 text-blue-700 font-medium': selectedFocus === (f['专项关注标题'] || f.tag_name || f.title || '') }"
                      @click="selectFocus(f)">
                      <span>{{ f['专项关注标题'] || f.tag_name || f.title }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Remark button -->
              <button class="wp-remark-btn flex-shrink-0 flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200" id="btn-remark" @click="showRemarkModal">
                <i class="fas fa-comment-alt"></i>
                <span>备注</span>
              </button>
            </div>

            <!-- dispatch-buttons-row -->
            <div class="dispatch-bottom-row dispatch-buttons-row flex items-center justify-center gap-4 px-3 py-2.5 bg-gray-50 border-t border-gray-200">
              <button class="wp-btn-action wp-btn-primary bg-blue-500 text-white px-5 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5" @click="handleDispatch">
                <i class="fas fa-paper-plane"></i>下发
              </button>
              <button class="wp-btn-action wp-btn-success bg-green-500 text-white px-5 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-green-600 flex items-center gap-1.5" @click="handleBySelf">
                <i class="fas fa-user-check"></i>由我来处理
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Confirm dispatch modal -->
    <div v-if="showDispatchModal" class="wp-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" @click.self="showDispatchModal = false">
      <div class="wp-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-[500px] mx-4">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-paper-plane text-yellow-500"></i>
          <span class="text-lg font-bold text-gray-800">确认下发</span>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20 flex-shrink-0">信件编号：</span>
            <span class="font-mono text-blue-600 font-medium">{{ selectedLetter?.['信件编号'] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20 flex-shrink-0">来信人：</span>
            <span>{{ form.name || '-' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500 w-20 flex-shrink-0">下发单位：</span>
            <span class="font-medium text-gray-800">{{ form.unit || '（未选择单位）' }}</span>
          </div>
          <div v-if="aiResult?.suggested_unit && form.unit === aiResult.suggested_unit" class="flex items-center gap-2">
            <span class="text-gray-500 w-20 flex-shrink-0"></span>
            <span class="text-xs text-purple-500"><i class="fas fa-robot mr-1"></i>AI建议单位</span>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button class="px-4 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200" @click="showDispatchModal = false">取消</button>
          <button class="px-4 py-1.5 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1" :disabled="submitting" @click="confirmDispatch">
            <i v-if="submitting" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-paper-plane"></i>
            确认下发
          </button>
        </div>
      </div>
    </div>

    <!-- Remark modal -->
    <div v-if="showRemarkModalWindow" class="wp-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" @click.self="showRemarkModalWindow = false">
      <div class="wp-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-[450px] mx-4">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-comment-alt text-blue-500"></i>
          <span class="text-lg font-bold text-gray-800">下发备注</span>
        </div>
        <textarea class="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none outline-none focus:border-blue-400" rows="4" v-model="form.notes"
          placeholder="请输入下发备注..."></textarea>
        <div class="flex gap-3 justify-end mt-4">
          <button class="px-4 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200" @click="showRemarkModalWindow = false">取消</button>
          <button class="px-4 py-1.5 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600" @click="showRemarkModalWindow = false">保存</button>
        </div>
      </div>
    </div>

    <!-- Auto dispatch progress modal -->
    <div v-if="autoDispatchingAll" class="wp-modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div class="wp-modal bg-white rounded-xl shadow-2xl p-6 w-full max-w-[480px] mx-4">
        <div class="flex items-center gap-2 mb-4">
          <i class="fas fa-robot text-purple-500 fa-spin"></i>
          <span class="text-lg font-bold text-gray-800">批量自动下发</span>
        </div>
        <div class="space-y-3">
          <div class="bg-purple-50 rounded-lg p-3">
            <div class="text-sm text-purple-700 mb-2">
              正在处理第 {{ autoDispatchProgress.current }} / {{ autoDispatchProgress.total }} 封信件...
            </div>
            <div class="w-full bg-purple-200 rounded-full h-2">
              <div class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                :style="{ width: (autoDispatchProgress.total > 0 ? (autoDispatchProgress.current / autoDispatchProgress.total * 100) : 0) + '%' }">
              </div>
            </div>
          </div>
          <div class="text-xs text-gray-500 max-h-24 overflow-y-auto space-y-1">
            <div v-for="(log, idx) in autoDispatchLogs" :key="idx"
              :class="log.success ? 'text-green-600' : 'text-red-500'">
              {{ log.letterNo }}: {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { getDispatchList, dispatch, markInvalid, getDetail, analyzeLetter, autoDispatch, handleBySelf as handleBySelfApi } from '@/api/letter'
import { getDispatchUnits, getSpecialFocusList } from '@/api/setting'
import StatusBadge from '@/components/StatusBadge.vue'

// State
const letters = ref({})
const selectedLetter = ref(null)
const loadingList = ref(false)
const submitting = ref(false)
const showDispatchModal = ref(false)
const showRemarkModalWindow = ref(false)
const autoDispatchEnabled = ref(false)
let pollTimer = null

// AI state
const aiAnalyzing = ref(false)
const aiResult = ref(null)
const autoDispatchingAll = ref(false)
const autoDispatchProgress = ref({ current: 0, total: 0 })
const autoDispatchLogs = ref([])

// AI Chat state
const aiChatMessages = ref([])
const aiChatInput = ref('')
const aiChatProcessing = ref(false)
const chatMessagesRef = ref(null)
let chatAbortController = null

// Dispatch prompt (loaded from old project)
const dispatchPrompt = ref('')

// Ref for scrollable detail content area
const detailScrollRef = ref(null)

// Scroll detail content to top on letter selection
const scrollDetailToTop = async () => {
  await nextTick()
  if (detailScrollRef.value) {
    detailScrollRef.value.scrollTop = 0
  }
}

// Category tree
const categoryTree = ref([])
const currentL2List = ref([])
const currentL3List = ref([])

// Dispatch units
const dispatchUnits = ref([])
const unitSearchKeyword = ref('')
const showUnitDropdown = ref(false)

// Category searchable dropdown (single,三级联动)
const selectedCategory = ref('')
const categoryDropdownOpen = ref(false)
const categorySearch = ref('')
const categories = ref([]) // 扁平分类列表 [{一级分类, 二级分类, 三级分类}]
const filteredCategories = computed(() => {
  if (!categorySearch.value) return categories.value
  const q = categorySearch.value.toLowerCase()
  return categories.value.filter(cat => {
    const path = `${cat['一级分类']} ${cat['二级分类']} ${cat['三级分类']}`.toLowerCase()
    return path.includes(q)
  })
})
const toggleCategoryDropdown = () => {
  categoryDropdownOpen.value = !categoryDropdownOpen.value
  if (categoryDropdownOpen.value) {
    categorySearch.value = ''
  }
}
const filterCategories = () => {
  // computed handles filtering
}
const selectCategory = (cat) => {
  selectedCategory.value = `${cat['一级分类']} / ${cat['二级分类']} / ${cat['三级分类']}`
  form.value.categoryL1 = cat['一级分类']
  form.value.categoryL2 = cat['二级分类'] || ''
  form.value.categoryL3 = cat['三级分类'] || ''
  categoryDropdownOpen.value = false
}

// 点击外部关闭分类下拉
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const container = document.getElementById('category-select-container')
    if (container && !container.contains(e.target)) {
      categoryDropdownOpen.value = false
    }
    const unitContainer = document.getElementById('unit-select-container')
    if (unitContainer && !unitContainer.contains(e.target)) {
      showUnitDropdown.value = false
    }
    const focusContainer = document.getElementById('focus-select-container')
    if (focusContainer && !focusContainer.contains(e.target)) {
      showFocusDropdown.value = false
    }
  })
}

// Focus list (专项关注)
const focusList = ref([])
const showFocusDropdown = ref(false)
const focusSearch = ref('')
const selectedFocus = ref('')

const filteredFocusList = computed(() => {
  if (!focusSearch.value) return focusList.value
  const q = focusSearch.value.toLowerCase()
  return focusList.value.filter(f => {
    const name = (f['专项关注标题'] || f.tag_name || f.title || '').toLowerCase()
    const desc = (f['专项关注描述'] || f.description || '').toLowerCase()
    return name.includes(q) || desc.includes(q)
  })
})

const toggleFocusDropdown = () => {
  showFocusDropdown.value = !showFocusDropdown.value
  if (showFocusDropdown.value) {
    focusSearch.value = ''
  }
}

const selectFocus = (item) => {
  selectedFocus.value = item['专项关注标题'] || item.tag_name || item.title || ''
  showFocusDropdown.value = false
}

// Form data
const filteredDispatchUnits = computed(() => {
  if (!unitSearchKeyword.value.trim()) {
    return dispatchUnits.value
  }
  const keyword = unitSearchKeyword.value.toLowerCase().trim()
  return dispatchUnits.value.filter(u => {
    const fullName = (u.fullName || '').toLowerCase()
    const level1 = (u.level1 || '').toLowerCase()
    const level2 = (u.level2 || '').toLowerCase()
    const level3 = (u.level3 || '').toLowerCase()
    return fullName.includes(keyword) || 
           level1.includes(keyword) || 
           level2.includes(keyword) || 
           level3.includes(keyword)
  })
})

// Form data
const form = ref({
  name: '', phone: '', idcard: '', time: '', content: '',
  categoryL1: '', categoryL2: '', categoryL3: '',
  unit: '', notes: '请接收单位认真处理用户诉求，及时回复。',
})

// Flow records
const normalizeFlowRecord = (rec) => {
  if (rec.action) {
    return {
      action: rec.action,
      operator: rec.operator || rec.operator_name || '',
      timestamp: rec.timestamp || rec.created_at || '',
      from_unit: rec.from_unit || rec.source_unit || '',
      to_unit: rec.to_unit || rec.target_unit || '',
      remark: typeof rec.remark === 'object' ? JSON.stringify(rec.remark) : (rec.remark || ''),
      operator_id: rec.operator_id || '',
      from_status: rec.from_status || '',
      to_status: rec.to_status || rec.status || '',
    }
  }
  const actionMap = {
    '生成': 'create',
    '自行处理': 'handle_by_self',
    '市局下发': 'dispatch',
    '办案单位反馈': 'feedback',
    '处理': 'process',
    '退回': 'return',
    '审核通过': 'audit_approve',
    '审核驳回': 'audit_reject',
    '标记无效': 'mark_invalid',
  }
  const remarkVal = rec['备注']
  return {
    action: actionMap[rec['操作类型']] || rec['操作类型'] || 'other',
    operator: rec['操作人姓名'] || '',
    timestamp: rec['操作时间'] || '',
    from_unit: rec['操作前单位'] || '',
    to_unit: rec['操作后单位'] || rec['目标单位'] || '',
    remark: typeof remarkVal === 'object' ? JSON.stringify(remarkVal) : (remarkVal || ''),
    operator_id: rec['操作人警号'] || '',
    from_status: rec['操作前状态'] || '',
    to_status: rec['操作后状态'] || '',
  }
}

const flowRecords = computed(() => {
  const raw = selectedLetter.value?.['流转记录'] || selectedLetter.value?._raw?.flow_records || []
  if (typeof raw === 'string') {
    try { return JSON.parse(raw).map(normalizeFlowRecord) } catch { return [] }
  }
  return Array.isArray(raw) ? raw.map(normalizeFlowRecord) : []
})

// Sorted letters (newest first)
const sortedLetters = computed(() => {
  return Object.values(letters.value).sort((a, b) => {
    return (b['来信时间'] || '').localeCompare(a['来信时间'] || '')
  })
})

// Helpers
const formatTime = (t) => {
  if (!t) return '-'
  return t.replace('T', ' ').substring(0, 16)
}

const getFlowActionLabel = (rec) => {
  const labels = {
    'create': '创建信件',
    'dispatch': '下发',
    'handle_by_self': '自行处理',
    'feedback': '办案单位反馈',
    'process': '处理',
    'return': '退回',
    'audit_approve': '审核通过',
    'audit_reject': '审核驳回',
    'mark_invalid': '标记无效',
  }
  return labels[rec.action] || rec.action || '操作'
}

const getFlowDotClass = (rec) => {
  const dotMap = {
    'create': 'bg-blue-500',
    'dispatch': 'bg-orange-500',
    'handle_by_self': 'bg-green-500',
    'feedback': 'bg-purple-500',
    'process': 'bg-teal-500',
    'return': 'bg-red-500',
    'audit_approve': 'bg-green-500',
    'audit_reject': 'bg-red-500',
    'mark_invalid': 'bg-gray-500',
  }
  return dotMap[rec.action] || 'bg-gray-400'
}

const sentimentBadge = (s) => {
  const map = {
    '积极': 'bg-green-100 text-green-700',
    '中性': 'bg-gray-100 text-gray-700',
    '消极': 'bg-yellow-100 text-yellow-700',
    '紧急': 'bg-red-100 text-red-700',
  }
  return map[s] || 'bg-gray-100 text-gray-700'
}

const urgencyBadgeClass = (u) => {
  const val = parseInt(u)
  if (isNaN(val)) return 'bg-gray-100 text-gray-500'
  if (val >= 4) return 'bg-red-100 text-red-600'
  if (val >= 3) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
}

// Category cascade
const onCategoryL1Change = () => {
  form.value.categoryL2 = ''
  form.value.categoryL3 = ''
  const l1 = categoryTree.value.find(c => c.name === form.value.categoryL1)
  currentL2List.value = l1?.children || []
  currentL3List.value = []
}

const onCategoryL2Change = () => {
  form.value.categoryL3 = ''
  const l2 = currentL2List.value.find(c => c.name === form.value.categoryL2)
  currentL3List.value = l2?.children || []
}

// Select letter
const selectLetter = async (letter) => {
  selectedLetter.value = letter
  aiResult.value = null
  // 清空AI聊天
  aiChatMessages.value = []
  if (chatAbortController) {
    chatAbortController.abort()
    chatAbortController = null
  }

  // Load full detail for flow records
  try {
    const res = await getDetail(letter['信件编号'])
    if (res.success && res.data) {
      const raw = res.data.letter || res.data
      const flow = res.data.flow?.flow_records || res.data.flow_records || []
      letter._raw = { ...(letter._raw || {}), ...raw, flow_records: flow }
    }
  } catch {}

  form.value = {
    name: letter['群众姓名'] || '',
    phone: letter['手机号'] || '',
    idcard: letter['身份证号'] || '',
    time: letter['来信时间'] || '',
    content: letter['诉求内容'] || '',
    categoryL1: letter['信件一级分类'] || '',
    categoryL2: letter['信件二级分类'] || '',
    categoryL3: letter['信件三级分类'] || '',
    unit: '',
    notes: '请接收单位认真处理用户诉求，及时回复。',
  }
  // 预填分类下拉显示
  selectedCategory.value = [letter['信件一级分类'], letter['信件二级分类'], letter['信件三级分类']].filter(Boolean).join(' / ')
  unitSearchKeyword.value = ''
  showUnitDropdown.value = false
  // 选中信件后滚动详情区到顶部
  scrollDetailToTop()

  // 自动加载提示词并触发AI分析
  loadDispatchPrompt()
  setTimeout(() => {
    sendAIChatMessage('请帮我分析一下这封信件，给出分类和下发单位建议。')
  }, 300)
}

// AI Analysis
const runAIAnalysis = async () => {
  if (!selectedLetter.value) return
  aiAnalyzing.value = true
  aiResult.value = null
  try {
    const res = await analyzeLetter(selectedLetter.value['信件编号'])
    if (res.success) {
      aiResult.value = res.data
      selectedLetter.value['_ai_analyzed'] = true
      applyAISuggestions()
    } else {
      aiResult.value = { _error: res.error || 'AI分析失败' }
    }
  } catch (e) {
    aiResult.value = { _error: 'AI分析请求失败: ' + (e.message || '未知错误') }
  }
  aiAnalyzing.value = false
}

// Match unit by name
const matchUnitByName = (shortName) => {
  if (!shortName) return ''
  const exact = dispatchUnits.value.find(u => u.fullName === shortName)
  if (exact) return exact.fullName
  const suffix = dispatchUnits.value.find(u => u.fullName.endsWith(' / ' + shortName))
  if (suffix) return suffix.fullName
  const contain = dispatchUnits.value.find(u => u.fullName.includes(shortName))
  if (contain) return contain.fullName
  const last = dispatchUnits.value.find(u => {
    const lastPart = u.fullName.split(' / ').pop()
    return lastPart === shortName
  })
  if (last) return last.fullName
  return shortName
}

// Select dispatch unit
const selectDispatchUnit = (unit) => {
  form.value.unit = unit.fullName
  showUnitDropdown.value = false
  unitSearchKeyword.value = ''
}

// Apply AI suggestions to form
const applyAISuggestions = () => {
  if (!aiResult.value || aiResult.value._error) return
  const r = aiResult.value
  if (r.suggested_category_l1) {
    form.value.categoryL1 = r.suggested_category_l1
    selectedCategory.value = [r.suggested_category_l1, r.suggested_category_l2 || '', r.suggested_category_l3 || ''].filter(Boolean).join(' / ')
    onCategoryL1Change()
    if (r.suggested_category_l2) {
      form.value.categoryL2 = r.suggested_category_l2
      onCategoryL2Change()
      if (r.suggested_category_l3) {
        form.value.categoryL3 = r.suggested_category_l3
      }
    }
  }
  if (r.suggested_unit) {
    form.value.unit = matchUnitByName(r.suggested_unit)
  }
}

// Auto dispatch single letter
const autoDispatchSingle = async (letter) => {
  if (!letter) return
  try {
    await selectLetter(letter)
    const res = await autoDispatch({ letter_no: letter['信件编号'] })
    if (res.success) {
      aiResult.value = res.data
      await loadData()
      selectedLetter.value = null
    } else {
      aiResult.value = { _error: res.error || '自动下发失败' }
    }
  } catch (e) {
    aiResult.value = { _error: '自动下发请求失败: ' + (e.message || '未知错误') }
  }
}

// Auto dispatch all letters
const autoDispatchAll = async () => {
  const list = Object.values(letters.value)
  if (list.length === 0) return

  autoDispatchingAll.value = true
  autoDispatchProgress.value = { current: 0, total: list.length }
  autoDispatchLogs.value = []

  for (const letter of list) {
    try {
      const res = await autoDispatch({ letter_no: letter['信件编号'] })
      autoDispatchLogs.value.push({
        letterNo: letter['信件编号'],
        message: res.success ? `已下发至 ${res.data?.dispatched_to || '目标单位'}` : (res.error || '失败'),
        success: res.success,
      })
    } catch (e) {
      autoDispatchLogs.value.push({
        letterNo: letter['信件编号'],
        message: '请求失败: ' + (e.message || '未知错误'),
        success: false,
      })
    }
    autoDispatchProgress.value.current++
  }

  await loadData()
  selectedLetter.value = null
  autoDispatchingAll.value = false
}

// Handle by self
const handleBySelf = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认由您处理此信件？')) return
  try {
    await handleBySelfApi({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

// Mark invalid
const handleInvalid = async () => {
  if (!selectedLetter.value) return
  if (!confirm('确认标记此信件为无效？')) return
  try {
    await markInvalid({ letter_no: selectedLetter.value['信件编号'] })
    await loadData()
    selectedLetter.value = null
  } catch {}
}

// Show remark modal
const showRemarkModal = () => {
  showRemarkModalWindow.value = true
}

// Show dispatch modal
const handleDispatch = () => {
  if (!form.value.unit) {
    alert('请先选择下发单位')
    return
  }
  showDispatchModal.value = true
}

// Confirm dispatch
const confirmDispatch = async () => {
  submitting.value = true
  try {
    const shortUnit = form.value.unit.split(' / ').pop()
    await dispatch({
      letter_no: selectedLetter.value['信件编号'],
      target_unit: shortUnit,
      remark: form.value.notes,
      citizen_name: form.value.name,
      phone: form.value.phone,
      id_card: form.value.idcard,
      received_at: form.value.time,
      content: form.value.content,
      category_l1: form.value.categoryL1,
      category_l2: form.value.categoryL2,
      category_l3: form.value.categoryL3,
    })
    showDispatchModal.value = false
    await loadData()
    selectedLetter.value = null
  } catch {}
  submitting.value = false
}

// ===== AI Chat功能 =====

// 发送AI聊天消息（SSE流式）
const sendAIChatMessage = async (manualMessage = null) => {
  const message = manualMessage || aiChatInput.value.trim()
  if (!message || aiChatProcessing.value) return

  // 添加到消息列表
  aiChatMessages.value.push({ role: 'user', content: message })
  if (!manualMessage) aiChatInput.value = ''
  aiChatProcessing.value = true

  // 创建AI消息占位
  const aiMsgIndex = aiChatMessages.value.length
  aiChatMessages.value.push({ role: 'assistant', content: '' })

  // 滚动到底部
  await nextTick()
  scrollChatToBottom()

  try {
    // 构建消息列表
    const messages = buildChatMessages(message)

    // 创建AbortController
    chatAbortController = new AbortController()

    // 使用 SSE fetch 流式请求
    const response = await fetch('/api/llm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: chatAbortController.signal,
      body: JSON.stringify({
        order: 'chat_stream',
        args: {
          messages: messages,
          temperature: 0.7,
          max_tokens: 2000,
        }
      }),
    })

    if (!response.ok) {
      throw new Error('AI调用失败: ' + response.status)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          // SSE 错误回显
          if (data.startsWith('[ERROR]')) {
            aiChatMessages.value[aiMsgIndex].content = 'AI回复失败: ' + data.slice(7).trim()
            aiChatProcessing.value = false
            break
          }

          try {
            const parsed = JSON.parse(data)
            let content = ''
            if (parsed.chunk) {
              content = parsed.chunk
            } else if (parsed.choices?.[0]?.delta?.content) {
              content = parsed.choices[0].delta.content
            }

            if (content) {
              fullContent += content
              // 更新AI消息内容（过滤掉json命令区域）
              const displayContent = fullContent.replace(/\^json:.*?\^/g, '')
              aiChatMessages.value[aiMsgIndex].content = displayContent
              await nextTick()
              scrollChatToBottom()
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      // 中断不显示错误
    } else {
      aiChatMessages.value[aiMsgIndex].content = '抱歉，AI回复失败: ' + (e.message || '未知错误')
    }
  } finally {
    aiChatProcessing.value = false
    chatAbortController = null
  }
}

// 构建AI聊天消息列表
const buildChatMessages = (userMessage) => {
  const messages = []

  // 使用老项目的下发提示词（如未加载则用备用提示词）
  if (dispatchPrompt.value) {
    messages.push({ role: 'system', content: dispatchPrompt.value })
  } else {
    messages.push({
      role: 'system',
      content: '你是一个专业的信访信件处理助手。请基于信件信息，帮助用户分析信件内容、提供处理建议、解答相关问题。回答应当简洁专业。'
    })
  }

  // 添加当前时间
  messages.push({
    role: 'system',
    content: `当前时间：${new Date().toLocaleString()}`
  })

  // 添加当前信件信息作为上下文
  if (selectedLetter.value) {
    let letterPrompt = `当前信件详细信息:\n`
    letterPrompt += `- 信件编号: ${selectedLetter.value['信件编号'] || '-'}\n`
    letterPrompt += `- 群众姓名: ${selectedLetter.value['群众姓名'] || '-'}\n`
    letterPrompt += `- 身份证号: ${selectedLetter.value['身份证号'] || '-'}\n`
    letterPrompt += `- 手机号: ${selectedLetter.value['手机号'] || '-'}\n`
    letterPrompt += `- 来信时间: ${selectedLetter.value['来信时间'] || '-'}\n`
    letterPrompt += `- 诉求内容: ${selectedLetter.value['诉求内容'] || '-'}\n`
    letterPrompt += `- 当前分类: ${selectedLetter.value['信件一级分类'] || ''} / ${selectedLetter.value['信件二级分类'] || ''} / ${selectedLetter.value['信件三级分类'] || ''}\n`

    const flow = selectedLetter.value._raw?.flow_records || []
    if (flow.length > 0) {
      letterPrompt += `\n流转记录:\n`
      flow.forEach((r, i) => {
        letterPrompt += `[${i+1}] ${r['操作时间'] || ''} ${r['操作类型'] || ''} (${r['操作人姓名'] || r['操作人警号'] || ''}): ${typeof r['备注'] === 'object' ? JSON.stringify(r['备注']) : (r['备注'] || '')}\n`
      })
    }
    messages.push({ role: 'system', content: letterPrompt })
  }

  // 添加聊天历史（最后5轮）
  const historyMessages = aiChatMessages.value.slice(-10, -1)
  for (const msg of historyMessages) {
    messages.push({ role: msg.role, content: msg.content })
  }

  // 添加当前用户消息
  messages.push({ role: 'user', content: userMessage })

  return messages
}

// 滚动聊天到底部
const scrollChatToBottom = () => {
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  }
}

// 加载老项目的下发提示词
const loadDispatchPrompt = async () => {
  if (dispatchPrompt.value) return // 已加载
  try {
    const { getPrompt } = await import('@/api/llm')
    const res = await getPrompt('下发工作提示词')
    if (res.success && res.data?.content) {
      dispatchPrompt.value = res.data.content
    }
  } catch {}
}

// Load data
const loadData = async () => {
  loadingList.value = true
  try {
    const res = await getDispatchList({})
    if (res.success) {
      const dict = {}
      const list = res.data?.list || res.data || []
      list.forEach(letter => {
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
          '紧急程度': letter.urgency || '',
          _raw: letter,
        }
        dict[mapped['信件编号']] = mapped
      })
      letters.value = dict
    }
  } catch {}
  loadingList.value = false
}

// Load categories
const loadCategories = async () => {
  try {
    const { getCategories } = await import('@/api/letter')
    const res = await getCategories()
    if (res.success) {
      categoryTree.value = res.data || []
      // 扁平化分类树，用于搜索下拉框
      const flat = []
      const flatten = (nodes, level1 = '', level2 = '') => {
        for (const n of nodes) {
          if (n.children && n.children.length > 0) {
            if (!level1) {
              flatten(n.children, n.name, '')
            } else if (!level2) {
              flatten(n.children, level1, n.name)
            }
          } else {
            flat.push({ '一级分类': level1, '二级分类': level2, '三级分类': n.name })
          }
        }
      }
      flatten(res.data || [])
      categories.value = flat
    }
  } catch {}
}

// Load dispatch units
const loadUnits = async () => {
  try {
    const res = await getDispatchUnits()
    if (res.success) {
      const list = res.data || []
      const seen = new Set()
      dispatchUnits.value = []
      list.forEach(u => {
        const parts = [u.level1, u.level2, u.level3].filter(Boolean)
        const fullName = parts.join(' / ')
        if (!seen.has(fullName)) {
          seen.add(fullName)
          dispatchUnits.value.push({ ...u, fullName })
        }
      })
    }
  } catch {}
}

// Load focus list
const loadFocusList = async () => {
  try {
    const res = await getSpecialFocusList()
    if (res.success) {
      focusList.value = res.data || []
    }
  } catch {}
}

onMounted(async () => {
  await Promise.all([loadData(), loadCategories(), loadUnits(), loadFocusList()])
  if (sortedLetters.value.length > 0) {
    selectLetter(sortedLetters.value[0])
  }
  pollTimer = setInterval(loadData, 10000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (chatAbortController) {
    chatAbortController.abort()
    chatAbortController = null
  }
})
</script>

<style scoped>
/* AI聊天消息样式 */
.ai-message {
  display: flex;
  width: 100%;
}
.ai-message-user {
  justify-content: flex-end;
}
.ai-message-ai {
  justify-content: flex-start;
}

/* 打字指示器动画 */
.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #9ca3af;
  border-radius: 50%;
  animation: typing-bounce 1.4s ease-in-out infinite;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* detail-top 区域 */
.detail-top {
  min-height: 140px;
  max-height: 200px;
}
.detail-info {
  overflow-y: auto;
}
.detail-content textarea {
  min-height: 70px;
}

/* AI聊天区域 */
.detail-middle {
  min-height: 120px;
}
.ai-chat-messages {
  scrollbar-width: thin;
}

/* controls-row */
.controls-row .wp-select {
  padding: 4px 6px;
  font-size: 12px;
}
</style>
