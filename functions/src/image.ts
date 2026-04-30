export const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateUploadImage(filename: string, data: Buffer): void {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("지원하지 않는 이미지 형식입니다. PNG/JPG/JPEG/WEBP만 업로드해주세요.");
  }
  if (data.length > MAX_IMAGE_BYTES) {
    throw new Error("이미지 용량은 10MB 이하여야 합니다.");
  }
}
