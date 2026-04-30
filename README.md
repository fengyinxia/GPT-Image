# 幻梦

Fork 自 [https://github.com/CookSleep/gpt_image_playground](https://github.com/CookSleep/gpt_image_playground)

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

1. 创建 `.env` 文件：

```env
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://api.openai.com
OPENAI_TIMEOUT=300
```

2. 启动：

```bash
docker compose up -d --build
```

3. 访问：

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
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
OPENAI_API_KEY=sk-xxxx OPENAI_BASE_URL=https://api.openai.com uvicorn main:app --host 0.0.0.0 --port 8000
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

后端通过环境变量读取配置。Docker Compose 会自动加载项目根目录的 `.env` 文件。

常用字段：

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | 是 | 无 | 后端请求上游 OpenAI 兼容接口使用的 API Key。 |
| `OPENAI_BASE_URL` | 否 | `https://api.openai.com` | 上游 OpenAI 兼容 API 根地址。后端会拼接 `/v1/images/generations`、`/v1/images/edits` 和 `/v1/chat/completions`。 |
| `OPENAI_TIMEOUT` | 否 | `300` | 后端请求上游接口的超时时间，单位秒。 |
| `GENERATED_IMAGE_DIR` | 否 | `/data/generated` | 后端保存生成图片的目录。Docker Compose 中固定为 `/data/generated`，并映射到宿主机 `./data/generated`。 |

可选高级字段：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 本地开发跨域白名单。Docker 访问通常经 Nginx 同源代理，不需要配置。 |
| `HTTP_PROXY` | 空 | 后端访问上游接口时使用的 HTTP 代理。仅在确实需要代理访问上游时配置。 |

`.env` 已加入 `.gitignore`，不要提交真实密钥。

前端设置里的“任务等待超时 (秒)”只控制浏览器等待后台图片任务完成的最长时间；后端请求上游接口的超时仍由 `OPENAI_TIMEOUT` 控制。

## 使用限制

为避免误操作导致费用或资源异常，项目内置以下限制：

| 项目 | 限制 |
| --- | --- |
| 同时运行的图片任务 | 最多 3 个 |
| 单次图片任务请求体 | 最大 64MB |
| 参考图数量 | 最多 16 张 |
| 单张参考图 | 最大 16MB |
| 单次参考图总大小 | 最大 48MB |
| 导入 ZIP 文件 | 最大 256MB |
| 导入 ZIP 解压后总大小 | 最大 512MB |
| 导入 `manifest.json` | 最大 10MB |
| 单张导入图片 | 最大 64MB |
| 单次导入任务数 | 最多 2000 条 |
| 单次导入图片数 | 最多 2000 张 |

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
