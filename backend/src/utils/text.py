from __future__ import annotations

from typing import Iterable, List


def build_snippet(text: str, query_terms: Iterable[str], fallback_length: int = 220) -> str:
    lowered = text.lower()
    for term in query_terms:
        index = lowered.find(term)
        if index != -1:
            start = max(index - 80, 0)
            end = min(index + 140, len(text))
            return text[start:end].replace("\n", " ").strip()

    return " ".join(text.split())[:fallback_length]
