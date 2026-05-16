from __future__ import annotations

from typing import Iterable, List


def build_snippet(text: str, query_terms: Iterable[str], fallback_length: int = 220) -> str:
    lowered = text.lower()
    for term in query_terms:
        index = lowered.find(term)
        if index != -1:
            start = max(index - 80, 0)
            end = min(index + 140, len(text))
            snippet = text[start:end].replace("\n", " ").strip()
            
            # Add ellipsis to indicate truncation
            if start > 0:
                snippet = "..." + snippet
            if end < len(text):
                snippet = snippet + "..."
            
            return snippet

    # Fallback: return first 220 chars with ellipsis if truncated
    full_text = " ".join(text.split())
    fallback_snippet = full_text[:fallback_length]
    if len(full_text) > fallback_length:
        fallback_snippet = fallback_snippet + "..."
    return fallback_snippet
