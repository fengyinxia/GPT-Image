import argparse
import json
import os
from pathlib import Path
from typing import Any

import httpx


CONFIG_FILE = Path(__file__).with_name("config.local.json")
DEFAULT_BACKEND_URL = "http://127.0.0.1:8000/v1/images/edits"
DEFAULT_UPSTREAM_BASE_URL = "https://api.openai.com"


def load_local_config() -> dict[str, Any]:
    if not CONFIG_FILE.exists():
        return {}
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def get_string(config: dict[str, Any], local_key: str, env_key: str, default: str = "") -> str:
    value = config.get(local_key)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return os.getenv(env_key, default).strip()


def build_target_url(args: argparse.Namespace, config: dict[str, Any]) -> str:
    if args.url:
        return args.url
    if args.direct_upstream:
        base_url = get_string(
            config,
            "openai_base_url",
            "OPENAI_BASE_URL",
            DEFAULT_UPSTREAM_BASE_URL,
        ).rstrip("/")
        return f"{base_url}/v1/images/edits"
    return DEFAULT_BACKEND_URL


def build_headers(args: argparse.Namespace, config: dict[str, Any]) -> dict[str, str]:
    headers: dict[str, str] = {}
    api_key = args.api_key
    if not api_key and args.direct_upstream:
        api_key = get_string(config, "openai_api_key", "OPENAI_API_KEY")
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    return headers


def build_data(args: argparse.Namespace) -> list[tuple[str, str]]:
    data = [
        ("model", "gpt-image-2"),
        ("prompt", args.prompt),
        ("output_format", args.output_format),
    ]
    if args.include_optional:
        data.extend(
            [
                ("size", args.size),
                ("quality", args.quality),
                ("moderation", args.moderation),
                ("response_format", "b64_json"),
            ]
        )
    return data


def build_files(field_name: str, image_paths: list[Path]) -> list[tuple[str, tuple[str, bytes, str]]]:
    files: list[tuple[str, tuple[str, bytes, str]]] = []
    for path in image_paths:
        suffix = path.suffix.lower()
        content_type = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
        }.get(suffix, "application/octet-stream")
        files.append((field_name, (path.name, path.read_bytes(), content_type)))
    return files


def print_response(label: str, response: httpx.Response) -> None:
    print(f"\n=== {label} ===")
    print(f"HTTP {response.status_code}")
    print("content-type:", response.headers.get("content-type", ""))
    body = response.text
    if len(body) > 4000:
        body = body[:4000] + "\n...<truncated>"
    print(body)


def main() -> int:
    parser = argparse.ArgumentParser(description="Diagnose /v1/images/edits compatibility.")
    parser.add_argument("images", nargs="+", help="One or more local image file paths.")
    parser.add_argument("--url", help="Full target URL. Default is local backend /v1/images/edits.")
    parser.add_argument(
        "--direct-upstream",
        action="store_true",
        help="Read upstream base URL and API key from backend/config.local.json or env, then call upstream directly.",
    )
    parser.add_argument("--api-key", help="Override Authorization Bearer token.")
    parser.add_argument("--prompt", default="Replace the background with aurora lights")
    parser.add_argument("--output-format", default="png", choices=["png", "jpeg", "webp"])
    parser.add_argument("--field-name", default="both", choices=["image", "image[]", "both"])
    parser.add_argument("--include-optional", action="store_true", help="Also send size/quality/moderation/response_format.")
    parser.add_argument("--size", default="1024x1024")
    parser.add_argument("--quality", default="high")
    parser.add_argument("--moderation", default="auto")
    parser.add_argument("--timeout", type=float, default=180.0)
    args = parser.parse_args()

    image_paths = [Path(item).expanduser().resolve() for item in args.images]
    missing = [str(path) for path in image_paths if not path.is_file()]
    if missing:
        print("These image files do not exist:")
        for item in missing:
            print(" -", item)
        return 2

    config = load_local_config()
    target_url = build_target_url(args, config)
    headers = build_headers(args, config)
    data = build_data(args)
    field_names = ["image", "image[]"] if args.field_name == "both" else [args.field_name]

    print("Target URL:", target_url)
    print("Field names:", ", ".join(field_names))
    print("Using optional fields:", "yes" if args.include_optional else "no")
    print("Image count:", len(image_paths))
    print("Auth header:", "yes" if "Authorization" in headers else "no")

    has_success = False
    with httpx.Client(timeout=args.timeout, follow_redirects=True, trust_env=False) as client:
        for field_name in field_names:
            response = client.post(
                target_url,
                headers=headers,
                data=build_data(args),
                files=build_files(field_name, image_paths),
            )
            print_response(f"multipart field `{field_name}`", response)
            if response.is_success:
                has_success = True

    return 0 if has_success else 1


if __name__ == "__main__":
    raise SystemExit(main())
