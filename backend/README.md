# GPT Image Playground Backend

这个后端把真实的 API 基础地址和 API Key 放在服务端，前端只请求同源或代理后的 `/v1/images/generations`、`/v1/images/edits`。

## 本地配置文件

后端会优先读取 `backend/config.local.json`。如果这个文件不存在，再回退到环境变量。

可以基于 `backend/config.local.json.example` 新建一个本地配置文件：

```json
{
  "openai_api_key": "sk-xxxx",
  "openai_base_url": "https://api.openai.com",
  "openai_timeout": "300",
  "cors_allow_origins": "http://localhost:5173,http://127.0.0.1:5173",
  "http_proxy": ""
}
```

## 本地启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

然后在项目根目录启动前端：

```bash
npm run dev
```

Vite 会把 `/v1/*` 代理到 `http://localhost:8000`。

## 配置项

- `openai_api_key`：必填，真实 API Key。
- `openai_base_url`：可选，默认 `https://api.openai.com`。
- `openai_timeout`：可选，默认 `300` 秒。
- `cors_allow_origins`：可选，默认允许 Vite 本地开发地址。
- `http_proxy`：可选。默认不读取系统代理环境变量；只有这里显式配置后端代理地址时才会走代理。

同名环境变量仍然可用，主要给 Docker 或线上部署兜底。
