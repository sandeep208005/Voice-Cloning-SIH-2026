import os
import uuid
import re
from typing import Tuple, Optional
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# Magic byte signatures for true MIME validation
MAGIC_SIGNATURES = {
    # Images
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"RIFF": "riff_container",  # Can be WEBP or WAV
    # Audio
    b"ID3": "audio/mpeg",
    b"\xff\xfb": "audio/mpeg",
    b"\xff\xf3": "audio/mpeg",
    b"\xff\xf2": "audio/mpeg",
    b"fLaC": "audio/flac",
    b"OggS": "audio/ogg",
    # Video
    b"\x1aE\xdf\xa3": "video/webm",  # Matroska / WebM
}


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent directory traversal or unsafe characters."""
    base = os.path.basename(filename)
    clean = re.sub(r"[^a-zA-Z0-9_.-]", "_", base)
    return clean[:100]


def detect_mime_from_buffer(header: bytes) -> Optional[str]:
    """Inspect the first bytes of a file to verify true file format."""
    if len(header) < 4:
        return None

    # Text / Web / Executable detection to prevent spoofing
    if header.startswith((b"<!", b"<h", b"<?", b"<s", b"<b")):
        return "text/html"
    if header.startswith(b"MZ"):
        return "application/x-dosexec"
    if header.startswith(b"PK"):
        return "application/zip"
    if header.startswith(b"{") or header.startswith(b"["):
        return "application/json"

    # Check RIFF container subtypes
    if header.startswith(b"RIFF") and len(header) >= 12:
        subtype = header[8:12]
        if subtype == b"WAVE":
            return "audio/wav"
        if subtype == b"WEBP":
            return "image/webp"

    # Check MP4 / MOV containers
    if len(header) >= 8 and header[4:8] == b"ftyp":
        brand = header[8:12]
        if brand in [b"isom", b"iso2", b"mp41", b"mp42", b"avc1"]:
            return "video/mp4"
        if brand in [b"qt  "]:
            return "video/quicktime"
        return "video/mp4"

    for sig, mime in MAGIC_SIGNATURES.items():
        if header.startswith(sig):
            return mime

    return None


async def validate_and_save_upload(
    file: UploadFile,
    expected_media_type: str,
) -> Tuple[str, str, int, str]:
    """
    Validates file format, magic bytes, and size, then saves securely to disk.
    Returns: (stored_filename, safe_original_name, file_size_bytes, validated_mime)
    """
    safe_original_name = sanitize_filename(file.filename or "upload")
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    # Read the initial chunk for magic bytes inspection
    header_chunk = await file.read(64)
    if not header_chunk:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    detected_mime = detect_mime_from_buffer(header_chunk)
    client_mime = file.content_type or ""

    # Check against allowed types
    if expected_media_type == "audio":
        allowed = settings.ALLOWED_AUDIO_MIMES
        # If detected signature is Matroska/WebM container (\x1aE\xdf\xa3), treat it as audio/webm
        if detected_mime in ["video/webm", "video/mp4"]:
            detected_mime = f"audio/{detected_mime.split('/')[1]}"

        is_valid_audio = (
            (detected_mime and detected_mime in allowed)
            or (detected_mime and detected_mime.startswith("audio/"))
            or (client_mime and (client_mime.startswith("audio/") or client_mime in ["video/webm", "video/mp4"]))
        )
        if not is_valid_audio:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid audio format. Detected signature: {detected_mime or client_mime}",
            )
        effective_mime = detected_mime or client_mime or "audio/wav"

    elif expected_media_type == "image":
        allowed = settings.ALLOWED_IMAGE_MIMES
        if detected_mime and detected_mime not in allowed:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid image format. Detected signature: {detected_mime}",
            )
        effective_mime = detected_mime or client_mime or "image/jpeg"

    elif expected_media_type == "video":
        allowed = settings.ALLOWED_VIDEO_MIMES
        if detected_mime and detected_mime not in allowed and not detected_mime.startswith("video/"):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Invalid video format. Detected signature: {detected_mime}",
            )
        effective_mime = detected_mime or client_mime or "video/mp4"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown media type {expected_media_type}",
        )

    # Generate unique stored filename
    ext = os.path.splitext(safe_original_name)[1].lower()
    if not ext:
        ext_map = {
            "audio/wav": ".wav",
            "audio/mpeg": ".mp3",
            "audio/flac": ".flac",
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "video/mp4": ".mp4",
            "video/webm": ".webm",
        }
        ext = ext_map.get(effective_mime, ".bin")

    unique_id = str(uuid.uuid4())
    stored_filename = f"{unique_id}{ext}"
    target_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    total_bytes = len(header_chunk)
    with open(target_path, "wb") as dest:
        dest.write(header_chunk)
        while True:
            chunk = await file.read(1024 * 1024)  # 1MB chunks
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                dest.close()
                if os.path.exists(target_path):
                    os.remove(target_path)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
                )
            dest.write(chunk)

    return stored_filename, safe_original_name, total_bytes, effective_mime


def delete_stored_file(stored_filename: str) -> bool:
    """Remove stored file from disk securely."""
    try:
        path = os.path.join(settings.STORAGE_DIR, stored_filename)
        if os.path.exists(path):
            os.remove(path)
            return True
    except Exception:
        pass
    return False
