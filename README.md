# 民意智感中心 - 前端 (Vue3)

## 项目概述

本项目是原 Django 项目的 Vue3 重构版前端，像素级还原原始 UI。

- 框架: Vue 3 + Composition API
- 构建工具: Vite 5
- CSS: Tailwind CSS v3
- 路由: Vue Router 4 (Hash 模式)
- HTTP: Axios (withCredentials: true)
- 图表: ECharts
- 后端 API: http://localhost:8080

---

## 目录结构

```
letter-manage-web/
├── src/
│   ├── api/                   # API 封装层
│   │   ├── http.js            # Axios 实例（自动处理 401 跳转）
│   │   ├── auth.js            # 认证接口
│   │   ├── letter.js          # 信件接口
│   │   ├── config.js          # 配置接口
│   │   ├── setting.js         # 设置接口
│   │   └── llm.js             # AI 接口
│   ├── router/index.js        # 路由配置（含鉴权守卫）
│   ├── views/                 # 页面组件
│   │   ├── LoginView.vue      # 登录页
│   │   ├── WorkplaceLayout.vue # 工作台布局
│   │   ├── HomeView.vue       # 首页
│   │   ├── LettersView.vue    # 所有信件
│   │   ├── DispatchView.vue   # 下发工作台
│   │   ├── ProcessingView.vue # 处理工作台
│   │   ├── AuditView.vue      # 核查工作台
│   │   ├── StatisticsView.vue # 统计工作台
│   │   ├── UsersView.vue      # 用户管理
│   │   ├── OrganizationView.vue # 组织管理
│   │   ├── SpecialFocusView.vue # 专项关注
│   │   ├── CategoryView.vue   # 分类管理
│   │   └── SettingsView.vue   # 系统设置
│   ├── components/            # 公共组件
│   │   ├── StatusBadge.vue    # 状态标签
│   │   ├── LetterDetailModal.vue # 信件详情弹窗
│   │   ├── InfoRow.vue        # 信息行
│   │   └── OrgTreeNode.vue    # 组织树节点
│   ├── App.vue
│   ├── main.js
│   └── style.css              # 全局样式（含 Tailwind）
├── public/
│   └── css/lib/               # FontAwesome 静态资源
│       ├── fontawesome.min.css
│       └── webfonts/
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## 快速开始

### 1. 环境要求

- Node.js 18+
- npm 9+
- 后端服务已启动（http://localhost:8080）

### 2. 安装依赖

```bash
cd /Users/liheng/work/letter-manage-web
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器访问 http://localhost:5173

### 4. 生产构建

```bash
npm run build
# 产物在 dist/ 目录
```

### 5. 预览生产包

```bash
npm run preview
```

---

## 路由列表

| 路径 | 页面 | 权限 |
|------|------|------|
| /#/login | 登录页 | 无需登录 |
| /#/home | 首页 | 全部 |
| /#/letters | 所有信件 | 全部 |
| /#/dispatch | 下发工作台 | CITY, DISTRICT |
| /#/processing | 处理工作台 | 全部 |
| /#/audit | 核查工作台 | CITY, DISTRICT |
| /#/statistics | 统计工作台 | 全部 |
| /#/users | 用户管理 | CITY, DISTRICT |
| /#/organization | 组织管理 | CITY |
| /#/special-focus | 专项关注 | CITY |
| /#/category | 分类管理 | CITY |
| /#/settings | 系统设置 | 全部 |

---

## 注意事项

1. 所有 API 请求自动携带 Cookie（`withCredentials: true`）
2. 遇到 401 响应自动跳转登录页
3. 菜单从后端 `/api/config/` 动态加载（权限过滤）
4. 文件上传使用 `multipart/form-data`（通话录音等）
5. LLM 流式响应使用 Server-Sent Events（SSE）

---

## 本地域名配置（多平台 Cookie 隔离）

当管理端和市民端同时运行时，请使用本地域名访问以避免 cookie 冲突。

### 访问方式

配置 hosts 后，通过以下地址访问：

| 平台 | 前端地址 | 后端 API 代理 |
|------|---------|--------------|
| 管理端（admin） | http://admin.letter.local:5173 | → localhost:8080 |
| 市民端（citizen） | http://citizen.letter.local:5174 | → localhost:8081 |

> 详细步骤请参见 `letter-manage-backend` 项目的 README 中「本地域名配置」章节。
