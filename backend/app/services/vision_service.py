from __future__ import annotations

import base64
import json
import os
from uuid import uuid4

from openai import OpenAI

from app.models.analysis_schema import AnalyzeSymbolRequest, ChartAnalysisResult
from app.services.prompt_service import build_chart_image_prompt, build_system_prompt, build_symbol_prompt


def _client() -> OpenAI:
    # Priority:
    # 1) Process env (export OPENAI_API_KEY=...)
    # 2) .env value loaded by load_dotenv() in app.main
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY가 설정되지 않았습니다. "
            "backend/.env 또는 시스템 환경변수(export OPENAI_API_KEY=...)로 설정해주세요."
        )
    return OpenAI(api_key=api_key)


def analyze_chart_image(image_bytes: bytes, mode: str, user_note: str | None = None) -> dict:
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    client = _client()
    response = client.responses.create(
        model=model,
        input=[
            {"role": "system", "content": build_system_prompt()},
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": build_chart_image_prompt(mode, user_note)},
                    {"type": "input_image", "image_url": f"data:image/png;base64,{b64}"},
                ],
            },
        ],
    )
    text = response.output_text
    return _safe_json_parse(text)


def analyze_symbol_input(payload: AnalyzeSymbolRequest) -> dict:
    model = os.getenv("OPENAI_MODEL", "gpt-5-mini")
    client = _client()
    reference_url = os.getenv("CHATGPT_REFERENCE_URL")
    use_web_search = os.getenv("ENABLE_CHATGPT_WEB_SEARCH", "false").lower() == "true"

    base_input = [
        {"role": "system", "content": build_system_prompt()},
        {"role": "user", "content": build_symbol_prompt(payload.model_dump(), reference_url)},
    ]

    try:
        if use_web_search:
            response = client.responses.create(
                model=model,
                input=base_input,
                tools=[{"type": "web_search_preview"}],
            )
        else:
            response = client.responses.create(
                model=model,
                input=base_input,
            )
    except Exception:
        # If web-search tool is unavailable for selected model/account, fallback to base inference.
        response = client.responses.create(
            model=model,
            input=base_input,
        )

    text = response.output_text
    return _safe_json_parse(text)


def _safe_json_parse(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback for markdown-wrapped payloads.
        stripped = text.strip().removeprefix("```json").removesuffix("```").strip()
        try:
            return json.loads(stripped)
        except json.JSONDecodeError as exc:
            raise ValueError("AI 응답을 JSON으로 해석할 수 없습니다.") from exc


def build_fallback_from_symbol(payload: AnalyzeSymbolRequest) -> ChartAnalysisResult:
    return ChartAnalysisResult(
        symbol=payload.symbol,
        market=payload.market,
        currentPrice=payload.currentPrice,
        trend="unknown",
        trendStrength="unknown",
        riskFactors=["실시간 차트 이미지가 없어 추세/거래량 해석 정확도가 제한됩니다."],
        finalConclusion="입력 정보 기준으로는 조건부 관찰이 우선입니다.",
        tradingNote="- 이미지 기반 확인 전 신규 진입 보류\n- 손절 기준을 먼저 정의",
    )


def new_analysis_id() -> str:
    return uuid4().hex[:10]
