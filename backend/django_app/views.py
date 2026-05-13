from __future__ import annotations

import json

from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from backend.src.constants import DEFAULT_TOP_K
from backend.src.service import CorpusManager, Ranker
from backend.src.api.schemas import serialize_rank_response

CORPUS_MANAGER = CorpusManager()
RANKER = Ranker(CORPUS_MANAGER)


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
