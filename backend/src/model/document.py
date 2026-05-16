from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List

# Add slots=True to prevent Python from creating dynamic dictionaries per document
@dataclass(frozen=True, slots=True)
class DocumentRecord:
    doc_id: int
    path: str
    name: str
    text: str
    term_counts: Dict[str, int]
    length: int