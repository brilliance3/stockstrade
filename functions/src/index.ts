import Busboy from "busboy";
import cors from "cors";
import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { z } from "zod";
import { validateUploadImage } from "./image.js";
import { applyFirstPrincipleRules } from "./rules.js";
import { analyzeSymbolRequestSchema, modeSchema } from "./schema.js";
import { analyzeChartImage, analyzeSymbolInput, buildFallbackFromImage, buildFallbackFromSymbol, newAnalysisId } from "./vision.js";

type HistoryItem = { id: string; symbol: string; summary: string };
const HISTORY: HistoryItem[] = [];

const corsHandler = cors({
  origin: true,
  credentials: true,
});

function addHistory(id: string, symbol: string, summary: string): void {
  HISTORY.push({ id, symbol, summary });
}

function json(res: any, status: number, body: unknown): void {
  res.status(status).json(body);
}

function parseMultipart(req: any): Promise<{ fields: Record<string, string>; file?: { filename: string; buffer: Buffer } }> {
  return new Promise((resolve, reject) => {
    const bb = Busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    let fileName = "";
    const chunks: Buffer[] = [];

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (name, file, info) => {
      if (name !== "image") {
        file.resume();
        return;
      }
      fileName = info.filename || "upload.png";
      file.on("data", (data) => chunks.push(data));
    });

    bb.on("finish", () => {
      const fileBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
      resolve({
        fields,
        file: fileBuffer ? { filename: fileName, buffer: fileBuffer } : undefined,
      });
    });
    bb.on("error", reject);
    if (req.rawBody && Buffer.isBuffer(req.rawBody)) {
      bb.end(req.rawBody);
      return;
    }
    req.pipe(bb);
  });
}

async function handleChartImage(req: any, res: any): Promise<void> {
  const { fields, file } = await parseMultipart(req);
  if (!file) {
    json(res, 400, { success: false, detail: "차트 이미지를 업로드해주세요." });
    return;
  }

  const mode = modeSchema.catch("swing").parse(fields.mode);
  const userNote = fields.userNote;

  try {
    validateUploadImage(file.filename, file.buffer);
  } catch (error) {
    json(res, 400, { success: false, detail: error instanceof Error ? error.message : "이미지 검증 실패" });
    return;
  }

  try {
    let result = await analyzeChartImage(file.buffer, mode, userNote);
    result = applyFirstPrincipleRules(result);
    if (["UNKNOWN", "N/A"].includes(result.symbol.toUpperCase())) {
      json(res, 400, { success: false, detail: "차트 이미지를 업로드해주세요." });
      return;
    }
    const analysisId = newAnalysisId();
    addHistory(analysisId, result.symbol, result.finalConclusion);
    json(res, 200, { success: true, analysisId, result });
  } catch (error) {
    logger.error("chart-image analyze failed", error);
    const result = applyFirstPrincipleRules(buildFallbackFromImage(mode, userNote));
    const analysisId = newAnalysisId();
    addHistory(analysisId, result.symbol, result.finalConclusion);
    json(res, 200, { success: true, analysisId, result });
  }
}

async function handleSymbol(req: any, res: any): Promise<void> {
  const parsed = analyzeSymbolRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    json(res, 422, { success: false, detail: parsed.error.flatten() });
    return;
  }
  const payload = parsed.data;

  try {
    let result = await analyzeSymbolInput(payload);
    result.symbol = payload.symbol;
    result.market = payload.market;
    result.currentPrice = payload.currentPrice;
    result = applyFirstPrincipleRules(result);
    const analysisId = newAnalysisId();
    addHistory(analysisId, result.symbol, result.finalConclusion);
    json(res, 200, { success: true, analysisId, result });
  } catch (error) {
    logger.warn("symbol analyze fallback", error);
    let result = buildFallbackFromSymbol(payload);
    result.symbol = payload.symbol;
    result.market = payload.market;
    result.currentPrice = payload.currentPrice;
    result = applyFirstPrincipleRules(result);
    const analysisId = newAnalysisId();
    addHistory(analysisId, result.symbol, result.finalConclusion);
    json(res, 200, { success: true, analysisId, result });
  }
}

function handleHistory(res: any): void {
  json(res, 200, { success: true, items: [...HISTORY].slice(-30).reverse() });
}

export const api = onRequest(
  {
    timeoutSeconds: 120,
    memory: "1GiB",
    invoker: "public",
    secrets: ["OPENAI_API_KEY"],
  },
  (req, res) => {
  corsHandler(req, res, async () => {
    try {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }
      const path = req.path || "/";
      if (path === "/health" && req.method === "GET") {
        json(res, 200, { ok: true });
        return;
      }
      if ((path === "/api/analyze/history" || path === "/analyze/history") && req.method === "GET") {
        handleHistory(res);
        return;
      }
      if ((path === "/api/analyze/symbol" || path === "/analyze/symbol") && req.method === "POST") {
        await handleSymbol(req, res);
        return;
      }
      if ((path === "/api/analyze/chart-image" || path === "/analyze/chart-image") && req.method === "POST") {
        await handleChartImage(req, res);
        return;
      }
      json(res, 404, { success: false, detail: "Not found" });
    } catch (error) {
      logger.error("Unhandled API error", error);
      json(res, 500, { success: false, detail: "서버 처리 중 오류가 발생했습니다." });
    }
  });
});
