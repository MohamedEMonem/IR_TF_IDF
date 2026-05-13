from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(frozen=True)
class MatchedTerm:
    term: str
    doc_tf: float
    doc_idf: float
    doc_tfidf: float
    query_tf: float
    query_idf: float
    query_tfidf: float


@dataclass(frozen=True)
class RankedDocument:
    doc_id: int
    path: str
    name: str
    score: float
    doc_length: int
    doc_norm: float
    snippet: str
    matched_terms: List[str]
    matched_details: List[MatchedTerm] = field(default_factory=list)


@dataclass(frozen=True)
class RankResponse:
    query: Dict[str, object]
    corpus: Dict[str, object]
    results: List[RankedDocument]
    rank_time_ms: float
