# GPT Image Playground Backend

这个后端把真实的 API 基础地址和 API Key 放在服务端，前端只请求同源或代理后的 `/v1/images/generations`、`/v1/images/edits`。

## 环境变量配置

后端通过环境变量读取真实 API 基础地址和 API Key：

```env
OPENAI_API_KEY=sk-xxxx
OPENAI_BASE_URL=https://api.openai.com
OPENAI_TIMEOUT=300
GENERATED_IMAGE_DIR=/data/generated
```

## 本地启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
OPENAI_API_KEY=sk-xxxx OPENAI_BASE_URL=https://api.openai.com uvicorn main:app --host 0.0.0.0 --port 8000
```

然后在项目根目录启动前端：

```bash
npm run dev
```

Vite 会把 `/v1/*` 代理到 `http://localhost:8000`。

## 配置项

| 变量 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | 是 | 无 | 后端请求上游 OpenAI 兼容接口使用的 API Key。 |
| `OPENAI_BASE_URL` | 否 | `https://api.openai.com` | 上游 OpenAI 兼容 API 根地址。 |
| `OPENAI_TIMEOUT` | 否 | `300` | 后端请求上游接口的超时时间，单位秒。 |
| `GENERATED_IMAGE_DIR` | 否 | `/data/generated` | 生成图片落盘目录。Docker Compose 中固定为 `/data/generated`，并映射到宿主机 `./data/generated`。 |

可选高级字段：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `CORS_ALLOW_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 本地开发跨域白名单。Docker 访问通常经 Nginx 同源代理，不需要配置。 |
| `HTTP_PROXY` | 空 | 后端访问上游接口时使用的 HTTP 代理。仅在确实需要代理访问上游时配置。 |

## 接口限制

- 图片任务最多同时运行 3 个。
- 单次图片任务请求体最大 64MB。
- 生成图片文件会保存到 `GENERATED_IMAGE_DIR`，默认保留 7 天。
- 图片任务状态仅保存在后端内存中，完成或失败后的任务结果默认保留 24 小时。
