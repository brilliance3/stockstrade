from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models.analysis_schema import AnalyzeResponse, AnalyzeSymbolRequest, ChartAnalysisResult
from app.services.rule_engine import apply_first_principle_rules
from app.services.vision_service import (
    analyze_chart_image,
    analyze_symbol_input,
    build_fallback_from_symbol,
    new_analysis_id,
)
from app.utils.image_utils import validate_upload_image

router = APIRouter(prefix="/api/analyze", tags=["analyze"])

_HISTORY: list[dict] = []


@router.post("/chart-image", response_model=AnalyzeResponse)
async def analyze_chart_image_endpoint(
    image: UploadFile = File(...),
    mode: str = Form("swing"),
    userNote: str | None = Form(None),
) -> AnalyzeResponse:
    data = await image.read()
    try:
        validate_upload_image(image, data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        raw = analyze_chart_image(data, mode, userNote)
        result = ChartAnalysisResult.model_validate(raw)
        result = apply_first_principle_rules(result)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"이미지 분석 중 오류가 발생했습니다: {exc}") from exc

    if result.symbol.upper() in {"UNKNOWN", "N/A"}:
        raise HTTPException(status_code=400, detail="차트 이미지를 업로드해주세요.")

    response = AnalyzeResponse(success=True, analysisId=new_analysis_id(), result=result)
    _HISTORY.append({"id": response.analysisId, "symbol": result.symbol, "summary": result.finalConclusion})
    return response


@router.post("/symbol", response_model=AnalyzeResponse)
def analyze_symbol_endpoint(payload: AnalyzeSymbolRequest) -> AnalyzeResponse:
    try:
        raw = analyze_symbol_input(payload)
        result = ChartAnalysisResult.model_validate(raw)
    except Exception:
        result = build_fallback_from_symbol(payload)

    result.symbol = payload.symbol
    result.market = payload.market
    result.currentPrice = payload.currentPrice
    result = apply_first_principle_rules(result)
    response = AnalyzeResponse(success=True, analysisId=new_analysis_id(), result=result)
    _HISTORY.append({"id": response.analysisId, "symbol": result.symbol, "summary": result.finalConclusion})
    return response


@router.get("/history")
def get_analysis_history() -> dict:
    return {"success": True, "items": _HISTORY[-30:][::-1]}
