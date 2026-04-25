# GPT Image Playground

基于 OpenAI `gpt-image-2` 接口的图片生成与编辑工具。提供简洁的 Web UI，支持文本生成图片、参考图编辑、可视化参数调节、历史记录管理与本地数据导入导出。

**在线体验：** [https://cooksleep.github.io/gpt_image_playground/](https://cooksleep.github.io/gpt_image_playground/)

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

### ⚙️ 精细化参数控制
- **智能尺寸选择器**：支持 `auto`、按 `1K / 2K / 4K` 结合常用比例自动计算分辨率，同时也支持手动输入自定义宽高。
- **自动规整**：为了兼容模型限制，自定义尺寸会自动向下规整到最接近的 16 倍数。
- **预设反推**：打开尺寸选择弹窗时，会自动根据当前尺寸匹配对应的预设比例。
- **其他选项**：支持调整质量 (`low`, `medium`, `high`)、输出格式 (`PNG`, `JPEG`, `WebP`)、压缩率 (0-100) 以及审核强度。

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

前端不会保存 API URL 或 API Key。真实的 API 配置放在 Python 后端本地配置文件或环境变量中，推荐用 Docker Compose 同时启动前后端：

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: deploy/Dockerfile
    ports:
      - "2345:80"
    depends_on:
      - backend
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: deploy/Dockerfile.backend
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      OPENAI_BASE_URL: ${OPENAI_BASE_URL:-https://api.openai.com}
      OPENAI_TIMEOUT: ${OPENAI_TIMEOUT:-300}
    restart: unless-stopped
```

启动：

```bash
OPENAI_API_KEY=sk-xxxx docker compose up --build
```

浏览器访问 `http://localhost:2345` 即可使用。

### 🌐 方式二：GitHub Pages 自动部署

本项目内置了 GitHub Actions 工作流。当你将本项目 Fork 到自己的仓库后，只需推送打上 `v*` 标签的代码，即可自动触发部署。

注意：当前版本的前端默认请求同源 `/v1/*`，GitHub Pages 只能托管静态文件，不能运行 Python 后端。若使用 GitHub Pages，需要额外部署后端，并通过自己的网关或反向代理把 `/v1/*` 转发到 Python 后端。

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
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   后端会优先读取 `backend/config.local.json`。可以先复制 `backend/config.local.json.example` 并填入自己的 key。

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

- `openai_api_key` / `OPENAI_API_KEY`：必填，真实 API Key。
- `openai_base_url` / `OPENAI_BASE_URL`：可选，默认 `https://api.openai.com`。
- `openai_timeout` / `OPENAI_TIMEOUT`：可选，默认 `300` 秒。
- `cors_allow_origins` / `CORS_ALLOW_ORIGINS`：可选，默认允许 Vite 本地开发地址。

---

## 💻 技术栈

- **框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vite.dev/)
- **样式**：[Tailwind CSS 3](https://tailwindcss.com/)
- **状态管理**：[Zustand](https://zustand.docs.pmnd.rs/)
- **数据存储**：浏览器的 IndexedDB API

## 📄 许可证

[MIT License](LICENSE)

## 🔗 致谢

[LINUX DO](https://linux.do)
