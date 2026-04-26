# GPT Image Playground

一个基于 OpenAI 兼容图片接口的生图 / 改图工具。前端只请求本项目后端，真实的上游地址和 API Key 保存在服务端。

## 功能

- 文本生图，参考图编辑
- 支持上传、粘贴、拖拽参考图，最多 16 张
- 历史记录、本地 IndexedDB 存储、导入导出
- 前端只暴露同源 `/v1/*`，敏感配置放后端
- 模型固定为 `gpt-image-2`
- 尺寸由“基准分辨率 + 图像比例”换算

## 快速开始

### Docker

1. 创建本地配置文件：

```bash
cp backend/config.local.json.example backend/config.local.json
```

2. 编辑 `backend/config.local.json`，至少填这两个字段：

```json
{
  "openai_api_key": "sk-xxxx",
  "openai_base_url": "https://api.openai.com"
}
```

3. 启动：

```bash
docker compose up -d --build
```

4. 访问：

```text
http://localhost:3399
```

停止服务：

```bash
docker compose down
```

### 本地开发

先启动后端：

```bash
cd backend
cp config.local.json.example config.local.json
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

再启动前端：

```bash
npm install
npm run dev
```

前端默认地址：

```text
http://localhost:5173
```

## 配置

后端优先读取 `backend/config.local.json`，不存在时再回退到环境变量。

常用字段：

- `openai_api_key` / `OPENAI_API_KEY`：必填
- `openai_base_url` / `OPENAI_BASE_URL`：上游 OpenAI 兼容 API 根地址
- `openai_timeout` / `OPENAI_TIMEOUT`：请求超时，默认 `300`
- `cors_allow_origins` / `CORS_ALLOW_ORIGINS`：本地开发跨域白名单
- `http_proxy` / `HTTP_PROXY`：仅显式配置时启用代理

`backend/config.local.json` 已加入 `.gitignore`。

## 模型与尺寸

- 请求里的 `model` 固定为 `gpt-image-2`
- 比例只负责选择 `1:1`、`16:9`、`9:16` 这类画幅
- 基准分辨率可选 `auto / 1K / 2K / 4K`

当前标准分辨率：

- `1K`：`1920x1080`
- `2K`：`2560x1440`
- `4K`：`3840x2160`

如果基准选 `auto`，前端不会下发 `size`，比例只保留在界面里。

## 常见问题

### 502 Bad Gateway

通常表示后端收到了请求，但上游失败。常见原因：

- `OPENAI_BASE_URL` 不是兼容的 API 根地址
- 上游不支持 `/v1/images/generations` 或 `/v1/images/edits`
- API Key 无效，或账号无可用额度
- 上游网关返回了非标准 HTTP 响应

### 页面还是旧版本

先强制刷新；如果还不对，清掉浏览器缓存和 Service Worker。

## 技术栈

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Zustand
- FastAPI + HTTPX
- Docker Compose + Nginx

## 许可证

[MIT License](LICENSE)
