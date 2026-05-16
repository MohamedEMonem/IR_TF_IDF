from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class QueryAnalysis:
    query: str
    tokens: List[str]
    term_counts: Dict[str, int]
    tf: Dict[str, float]
    vector: Dict[str, float]
    norm: float
    details: List[Dict[str, float | int | str]]
