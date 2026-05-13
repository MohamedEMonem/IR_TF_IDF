from __future__ import annotations

from typing import List

from ..constants import STOPWORDS, TOKEN_PATTERN


def tokenize(text: str, remove_stopwords: bool = True) -> List[str]:
    tokens = TOKEN_PATTERN.findall(text.lower())
    if remove_stopwords:
        tokens = [token for token in tokens if token not in STOPWORDS]
    return tokens
