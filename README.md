# GPT Image Playground

基于 OpenAI 兼容图片接口的图片生成与编辑工具。项目包含 React 前端和 Python 后端代理：前端只请求本项目后端，真实的 API Base URL 与 Key 只保存在服务端，避免泄露到浏览器。

**仓库地址：** [https://github.com/fengyinxia/GPT-Image](https://github.com/fengyinxia/GPT-Image)

---

## 📸 示例截图

<div align="center">
  <b>主界面</b><br>
  <img src="docs/images/example_1.png" alt="主界面" />
</div>

<br>

<div align="center">
  <b>任务详情</b><br>
  <img src="docs/images/example_2.png" alt="任务详情" />
</div>

<br>

<div align="center">
  <b>移动端适配</b><br>
  <img src="docs/images/example_3.jpg" alt="移动端" width="420" />
</div>

---

## ✨ 功能特性

### 🎨 核心能力
- **文本生图**：输入提示词，调用 `images/generations` 接口生成图片。
- **参考图编辑**：支持上传最多 16 张参考图，调用 `images/edits` 接口进行图片编辑。支持文件选择、粘贴和拖拽三种方式。
- **批量生成**：单次可设置生成多张图片。
- **后端代理**：API Key、上游地址、超时时间等敏感配置放在 Python 后端，浏览器不再保存密钥。

### ⚙️ 精细化参数控制
- **图像比例选择器**：尺寸入口只负责选择 `1:1`、`16:9`、`9:16` 等图像比例，并用可视化卡片展示。
- **基准分辨率控制**：前端可选择 `auto / 1K / 2K / 4K`，最终分辨率由“基准分辨率 + 图像比例”在请求前换算；请求模型始终固定为 `gpt-image-2`。
- **其他选项**：支持调整质量 (`low`, `medium`, `high`)、输出格式 (`PNG`, `JPEG`, `WebP`) 以及审核强度。

### 📁 历史记录与工作流
- **瀑布流任务卡片**：直观展示生成缩略图、提示词、参数和耗时。支持按状态筛选与关键词搜索。
- **快速复用**：一键将历史记录的配置与提示词回填到输入框。
- **迭代生成**：支持将生成的输出结果直接添加到参考图列表中，进行下一轮迭代编辑。
- **画廊与详情**：点击任务卡片可查看完整输入输出，支持大图浏览。
- **快捷操作**：支持图片右键或移动端长按唤出自定义菜单，快速复制或下载图片。

### 💾 本地数据优先
- **IndexedDB 存储**：所有任务记录与图片数据均存储在浏览器的 IndexedDB 中，数据绝不离开本地。
- **性能优化**：参考图采用内存缓存与延迟存储机制，图片采用 SHA-256 哈希自动去重，并在每次启动时自动清理孤立的图片碎片。
- **导入与导出**：支持将完整数据打包为 ZIP 导出。导出的 ZIP 内包含原始图片文件（非 base64）和记录图片元数据的 `manifest.json`，方便备份与迁移。

---

## 🚀 部署与使用

支持多种部署与使用方式，推荐使用 Docker 进行一键部署。

### 🐳 方式一：Docker 部署 (推荐)

推荐用 Docker Compose 同时启动前后端。前端容器负责页面和 `/v1/*` 反向代理，后端容器负责转发到上游 OpenAI 兼容接口。

如果想用本地配置文件，先创建：

```bash
cp backend/config.local.json.example backend/config.local.json
```

然后编辑 `backend/config.local.json`。`docker-compose.yml` 会把这个文件挂载到后端容器的 `/app/backend/config.local.json`。

Linux / macOS：

```bash
docker compose up -d --build
```

Windows PowerShell：

```powershell
docker compose up -d --build
```

也可以不用配置文件，直接用环境变量：

```bash
OPENAI_API_KEY="sk-xxxx" OPENAI_BASE_URL="https://api.openai.com" docker compose up -d --build
```

如果使用第三方兼容网关，把 `openai_base_url` 或 `OPENAI_BASE_URL` 改成你的上游根地址，例如：

```powershell
$env:OPENAI_BASE_URL="http://13.229.138.59:8181"
```

浏览器访问 `http://localhost:2345` 即可使用。停止服务：

```bash
docker compose down
```

### 🌐 方式二：GitHub Pages 自动部署

本项目内置了 GitHub Actions 工作流。当你将本项目 Fork 到自己的仓库后，只需推送打上 `v*` 标签的代码，即可自动触发部署。

注意：当前版本的前端默认请求同源 `/v1/*`，GitHub Pages 只能托管静态文件，不能运行 Python 后端。若使用 GitHub Pages，需要额外部署后端，并通过自己的网关或反向代理把 `/v1/*` 转发到 Python 后端，否则页面无法直接调用图片接口。

1. 进入你的仓库 **Settings → Pages**。
2. 将 **Source** 选项改为 **GitHub Actions**。
3. 推送版本标签：
   ```bash
   git tag v0.1.2
   git push origin v0.1.2
   ```
4. 等待 Action 运行完毕，即可访问你的专属 GitHub Pages。

### 💻 方式三：本地开发与自行构建

1. **启动 Python 后端**

   Windows PowerShell：

   ```powershell
   cd backend
   copy config.local.json.example config.local.json
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   Linux / macOS：

   ```bash
   cd backend
   cp config.local.json.example config.local.json
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

   编辑 `backend/config.local.json`，填入自己的 `openai_api_key` 和 `openai_base_url`。

2. **安装依赖与启动前端开发服务器**
   ```bash
   npm install
   npm run dev
   ```
   随后浏览器访问 `http://localhost:5173`。Vite 会把 `/v1/*` 代理到 `http://localhost:8000`。

3. **构建静态产物**
   ```bash
   npm run build
   ```
   构建输出的文件会存放在 `dist/` 目录下，你可以将其部署到任何静态文件服务器（如 Nginx、Vercel、Netlify 等）。

---

## 🛠️ 后端 API 配置说明

Python 后端会代理前端的 `/v1/images/generations` 和 `/v1/images/edits` 请求，并在服务端附加真实的 `Authorization` 请求头。
本地开发时优先读取 `backend/config.local.json`，不存在时再回退到环境变量。

示例：

```json
{
  "openai_api_key": "sk-xxxx",
  "openai_base_url": "https://api.openai.com",
  "openai_timeout": "300",
  "cors_allow_origins": "http://localhost:5173,http://127.0.0.1:5173",
  "http_proxy": ""
}
```

- `openai_api_key` / `OPENAI_API_KEY`：必填，真实 API Key。
- `openai_base_url` / `OPENAI_BASE_URL`：可选，默认 `https://api.openai.com`。
- `openai_timeout` / `OPENAI_TIMEOUT`：可选，默认 `300` 秒。
- `cors_allow_origins` / `CORS_ALLOW_ORIGINS`：可选，默认允许 Vite 本地开发地址。
- `http_proxy` / `HTTP_PROXY`：可选，默认不使用系统代理；只有显式配置时才走代理。

`backend/config.local.json` 已加入 `.gitignore`，不要把真实 Key 提交到仓库。

---

## 🧩 模型与尺寸

模型 ID 不在设置页手动填写。为了兼容 codex2api 这类网关，后端会把图片请求里的 `model` 固定为 `gpt-image-2`。

前端的“比例”只保存图像比例，不再保存具体像素尺寸。请求前会按“基准分辨率 + 图像比例”换算为上游需要的 `size`：

| 基准分辨率 | 示例：`1:1` |
| --- | --- |
| `auto` | `auto` |
| `1K` / `1080P` | `1920x1080` |
| `2K` | `2560x1440` |
| `4K` | `3840x2160` |

例如比例选 `16:9`、基准选 `2K`，请求前会换算成对应的横向像素尺寸。

---

## 🔧 常见问题

### 后端一直返回 502

先看后端日志。502 通常表示 Python 后端已经收到请求，但上游接口失败。常见原因：

- `OPENAI_BASE_URL` 不是 OpenAI 兼容 API 根地址。
- 上游网关没有支持 `/v1/images/generations` 或 `/v1/images/edits`。
- API Key 无效、账号无可用额度或上游模型不可用。
- 某些网关开启了 WebSocket/升级协议模式，导致普通 HTTP POST 返回非标准响应。

### 浏览器还显示旧设置

如果之前开过页面，可能是浏览器缓存或 Service Worker 缓存旧资源。可以先强制刷新；仍不行就在开发者工具里注销 Service Worker 并清理站点数据。

---

## 💻 技术栈

- **框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vite.dev/)
- **样式**：[Tailwind CSS 3](https://tailwindcss.com/)
- **状态管理**：[Zustand](https://zustand.docs.pmnd.rs/)
- **数据存储**：浏览器的 IndexedDB API
- **后端**：[FastAPI](https://fastapi.tiangolo.com/) + [HTTPX](https://www.python-httpx.org/)
- **部署**：Docker Compose + Nginx

## 📄 许可证

[MIT License](LICENSE)

## 🔗 致谢

[LINUX DO](https://linux.do)
