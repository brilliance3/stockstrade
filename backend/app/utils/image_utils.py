from fastapi import UploadFile

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024


def validate_upload_image(file: UploadFile, data: bytes) -> None:
    ext = (file.filename or "").split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("지원하지 않는 이미지 형식입니다. PNG/JPG/JPEG/WEBP만 업로드해주세요.")
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError("이미지 용량은 10MB 이하여야 합니다.")
