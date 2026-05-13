from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class DocumentRecord:
    doc_id: int
    path: str
    name: str
    text: str
    tokens: List[str]
    term_counts: Dict[str, int]
    length: int
