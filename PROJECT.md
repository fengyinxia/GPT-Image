# 幻梦 — 项目完整技术文档

> 版本 0.2.0 | 最后更新 2026-04-27

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [系统架构](#3-系统架构)
4. [目录结构](#4-目录结构)
5. [数据模型](#5-数据模型)
6. [状态管理](#6-状态管理)
7. [核心数据流](#7-核心数据流)
8. [API 设计](#8-api-设计)
9. [组件详解](#9-组件详解)
10. [工具库详解](#10-工具库详解)
11. [样式与主题](#11-样式与主题)
12. [开发环境搭建](#12-开发环境搭建)
13. [构建与部署](#13-构建与部署)
14. [PWA 配置](#14-pwa-配置)
15. [后端详解](#15-后端详解)
16. [安全设计](#16-安全设计)
17. [常见问题排查](#17-常见问题排查)
18. [速查索引](#18-速查索引)

---

## 1. 项目概述

**幻梦** 是一个基于 OpenAI 兼容图片 API 的 AI 生图/改图 Web 应用。

### 核心功能

| 功能 | 说明 |
|------|------|
| 文生图 | 输入提示词，调用 `gpt-image-2` 模型生成图片 |
| 图片编辑 | 上传最多 16 张参考图，配合提示词进行图片编辑 |
| 历史记录 | 所有任务持久化到 IndexedDB，支持搜索和筛选 |
| 任务操作 | 复用配置 / 编辑输出 / 删除任务 |
| 数据导出导入 | ZIP 格式完整导出/导入所有任务和图片 |
| 图片查看器 | 全屏 Lightbox，支持缩放(1x-10x)、拖拽、触控 |
| 右键菜单 | 任意图片右键复制/下载 |
| PWA | 可安装为桌面应用，Service Worker 离线缓存 |
| 深色模式 | 跟随系统 `prefers-color-scheme` |
| 响应式 | 桌面/移动端自适应布局 |

### 安全隔离

- 前端**不持有** API Key 和上游地址
- 所有 `/v1/*` 请求经 Python 后端代理转发
- 后端强制注入 `Authorization` 头，强制锁定 `model = gpt-image-2`

---

## 2. 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^19.1.0 | UI 框架 |
| TypeScript | ^5.8.3 | 类型系统 |
| Vite | ^6.3.2 | 构建工具 / 开发服务器 |
| Tailwind CSS | ^3.4.17 | 原子化 CSS |
| Zustand | ^5.0.5 | 状态管理 |
| fflate | ^0.8.2 | ZIP 压缩/解压 |
| PostCSS + Autoprefixer | ^8.5.3 / ^10.4.21 | CSS 后处理 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Python | 3.12+ | 运行环境 |
| FastAPI | 0.115.6 | HTTP 框架 |
| HTTPX | 0.28.1 | 异步 HTTP 客户端 |
| Uvicorn | 0.34.0 | ASGI 服务器 |
| python-multipart | 0.0.20 | multipart/form-data 解析 |

### 部署

| 技术 | 用途 |
|------|------|
| Docker Compose | 服务编排 |
| Nginx (Alpine) | 反向代理 + 静态文件服务 |
| Node 20 Alpine | 前端构建阶段 |
| Python 3.12 Slim | 后端运行时 |

---

## 3. 系统架构

### 请求链路

```
浏览器 (React SPA)
  │
  │  POST /v1/images/generations   (application/json)
  │  POST /v1/images/edits         (multipart/form-data)
  │
  ▼
┌──────────────────────────────────────────────┐
│  开发模式: Vite Dev Server (localhost:5173)    │
│  生产模式: Nginx (port 3399)                  │
│                                              │
│  /v1/* → proxy_pass → backend:8000/v1/*      │
│  其他   → SPA fallback → /index.html          │
└──────────────────────────────────────────────┘
  │
  ▼
┌──────────────────────────────────────────────┐
│  FastAPI Backend (port 8000)                  │
│                                              │
│  1. 读取 config.local.json / 环境变量          │
│  2. 注入 Authorization: Bearer <api_key>       │
│  3. 强制设置 model = "gpt-image-2"             │
│  4. 转发到上游                                 │
└──────────────────────────────────────────────┘
  │
  ▼
OpenAI 兼容上游 API
```

### Docker Compose 拓扑

```
┌──────────┐    depends_on    ┌─────────┐
│ frontend  │────────────────▶│ backend  │
│ Nginx:80  │                 │ :8000   │
│ Port:3399 │                 └─────────┘
└──────────┘
     │
     │ proxy_pass /v1/* → backend:8000
     │
```

### 前端组件树

```
<App>
├── Header                    — 顶部导航栏 + 设置入口
├── SearchBar                 — 搜索框 + 状态筛选下拉
│   └── Select                — (复用组件)
├── TaskGrid                  — 任务卡片网格
│   └── TaskCard[]            — 单个任务卡片
├── InputBar                  — 底部输入栏 (固定定位)
│   ├── 图片缩略图队列 (最多 16 张)
│   ├── 提示词 textarea
│   ├── 参数面板 (比例/质量/格式/基准/审核/数量)
│   └── SizePickerModal       — 比例选择弹出层
├── DetailModal               — 任务详情弹窗
├── Lightbox                  — 全屏图片查看器
├── SettingsModal             — 设置面板
├── ConfirmDialog             — 确认对话框
├── Toast                     — 消息提示
└── ImageContextMenu          — 右键菜单
```

---

## 4. 目录结构

```
gpt_image_playground/
├── index.html                        # SPA 入口 HTML
├── package.json                      # 前端依赖 & 脚本
├── package-lock.json
├── vite.config.ts                    # Vite 配置 (proxy/base/define)
├── tsconfig.json                     # TypeScript 配置
├── tailwind.config.js                # Tailwind 配置
├── postcss.config.js                 # PostCSS 配置
├── docker-compose.yml                # Docker Compose 编排
├── .gitignore
├── .dockerignore
├── LICENSE                           # MIT
├── README.md                         # 用户向快速入门
├── PROJECT.md                        # 本文件：完整技术文档
│
├── public/
│   ├── manifest.webmanifest          # PWA 清单
│   ├── pwa-icon.svg                  # PWA 图标
│   └── sw.js                         # Service Worker
│
├── deploy/
│   ├── Dockerfile                    # 前端镜像 (Node 构建 → Nginx)
│   ├── Dockerfile.backend            # 后端镜像 (Python)
│   └── nginx.conf                    # Nginx 配置
│
├── src/
│   ├── main.tsx                      # React 入口 + SW 注册
│   ├── App.tsx                       # 根组件 + 布局
│   ├── index.css                     # 全局样式 + 动画 + 字体
│   ├── types.ts                      # 所有 TS 类型定义
│   ├── store.ts                      # Zustand Store + 全部 action
│   ├── vite-env.d.ts                 # Vite 类型声明
│   │
│   ├── lib/
│   │   ├── api.ts                    # API 调用 (generations/edits)
│   │   ├── db.ts                     # IndexedDB 封装
│   │   └── size.ts                   # 尺寸/比例计算
│   │
│   ├── hooks/
│   │   └── useCloseOnEscape.ts       # ESC 键栈管理
│   │
│   └── components/
│       ├── Header.tsx                # 顶部导航
│       ├── SearchBar.tsx             # 搜索 + 筛选
│       ├── Select.tsx                # 自定义下拉组件
│       ├── InputBar.tsx              # 底部输入栏
│       ├── SizePickerModal.tsx       # 比例选择
│       ├── TaskGrid.tsx              # 任务网格
│       ├── TaskCard.tsx              # 任务卡片
│       ├── DetailModal.tsx           # 任务详情
│       ├── Lightbox.tsx              # 图片查看器
│       ├── ConfirmDialog.tsx         # 确认对话框
│       ├── SettingsModal.tsx         # 设置面板
│       ├── Toast.tsx                 # 消息提示
│       └── ImageContextMenu.tsx      # 右键菜单
│
└── backend/
    ├── main.py                       # FastAPI 后端程序
    ├── requirements.txt              # Python 依赖
    ├── config.local.json.example     # 配置模板
    ├── config.local.json             # 实际配置 (gitignore)
    └── test_image_edits.py           # API 诊断脚本
```

---

## 5. 数据模型

所有类型定义在 `src/types.ts`。

### AppSettings — 应用设置

```typescript
interface AppSettings {
  timeout: number  // 请求超时(秒)，默认 300
}
```

### TaskParams — 生成参数

```typescript
interface TaskParams {
  base_resolution: 'auto' | '1K' | '2K' | '4K'  // 基准分辨率
  size: string                                    // 比例，如 "16:9"
  quality: 'auto' | 'low' | 'medium' | 'high'     // 质量
  output_format: 'png' | 'jpeg' | 'webp'           // 输出格式
  moderation: 'auto' | 'low'                       // 审核级别
  n: number                                        // 图片数量 1-4
}
```

### TaskRecord — 任务记录

```typescript
interface TaskRecord {
  id: string                    // 唯一 ID (base36 生成)
  prompt: string                // 提示词
  params: TaskParams            // 生成参数
  inputImageIds: string[]       // 输入图片的 IndexedDB id
  outputImages: string[]        // 输出图片的 IndexedDB id
  status: 'running' | 'done' | 'error'
  error: string | null          // 错误信息
  createdAt: number             // 创建时间戳 (ms)
  finishedAt: number | null     // 完成时间戳 (ms)
  elapsed: number | null        // 总耗时 (ms)
}
```

### InputImage — 输入图片 (UI 层)

```typescript
interface InputImage {
  id: string      // SHA-256 hash，去重用
  dataUrl: string // data: URL，用于预览
}
```

### StoredImage — IndexedDB 存储的图片

```typescript
interface StoredImage {
  id: string                    // SHA-256 hash
  dataUrl: string               // 完整的 data: URL
  createdAt?: number            // 首次存储时间 (ms)
  source?: 'upload' | 'generated'  // 来源
}
```

### ExportData — 导出格式

```typescript
interface ExportData {
  version: number               // 当前为 2
  exportedAt: string            // ISO 时间字符串
  settings: AppSettings
  tasks: TaskRecord[]
  imageFiles: Record<string, {
    path: string                // ZIP 内图片路径，如 "images/xxx.png"
    createdAt?: number
    source?: 'upload' | 'generated'
  }>
}
```

---

## 6. 状态管理

使用 **Zustand** + `persist` 中间件，全部状态在 `src/store.ts` 中定义。

### 持久化策略

| 数据 | 存储位置 | 说明 |
|------|---------|------|
| `settings` | localStorage | Zustand persist |
| `params` | localStorage | Zustand persist |
| `tasks` | IndexedDB | 全部通过 `db.ts` 操作 |
| `images` | IndexedDB | SHA-256 hash 去重 |
| `prompt` | 内存 | 不持久化 |
| `inputImages` | 内存 | 不持久化，但可通过 IndexedDB imageCache 恢复 |
| UI 状态 | 内存 | 弹窗、搜索、筛选等 |
| `imageCache` | 内存 Map | id → dataUrl，减少 IndexedDB 读取 |

### 关键 Action

| Action | 文件位置 | 说明 |
|--------|---------|------|
| `initStore()` | store.ts:207 | 启动时从 IndexedDB 加载所有任务和图片，清理孤立图片 |
| `submitTask()` | store.ts:230 | 创建任务记录 → 异步调用 API → 存储结果 |
| `reuseConfig(task)` | store.ts:338 | 将任务配置复制回输入栏 |
| `editOutputs(task)` | store.ts:359 | 将任务输出图加入输入栏作为参考图 |
| `removeTask(task)` | store.ts:376 | 删除任务及孤立图片 |
| `clearAllData()` | store.ts:410 | 清空 IndexedDB + 重置设置 |
| `exportData()` | store.ts:444 | 导出为 ZIP 文件 |
| `importData(file)` | store.ts:502 | 从 ZIP 恢复数据 |
| `addImageFromFile(file)` | store.ts:546 | 文件上传添加参考图 |

### localStorage 版本兼容

`legacyBaseResolution()` (store.ts:199) 处理旧版本中的 `model` 字段（`gpt-image-2-4k` / `gpt-image-2-2k`），迁移为新版 `base_resolution` 字段。

---

## 7. 核心数据流

### 提交任务流程

```
1. 用户点击"生成"或 Ctrl+Enter
2. submitTask() 被调用
   ├── 校验：至少需要 prompt 或 inputImages 之一
   ├── 持久化 inputImages 到 IndexedDB (storeImage)
   ├── 规范化 params.size (normalizeImageSize)
   ├── 创建 TaskRecord { id, status: 'running', ... }
   ├── 写入 IndexedDB (putTask)
   └── 异步调用 executeTask(taskId)

3. executeTask(taskId) 异步执行
   ├── 从 imageCache/IndexedDB 获取输入图片 dataUrl
   ├── 调用 callImageApi()
   │   ├── 根据是否有输入图片，选择 generations 或 edits 端点
   │   ├── 构造请求体 (JSON 或 FormData)
   │   ├── fetch → Vite/Nginx proxy → Python 后端 → 上游 API
   │   └── 返回 base64 dataUrl 列表
   ├── 将输出图片存储到 IndexedDB (storeImage, source='generated')
   ├── 更新 TaskRecord { status: 'done', outputImages, elapsed }
   └── 释放输入图片的内存缓存

4. 错误处理
   └── 更新 TaskRecord { status: 'error', error: message }
```

### 初始化流程 (应用启动)

```
App mount → useEffect → initStore()
  1. getAllTasks() 从 IndexedDB 加载所有任务
  2. 收集所有被任务引用的图片 id
  3. getAllImages() 获取所有已存储图片
  4. 对于被引用的图片 → 加载到 imageCache(Map)
  5. 对于孤立图片 → deleteImage() 清理
  6. setTasks(tasks) 渲染网格
```

### 图片去重机制

```
addImageFromFile(file)
  → FileReader.readAsDataURL(file) → dataUrl
  → hashDataUrl(dataUrl) → SHA-256 hash
  → 写入 imageCache (id → dataUrl)
  → addInputImage({ id, dataUrl })
  → (不写 IndexedDB，提交任务时才持久化)

storeImage(dataUrl, source)
  → hashDataUrl(dataUrl) → id
  → getImage(id) 检查是否已存在
  → 如不存在 → putImage({ id, dataUrl, createdAt, source })
  → 返回 id
```

---

## 8. API 设计

### 前端 API 层 (`src/lib/api.ts`)

#### callImageApi(options) → { images: string[] }

**参数：**
```typescript
interface CallApiOptions {
  settings: AppSettings       // 超时配置
  prompt: string              // 提示词
  params: TaskParams          // 生成参数
  inputImageDataUrls: string[] // 输入图片 dataUrl 列表
}
```

**路由选择：**
- `inputImageDataUrls.length > 0` → `POST /v1/images/edits` (multipart/form-data)
- `inputImageDataUrls.length === 0` → `POST /v1/images/generations` (application/json)

**尺寸解析逻辑 (`resolveRequestSize`)：**
- `base_resolution === 'auto'` → `"auto"` (不限制尺寸)
- `size` 是比例 (如 `"16:9"`) → 基于基准分辨率计算像素尺寸
- `size` 是像素 (如 `"1920x1080"`) → 规范化到 16 的倍数

**超时处理：**
- 使用 `AbortController` + `setTimeout`，超时秒数来自 `settings.timeout`

**错误处理：**
- 尝试从响应 JSON 中提取 `.error.message` 或 `.message`
- 回退到 `HTTP {status}` 或响应纯文本

### 后端代理 (`backend/main.py`)

| 属性 | 值 |
|------|-----|
| 框架 | FastAPI |
| 监听路径 | `POST /v1/{path}` |
| 允许路径 | `images/generations`, `images/edits` |
| 其他路径 | 返回 404 |

**请求处理流程：**
1. 验证 `path` 是否在白名单 `PROXY_PATHS` 中
2. 加载配置 (带 lru_cache)
3. 解析请求体：
   - `application/json` → 强制设置 `model = "gpt-image-2"`
   - `multipart/form-data` → 原样转发 (model 由前端 formData 指定)
4. 构造上游请求头：注入 `Authorization: Bearer <api_key>`，添加 `Cache-Control: no-store`
5. 通过 httpx.AsyncClient POST 到 `{base_url}/v1/{path}`
6. 返回响应：仅透传 `cache-control` 和 `content-type` 头

**错误码：**
| HTTP 状态 | 含义 |
|-----------|------|
| 400 | 请求格式错误 |
| 500 | 后端未配置 API Key |
| 502 | 上游协议异常 / 请求失败 |
| 504 | 上游超时 |

---

## 9. 组件详解

### App.tsx
根组件。挂载后调用 `initStore()` 初始化。包含背景装饰层（渐变+网格+遮罩），布局结构为 Header + SearchBar + TaskGrid + InputBar + 各类弹窗。

### Header.tsx
吸顶导航栏。左侧：设置按钮（圆角方形图标）+ "幻梦" 标题 + "所想即所得" 标签。双层背景（径向渐变 + 网格纹理）+ 毛玻璃效果。

### SearchBar.tsx
搜索 + 筛选栏。左侧：Select 下拉（全部/已完成/生成中/失败）+ z-index 20 以确保在搜索结果中置于顶层。右侧：搜索输入框。支持按提示词内容和参数 JSON 字符串搜索。

### InputBar.tsx
页面底部固定输入区，最复杂的组件：

- **图片队列**：网格展示参考图缩略图 (52×52)，悬停显示删除按钮，点击打开 Lightbox
- **清空按钮**：虚线边框，确认后清除所有参考图
- **textarea**：自动调整高度（动画过渡），最大高度 = 视口 40% - 固定开销
- **参数面板**：
  - 桌面端：6 列网格，靠右对齐按钮
  - 移动端：2 列网格 + 可折叠
- **文件上传**：
  - 支持文件选择器 / 粘贴 (Ctrl+V) / 全局拖拽
  - 拖拽时全屏遮罩 + 图标提示
  - 超过上限提示
- **移动端特有**：
  - 拖拽手柄（上下滑动展开/折叠）
  - 自动检测宽度 < 640px
  - 初始折叠状态

**关键常量：**
- `API_MAX_IMAGES = 16` — 参考图数量上限

### TaskGrid.tsx
任务卡片网格。响应式列数：1 → 2 → 3 列。按 `createdAt` 降序排列。支持 `searchQuery` (匹配 prompt + 序列化 params) 和 `filterStatus` 双重筛选。空状态显示引导提示。

### TaskCard.tsx
单个任务卡片。水平布局：左侧 160px 图片区 + 右侧信息区。

- **running**：旋转加载动画 + "生成中..."
- **error**：错误图标 + "失败"
- **done**：输出缩略图 + 比例标签 + 分辨率标签

右侧：状态 Badge (Done/Running/Failed) + 3 行 clamp 的提示词 + 参数徽章（可水平滚动）+ 3 个操作按钮（复用/编辑/删除）。

计时器：running 状态每秒更新显示，done/error 显示 `elapsed`。

### DetailModal.tsx
任务详情弹窗。左右分栏布局（移动端上下分栏）。

**左侧图片区：**
- 显示当前输出图，点击打开 Lightbox
- 多张输出图时显示左右导航箭头 + 页码指示器
- 左上角：比例 + 分辨率标签（跟随图片实际渲染位置）
- running 状态：旋转加载
- error 状态：错误文本 (4 行 clamp) + 复制报错按钮

**右侧信息区：**
- 输入内容（提示词）
- 参考图缩略图（16×16，可点击）
- 参数网格（模型/基准/比例/质量/格式/审核/数量）
- 创建时间 + 耗时
- 操作按钮：复用配置 / 编辑输出 / 删除记录

### Lightbox.tsx
全屏图片查看器 (z-index: 60)。

**交互：**
- **滚轮缩放** (1x - 10x)：以鼠标位置为锚点缩放
- **鼠标拖拽平移**：仅在缩放 > 1x 时启用
- **双击**：缩放到 3x / 恢复 1x
- **触控**：双指缩放 + 单指拖拽 + 双击检测
- **键盘**：左右箭头切换图片
- **点击关闭**：仅在 1x 且非拖拽时触发

**UI 元素：**
- 半透明遮罩背景
- 缩放时显示百分比 Badge (1.5s 自动隐藏)
- 多图时显示左右箭头 + 页码指示器

**性能：**
- 用 ref 追踪变换状态，避免每帧渲染
- 仅通过 `forceRender` 在需要时触发 React 渲染

### SettingsModal.tsx
设置弹窗（z-index: 70，高于 Lightbox）。

**生成配置：**
- API 说明（提示配置已移到后端）
- 请求超时输入 (10-600 秒)

**数据管理：**
- 导出：调用 `exportData()`，触发浏览器下载 ZIP
- 导入：文件选择器，接受 `.zip` 文件，调用 `importData()`
- 清空所有数据：红色按钮，二次确认

**版本显示：** 右上角显示 `v{__APP_VERSION__}`（来自 vite.config.ts 的 `define`）

### Select.tsx
通用下拉选择组件。自动检测可用空间决定向上/下展开。点击外部自动关闭。支持 `disabled` 属性。动画效果：下拉/上拉各有不同的 transform-origin。

### ConfirmDialog.tsx
通用确认对话框。"破坏性"操作（删除/清空）前弹出，防止误操作。

### Toast.tsx
底部居中消息提示，3 秒自动消失。3 种类型：info / success / error（不同边框颜色）。

### ImageContextMenu.tsx
全局右键菜单。监听 `contextmenu` 事件，当 target 是 `<img>` 时显示。两个选项：复制（通过 Clipboard API）和下载（创建临时链接）。自动避让视口边缘。

### SizePickerModal.tsx
比例选择弹窗。9 个预设网格（1:1 / 3:2 / 2:3 / 16:9 / 9:16 / 4:3 / 3:4 / 21:9），显示在占位图标上。当前选中项高亮。底部显示基准分辨率 + 计算出的目标像素尺寸。

---

## 10. 工具库详解

### db.ts — IndexedDB 封装

**数据库：** `gpt-image-playground` v1

| Object Store | keyPath | 说明 |
|-------------|---------|------|
| `tasks` | `id` | 任务记录 |
| `images` | `id` | 图片 (SHA-256 hash) |

**图片哈希 (`hashDataUrl`)：**
1. 优先使用 `crypto.subtle.digest('SHA-256')`
2. 降级方案：双 FNV-1a 变体 (32-bit)，输出格式 `fallback-{h1}{h2}`

**去重存储 (`storeImage`)：**
- 先取 hash，再查是否存在
- 已存在则跳过写入，直接返回已有 id

### size.ts — 尺寸计算

**尺寸模式：**
| 输入 | 示例 | 处理 |
|------|------|------|
| 比例表达式 | `"16:9"` | `parseRatio()` → `calculateImageSize()` |
| 像素尺寸 | `"1920x1080"` | `normalizeImageSize()` → 对齐到 16 倍数 |
| `"auto"` | `"auto"` | 透传，不做尺寸限制 |

**calculateImageSize 算法：**
1. 取标准基准分辨率 (1K=1920×1080, 2K=2560×1440, 4K=3840×2160)
2. 计算基准像素数 `basePixels = w × h`
3. `scale = sqrt(basePixels / (ratioW × ratioH))`
4. `width = floor(ratioW × scale / 16) × 16`
5. `height = floor(ratioH × scale / 16) × 16`

优势：不同比例在同基准下像素数保持一致，减少因非标准结果带来的意料之外的子像素对齐。

**formatImageRatio：**
- 计算 GCD 简化比例
- 匹配常见预设 (1:1, 4:3, 3:4, 3:2, 2:3, 16:9, 9:16, 21:9)
- 无精确匹配时标注近似值 `≈{ratio}`

### useCloseOnEscape.ts — ESC 键管理

全局 ESC 栈：多个模态注册时，ESC 只关闭最顶层（最后注册）的那个。全局 keydown 监听器只注册一次。

使用方式：
```typescript
useCloseOnEscape(enabled: boolean, onClose: () => void)
```

---

## 11. 样式与主题

### 色彩系统

| 用途 | Light | Dark |
|------|-------|------|
| 页面背景 | 暖米色调 `#f7f5f1` | 深蓝黑 `#08111d` |
| 卡片背景 | `bg-stone-50/80` | `bg-slate-900/80` |
| 边框 | `border-slate-200` | `border-white/[0.08]` |
| 主文字 | `#0f172a` (slate-900) | `#e2e8f0` (slate-200) |
| 次要文字 | `text-slate-400` | `text-slate-500` |
| 强调色 | `teal-600` / `amber-500` | `teal-400` / `amber-400` |

### 字体

```css
--font-ui-sans: 'HarmonyOS Sans SC', 'Noto Sans SC', 'PingFang SC', ...
--font-mono: 'Maple Mono', 'Cascadia Code', 'SF Mono', Menlo, ...
```

- UI 字体通过 LobeHub webfont CDN 加载 (HarmonyOS Sans SC)
- 等宽字体通过 zeoseven CDN 加载 (Maple Mono NF)

### 动画系统

| 动画 | 用途 | 时长 | 缓动 |
|------|------|------|------|
| `modal-in` | 弹窗面板进入 | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `overlay-in` | 遮罩进入 | 200ms | ease-out |
| `slide-down-in` | 设置面板进入 | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `zoom-in` | Lightbox 图片 | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `confirm-in` | 确认对话框 | 200ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `dropdown-down` | 下拉展开 | 150ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `dropdown-up` | 下拉上展 | 150ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `toast-enter` | Toast 进入 | 300ms | cubic-bezier(0.16, 1, 0.3, 1) |
| `fade-in` | 淡入 | 200ms | ease-out |

### 深色模式

通过 Tailwind 的 `darkMode: 'media'` + `@media (prefers-color-scheme: dark)` 覆盖全局样式实现，跟随系统设置。

### 毛玻璃效果

卡片、弹窗、搜索栏统一使用：
- `backdrop-blur-xl` / `backdrop-blur-2xl`
- 半透明背景 `bg-stone-50/85` / `bg-slate-900/85`
- 细边框 `border border-white/50` / `border-white/[0.08]`

### 装饰性背景

- 全页面：3 层径向渐变叠加 + 网格纹理
- 卡片/弹窗内：聚焦区域微妙的彩色高光

---

## 12. 开发环境搭建

### 前置要求

- Node.js 20+
- Python 3.12+
- (可选) Docker + Docker Compose

### 后端启动

```bash
cd backend

# 首次安装
cp config.local.json.example config.local.json
# 编辑 config.local.json，填入 api_key 和 base_url

python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 启动 (监听 0.0.0.0:8000)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
npm install
npm run dev    # Vite dev server → localhost:5173
```

Vite 配置自动将 `/v1/*` 代理到 `http://localhost:8000`。

### 本地开发 URL

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8000`
- 后端健康检查：`http://localhost:8000/health`

---

## 13. 构建与部署

### Docker 部署 (生产)

```bash
# 1. 准备配置
cp backend/config.local.json.example backend/config.local.json
# 编辑 config.local.json

# 2. 启动
docker compose up -d --build

# 3. 访问
# http://localhost:3399

# 停止
docker compose down
```

### 服务端口

| 服务 | 容器内端口 | 宿主机端口 |
|------|-----------|-----------|
| Nginx (frontend) | 80 | 3399 |
| Python (backend) | 8000 | (仅内部) |

### Nginx 配置要点

```nginx
# 静态资源长缓存 (带 hash 文件名)
location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }

# 后端代理 (长超时，适配图片生成)
location /v1/ { proxy_pass http://backend:8000/v1/; proxy_read_timeout 300s; }

# SPA fallback
location / { try_files $uri $uri/ /index.html; }
```

### 前端构建命令

```bash
npm run build    # tsc -b && vite build
```

产物输出到 `dist/`。构建时会将 `package.json` 中的 `version` 注入为全局变量 `__APP_VERSION__`。

### Dockerfile (前端)

多阶段构建：
1. **Stage 1 (build)**：Node 20 Alpine → `npm ci` → `npm run build` → 产出 `dist/`
2. **Stage 2 (runtime)**：Nginx Alpine → 复制 `dist/` → 复制 `nginx.conf`

### Dockerfile (后端)

单阶段：Python 3.12 Slim → `pip install` → 复制 `backend/` → `uvicorn main:app`

---

## 14. PWA 配置

### manifest.webmanifest

```json
{
  "name": "幻梦",
  "short_name": "幻梦",
  "start_url": "./",
  "display": "standalone",
  "background_color": "#f7f5f1",
  "theme_color": "#14b8a6",
  "icons": [{ "src": "pwa-icon.svg", "sizes": "512x512", "purpose": "any maskable" }]
}
```

### Service Worker (sw.js)

缓存策略：
- 预缓存：`index.html`、`manifest.webmanifest`、`pwa-icon.svg`
- 运行时缓存：所有请求先尝试缓存，缓存未命中时走网络，边用边缓存
- 缓存名称带版本号，install 时清理旧版本

### 注册 (main.tsx)

```typescript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
```

---

## 15. 后端详解

### 配置加载 (`load_config`)

优先级：`config.local.json` > 环境变量 > 默认值

| 配置项 | JSON Key | 环境变量 | 默认值 |
|--------|----------|---------|--------|
| API Key | `openai_api_key` | `OPENAI_API_KEY` | (必填) |
| 上游 URL | `openai_base_url` | `OPENAI_BASE_URL` | `https://api.openai.com` |
| 超时 | `openai_timeout` | `OPENAI_TIMEOUT` | 300 |
| CORS 白名单 | `cors_allow_origins` | `CORS_ALLOW_ORIGINS` | localhost:5173 |
| HTTP 代理 | `http_proxy` | (仅 JSON) | 无 |

配置通过 `@lru_cache` 缓存，避免每次请求重读文件。

### 上游请求构造 (`build_upstream_request_options`)

- **JSON 请求** (generations)：解析 body → 强制 `payload["model"] = IMAGE_MODEL` → 重新序列化
- **multipart 请求** (edits)：原样转发 body 字节
- **其他 Content-Type**：原样转发

### HTTP Client (`build_http_client`)

- `follow_redirects: True`
- `trust_env: False` (不读取系统代理环境变量)
- 仅在配置中显式指定 `http_proxy` 时才启用代理

### CORS

```python
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]
allow_methods=["POST", "GET", "OPTIONS"]
allow_headers=["*"]
allow_credentials=False
```

### 诊断工具 (`test_image_edits.py`)

CLI 脚本，用于测试 `/v1/images/edits` 端点：
- 支持 `--base-url` 和 `--api-key` 参数
- 测试 `image[]` 和 `image` 两种 multipart 字段名
- 可针对本地后端或上游直连

---

## 16. 安全设计

### API Key 保护

- API Key **仅**存在于后端 `config.local.json` 或环境变量 `OPENAI_API_KEY`
- 前端**无法访问** API Key，所有请求经过后端注入
- `config.local.json` 已加入 `.gitignore`

### 路径白名单

后端仅代理两个路径：
- `images/generations`
- `images/edits`

其他所有路径返回 404。

### Model 锁定

- JSON 请求：后端强制覆盖 `model = "gpt-image-2"`
- Multipart 请求：model 由前端 FormData 指定（同为 `gpt-image-2`）

### 请求头过滤

- **转发到上游**：仅 `accept` 和 `content-type`
- **返回给客户端**：仅 `cache-control` 和 `content-type`

### CORS 限制

仅允许本地开发域名，`allow_credentials=False`。

### 数据安全

- 所有数据存储在浏览器本地 (IndexedDB + localStorage)
- 不向任何外部服务发送用户数据（除必要的 API 调用）
- ZIP 导出/导入均为本地操作

---

## 17. 常见问题排查

### 502 Bad Gateway

可能性：
1. `OPENAI_BASE_URL` 配置错误或不可达
2. 上游 API 协议不兼容（如开启了 WebSocket）
3. API Key 无效或额度不足
4. **特殊**：上游使用 codex2api 的 WebSocket 模式时，`RemoteProtocolError` 会被捕获并给出中文提示

### 前端请求超时

- 前端超时默认 300s，可在设置面板调整 (10-600s)
- 后端 httpx 超时使用配置中的 `openai_timeout` (默认 300s)
- Nginx 超时已在 nginx.conf 中设为 300s

### Service Worker 缓存导致页面不更新

- 强制刷新 (Ctrl+Shift+R)
- 清除浏览器缓存和 Service Worker
- DevTools → Application → Service Workers → Unregister

### 图片导入后不显示

- 确保 ZIP 中包含 `manifest.json`
- 确保 `manifest.json` 中包含 `tasks` 和 `imageFiles` 字段
- 确保 ZIP 内的图片路径与 `imageFiles[].path` 一致

### IndexedDB 数据量过大

- 图片以 data URL (base64) 形式存储，每张图约 1.3x 原始大小
- 可在设置中使用"清空所有数据"按钮，或通过浏览器 DevTools 手动管理

---

## 18. 速查索引

### 如果要修改...

| 需求 | 关注文件 |
|------|---------|
| 修改 API 参数 | `src/types.ts` → `src/lib/api.ts` → `src/store.ts` |
| 添加新的生成参数 | `src/types.ts` (TaskParams) → `src/components/InputBar.tsx` (UI) → `src/lib/api.ts` (请求) |
| 修改比例/分辨率计算 | `src/lib/size.ts` + `src/components/SizePickerModal.tsx` |
| 修改 UI 样式 | `src/index.css` (全局) + 组件的 Tailwind class |
| 修改后端代理行为 | `backend/main.py` |
| 修改 IndexedDB 结构 | `src/lib/db.ts` → 需要提升 `DB_VERSION` |
| 修改持久化策略 | `src/store.ts` (Zustand persist partialize) |
| 添加新的弹窗/页面 | `src/components/` + `src/App.tsx` + `src/store.ts` (UI state) |
| 修改 Nginx 配置 | `deploy/nginx.conf` |
| 修改 Docker 部署 | `docker-compose.yml` + `deploy/Dockerfile` + `deploy/Dockerfile.backend` |

### 关键数值常量

| 常量 | 位置 | 值 |
|------|------|-----|
| 参考图上限 | `InputBar.tsx:21` | 16 |
| 生成数量范围 | 隐式 | 1-4 |
| 超时默认值 | `types.ts:8` / `main.py:14` | 300s |
| 超时可设范围 | `SettingsModal.tsx` | 10-600s |
| 缩放范围 | `Lightbox.tsx:5-6` | 1x - 10x |
| 基准分辨率 1K | `size.ts:7` | 1920×1080 |
| 基准分辨率 2K | `size.ts:8` | 2560×1440 |
| 基准分辨率 4K | `size.ts:9` | 3840×2160 |
| 像素对齐倍数 | `size.ts` | 16 |
| IndexedDB 版本 | `db.ts:4` | 1 |
| Toast 显示时长 | `store.ts:160` | 3000ms |
| Zoom Badge 隐藏延迟 | `Lightbox.tsx:154` | 1500ms |

### Git 忽略清单

- `node_modules/`
- `dist/`
- `backend/config.local.json`
- `backend/.venv/`
- `__pycache__/`
