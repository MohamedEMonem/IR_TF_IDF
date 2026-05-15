from __future__ import annotations

import json
from pathlib import Path
from uuid import uuid4
import threading

from django.core.files.uploadedfile import UploadedFile
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.text import get_valid_filename

from backend.src.api.schemas import serialize_rank_response
from backend.src.config import UPLOADS_DIR, CORPUS_DIR
from backend.src.constants import DEFAULT_TOP_K
from backend.src.service import CorpusManager, Ranker

from django.http import FileResponse, Http404
from backend.src.config import BASE_DIR
from django.http import FileResponse, HttpResponse, Http404


CORPUS_MANAGER = CorpusManager()
RANKER = Ranker(CORPUS_MANAGER)
ALLOWED_UPLOAD_EXTENSIONS = {".txt", ".pdf"}


def document_view(request, doc_id: int):
    """Streams PDFs or returns specific text document contents as JSON."""
    if request.method != "GET":
        return _failure("Method not allowed", request.path, status=405)

    doc = next((d for d in CORPUS_MANAGER.get_documents() if d.doc_id == doc_id), None)
    if not doc:
        raise Http404("Document not found in the index.")

    # 1. If it's a PDF, stream it from the hard drive
    # (We still return FileResponse here because PDFs are binary files, not text)
    if doc.path.lower().endswith('.pdf'):
        file_path = CORPUS_DIR.parent / doc.path 
        
        if not file_path.exists():
            raise Http404(f"PDF file not found on disk at {file_path}")
            
        return FileResponse(file_path.open('rb'), content_type='application/pdf')
    
    # 2. If it's text, return the raw data as JSON so your frontend can render it!
    else:
        payload = {
            "doc_id": doc.doc_id,
            "name": doc.name,
            "path": doc.path,
            "text": doc.text
        }
        return _success("Document retrieved", payload, request.path)

def _success(message: str, data: dict, path: str) -> JsonResponse:
    return JsonResponse(
        {
            "success": True,
            "message": message,
            "data": data,
            "error": None,
            "meta": {"path": path},
        },
        status=200,
    )


def _failure(message: str, path: str, status: int = 400) -> JsonResponse:
    return JsonResponse(
        {
            "success": False,
            "message": message,
            "data": None,
            "error": {"message": message},
            "meta": {"path": path},
        },
        status=status,
    )


def health_view(request: HttpRequest) -> JsonResponse:
    return _success("ok", {"status": "ok"}, request.path)


def meta_view(request: HttpRequest) -> JsonResponse:
    return _success("Corpus metadata", CORPUS_MANAGER.get_metadata(), request.path)


def _save_uploaded_file(uploaded_file: UploadedFile) -> dict:
    original_name = get_valid_filename(Path(uploaded_file.name).name)
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_UPLOAD_EXTENSIONS:
        raise ValueError("Only .txt and .pdf files are supported")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    target_name = f"{Path(original_name).stem}-{uuid4().hex}{suffix}"
    target_path = UPLOADS_DIR / target_name

    with target_path.open("wb") as target_file:
        for chunk in uploaded_file.chunks():
            target_file.write(chunk)

    return {
        "name": original_name,
        "stored_name": target_name,
        "path": target_path.relative_to(UPLOADS_DIR.parent).as_posix(),
        "size": uploaded_file.size,
    }


@csrf_exempt
def upload_view(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return _failure("Method not allowed", request.path, status=405)

    uploads = request.FILES.getlist("files") or request.FILES.getlist("file")
    if not uploads:
        return _failure("At least one file is required", request.path, status=400)

    saved_files = []
    try:
        for uploaded_file in uploads:
            saved_files.append(_save_uploaded_file(uploaded_file))
    except ValueError as exc:
        return _failure(str(exc), request.path, status=400)
    except OSError as exc:
        return _failure(f"Failed to save uploaded file: {str(exc)}", request.path, status=500)

    # --- THE FIX: Start indexing in the background! ---
    indexing_thread = threading.Thread(
        target=CORPUS_MANAGER.refresh, 
        kwargs={"force_rebuild": True}
    )
    indexing_thread.start()

    # Immediately return success to the frontend without waiting for the thread to finish
    return _success(
        "Files uploaded successfully! Indexing is running in the background.",
        {
            "saved_files": saved_files,
            "corpus": "Update in progress... check /api/meta in a few seconds."
        },
        request.path,
    )


@csrf_exempt
def rank_view(request: HttpRequest) -> JsonResponse:
    if request.method != "POST":
        return _failure("Method not allowed", request.path, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return _failure("Invalid JSON body", request.path, status=400)

    query = str(payload.get("query", "")).strip()
    top_k = int(payload.get("top_k", DEFAULT_TOP_K))
    if not query:
        return _failure("Query is required", request.path, status=400)

    result = serialize_rank_response(RANKER.rank(query, top_k=top_k))
    return _success("Ranked results", result, request.path)
