from __future__ import annotations

import json
import threading
from pathlib import Path
from uuid import uuid4

from django.core.files.uploadedfile import UploadedFile
from django.http import HttpRequest, JsonResponse, FileResponse, Http404
from django.utils.text import get_valid_filename
from django.views.decorators.csrf import csrf_exempt

from .schemas import serialize_rank_response
from backend.src.config import UPLOADS_DIR, CORPUS_DIR
from backend.src.constants import DEFAULT_TOP_K
from backend.src.service import CorpusManager, Ranker


CORPUS_MANAGER = CorpusManager()
RANKER = Ranker(CORPUS_MANAGER)
ALLOWED_UPLOAD_EXTENSIONS = {".txt", ".pdf"}


def _success(message: str, data: dict, path: str) -> JsonResponse:
    """Helper method to format successful JSON responses consistently."""
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
    """Helper method to format error JSON responses consistently."""
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
    """
    [GET] /api/health/
    
    Input: None
    
    Output (JSON):
    - 200 OK: Simple status check {"status": "ok"}
    """
    if request.method != "GET":
        return _failure("Method not allowed", request.path, status=405)
    return _success("ok", {"status": "ok"}, request.path)


def status_view(request: HttpRequest) -> JsonResponse:
    """
    [GET] /api/status/
    
    Input: None
    
    Output (JSON):
    - 200 OK: Returns background processing status (is_indexing: bool)
    """
    if request.method != "GET":
        return _failure("Method not allowed", request.path, status=405)

    is_indexing = CORPUS_MANAGER.is_indexing
    
    return _success(
        "System status retrieved", 
        {
            "is_indexing": is_indexing,
            "status": "indexing" if is_indexing else "ready"
        }, 
        request.path
    )


def meta_view(request: HttpRequest) -> JsonResponse:
    """
    [GET] /api/meta/
    
    Input: None
    
    Output (JSON):
    - 200 OK: Returns corpus metadata (total_documents, unique_terms, etc.)
    """
    if request.method != "GET":
        return _failure("Method not allowed", request.path, status=405)
    return _success("Corpus metadata", CORPUS_MANAGER.get_metadata(), request.path)


def document_view(request: HttpRequest, doc_id: int):
    """
    [GET] /api/document/<doc_id>/
    
    Input (URL Path Parameter):
    - doc_id (int): The ID of the document to retrieve.
    
    Output:
    - PDF Files: FileResponse streaming the binary file (application/pdf).
    - Text Files: JSON response containing {doc_id, name, path, text}.
    - 404 Not Found: If document does not exist in the index or on disk.
    """
    if request.method != "GET":
        return _failure("Method not allowed", request.path, status=405)

    doc = next((d for d in CORPUS_MANAGER.get_documents() if d.doc_id == doc_id), None)
    if not doc:
        raise Http404("Document not found in the index.")

    # 1. If it's a PDF, stream it from the hard drive
    if doc.path.lower().endswith('.pdf'):
        file_path = CORPUS_DIR.parent / doc.path 
        
        if not file_path.exists():
            raise Http404(f"PDF file not found on disk at {file_path}")
            
        return FileResponse(file_path.open('rb'), content_type='application/pdf')
    
    # 2. If it's text, return the raw data as JSON so frontend can render it
    else:
        payload = {
            "doc_id": doc.doc_id,
            "name": doc.name,
            "path": doc.path,
            "text": doc.text
        }
        return _success("Document retrieved", payload, request.path)


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
    """
    [POST] /api/upload/
    
    Input (Multipart/Form-Data):
    - files: One or multiple files (.txt or .pdf).
    
    Output (JSON):
    - 200 OK: Successfully saved files, starts background indexing.
    - 400 Bad Request: Missing files or unsupported format.
    - 500 Internal Server Error: Failed to save to disk.
    """
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

    # Start indexing in the background
    indexing_thread = threading.Thread(
        target=CORPUS_MANAGER.refresh, 
        kwargs={"force_rebuild": False},
    )
    indexing_thread.start()

    # Immediately return success to the frontend
    return _success(
        "Files uploaded successfully! Indexing is running in the background.",
        {
            "saved_files": saved_files,
            "corpus": "Update in progress... check /api/status to monitor progress."
        },
        request.path,
    )


@csrf_exempt
def rank_view(request: HttpRequest) -> JsonResponse:
    """
    [POST] /api/rank/
    
    Input (JSON Body):
    - query (str): The search phrase (Required).
    - top_k (int): Number of top results to return (Optional, defaults to 5).
    
    Output (JSON):
    - 200 OK: Ranked results list, snippets, matched terms, and query vectors.
    - 400 Bad Request: Invalid JSON body or empty query.
    """
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