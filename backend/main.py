from dataclasses import dataclass
import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.datastructures import UploadFile


DEFAULT_BASE_URL = "https://api.openai.com"
DEFAULT_CORS_ALLOW_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
DEFAULT_TIMEOUT = 300.0
FORWARDED_REQUEST_HEADERS = frozenset({"accept", "content-type"})
RETURNED_RESPONSE_HEADERS = frozenset({"cache-control", "content-type"})
PROXY_PATHS = frozenset({"images/generations", "images/edits"})
CONFIG_FILE = Path(__file__).with_name("config.local.json")
IMAGE_MODEL = "gpt-image-2"


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True, slots=True)
class AppConfig:
    api_key: str
    base_url: str
    timeout: float
    cors_allow_origins: tuple[str, ...]
    http_proxy: str


def normalize_base_url(value: str) -> str:
    return value.strip().rstrip("/") or DEFAULT_BASE_URL


def read_local_config_file() -> dict[str, Any]:
    if not CONFIG_FILE.exists():
        return {}

    try:
        with CONFIG_FILE.open("r", encoding="utf-8") as file_handle:
            data = json.load(file_handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise ConfigError(f"读取本地配置文件失败：{CONFIG_FILE} ({exc})") from exc

    if not isinstance(data, dict):
        raise ConfigError(f"本地配置文件格式无效：{CONFIG_FILE}")

    return data


def read_string(
    config: dict[str, Any],
    *,
    local_key: str,
    env_key: str,
    default: str = "",
) -> str:
    value = config.get(local_key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return os.getenv(env_key, default).strip()


def read_local_only_string(config: dict[str, Any], key: str) -> str:
    value = config.get(key)
    return value.strip() if isinstance(value, str) else ""


def parse_timeout(raw_value: str) -> float:
    try:
        return float(raw_value)
    except ValueError:
        return DEFAULT_TIMEOUT


def parse_cors_allow_origins(raw_value: str) -> tuple[str, ...]:
    return tuple(origin.strip() for origin in raw_value.split(",") if origin.strip())


@lru_cache
def load_config() -> AppConfig:
    raw_config = read_local_config_file()
    return AppConfig(
        api_key=read_string(
            raw_config,
            local_key="openai_api_key",
            env_key="OPENAI_API_KEY",
        ),
        base_url=normalize_base_url(
            read_string(
                raw_config,
                local_key="openai_base_url",
                env_key="OPENAI_BASE_URL",
                default=DEFAULT_BASE_URL,
            )
        ),
        timeout=parse_timeout(
            read_string(
                raw_config,
                local_key="openai_timeout",
                env_key="OPENAI_TIMEOUT",
                default=str(int(DEFAULT_TIMEOUT)),
            )
        ),
        cors_allow_origins=parse_cors_allow_origins(
            read_string(
                raw_config,
                local_key="cors_allow_origins",
                env_key="CORS_ALLOW_ORIGINS",
                default=DEFAULT_CORS_ALLOW_ORIGINS,
            )
        ),
        http_proxy=read_local_only_string(raw_config, "http_proxy"),
    )


def build_upstream_url(base_url: str, path: str) -> str:
    return f"{base_url}/v1/{path}"


def build_upstream_protocol_error_message(base_url: str, path: str, exc: Exception) -> str:
    return (
        f"上游接口协议异常：POST {base_url}/v1/{path} 返回了非标准 HTTP 响应（{exc}）。"
        "如果上游是 codex2api，请检查它是否开启了 USE_WEBSOCKET=true；"
        "当前 codex2api 的 WebSocket 适配层可能会把成功握手的 101 Switching Protocols "
        "当成普通 HTTP 响应回给下游客户端。关闭上游 USE_WEBSOCKET 或修复上游 wsrelay 适配后再试。"
    )


def build_upstream_headers(
    request: Request,
    api_key: str,
    *,
    include_content_type: bool,
) -> dict[str, str]:
    headers = {
        name: value
        for name, value in request.headers.items()
        if name.lower() in FORWARDED_REQUEST_HEADERS
    }
    if not include_content_type:
        headers.pop("content-type", None)
    headers["authorization"] = f"Bearer {api_key}"
    headers["cache-control"] = "no-store, no-cache, max-age=0"
    headers["pragma"] = "no-cache"
    return headers


async def build_upstream_request_options(request: Request) -> dict[str, Any]:
    content_type = request.headers.get("content-type", "").lower()

    if content_type.startswith("application/json"):
        try:
            payload = json.loads(await request.body())
        except json.JSONDecodeError as exc:
            raise ConfigError(f"请求 JSON 格式无效：{exc}") from exc
        if not isinstance(payload, dict):
            raise ConfigError("请求 JSON 必须是对象")
        payload["model"] = IMAGE_MODEL
        return {
            "content": json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            "include_content_type": True,
        }

    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        data: list[tuple[str, str]] = [("model", IMAGE_MODEL)]
        files: list[tuple[str, tuple[str, bytes, str]]] = []

        for key, value in form.multi_items():
            if key == "model":
                continue
            if isinstance(value, UploadFile):
                files.append(
                    (
                        key,
                        (
                            value.filename or "upload",
                            await value.read(),
                            value.content_type or "application/octet-stream",
                        ),
                    )
                )
                continue
            data.append((key, str(value)))

        return {
            "data": data,
            "files": files,
            "include_content_type": False,
        }

    return {
        "content": await request.body(),
        "include_content_type": True,
    }


def build_http_client(config: AppConfig) -> httpx.AsyncClient:
    client_options: dict[str, Any] = {
        "timeout": config.timeout,
        "follow_redirects": True,
        "trust_env": False,
    }
    if config.http_proxy:
        client_options["proxy"] = config.http_proxy
    return httpx.AsyncClient(**client_options)


def extract_response_headers(response: httpx.Response) -> dict[str, str]:
    return {
        name: value
        for name, value in response.headers.items()
        if name.lower() in RETURNED_RESPONSE_HEADERS
    }


app_config = load_config()
app = FastAPI(title="GPT Image Playground Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(app_config.cors_allow_origins),
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/v1/{path:path}")
async def proxy_openai_images(path: str, request: Request) -> Response:
    if path not in PROXY_PATHS:
        return Response("Not found", status_code=404)

    config = load_config()
    if not config.api_key:
        return JSONResponse(
            {"error": {"message": "后端未配置 OPENAI_API_KEY"}},
            status_code=500,
        )

    target_url = build_upstream_url(config.base_url, path)

    try:
        upstream_options = await build_upstream_request_options(request)
    except ConfigError as exc:
        return JSONResponse(
            {"error": {"message": str(exc), "type": "invalid_request_error"}},
            status_code=400,
        )

    include_content_type = bool(upstream_options.pop("include_content_type", True))
    headers = build_upstream_headers(
        request,
        config.api_key,
        include_content_type=include_content_type,
    )

    try:
        async with build_http_client(config) as client:
            upstream = await client.post(target_url, headers=headers, **upstream_options)
    except httpx.RemoteProtocolError as exc:
        return JSONResponse(
            {
                "error": {
                    "message": build_upstream_protocol_error_message(
                        config.base_url,
                        path,
                        exc,
                    )
                }
            },
            status_code=502,
        )
    except httpx.TimeoutException:
        return JSONResponse(
            {"error": {"message": "后端请求上游接口超时"}},
            status_code=504,
        )
    except httpx.RequestError as exc:
        return JSONResponse(
            {"error": {"message": f"后端请求上游接口失败：{exc}"}},
            status_code=502,
        )

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=extract_response_headers(upstream),
    )
