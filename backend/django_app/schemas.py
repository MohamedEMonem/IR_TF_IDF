from __future__ import annotations

from dataclasses import asdict
from typing import Any, Dict

from backend.src.model import RankResponse

def serialize_rank_response(payload: RankResponse) -> Dict[str, Any]:
    return {
        "query": payload.query,
        "corpus": payload.corpus,
        "results": [asdict(result) for result in payload.results],
        "rank_time_ms": payload.rank_time_ms,
    }
