from __future__ import annotations

import math
from typing import Dict


def compute_tf(term_counts: Dict[str, int], length: int) -> Dict[str, float]:
    if length <= 0:
        return {}
    return {term: count / length for term, count in term_counts.items()}


def compute_idf(document_frequency: Dict[str, int], total_docs: int) -> Dict[str, float]:
    return {
        term: math.log((1 + total_docs) / (1 + frequency)) + 1.0
        for term, frequency in document_frequency.items()
    }


def vector_norm(vector: Dict[str, float]) -> float:
    return math.sqrt(sum(weight * weight for weight in vector.values()))


def dot_product(left: Dict[str, float], right: Dict[str, float]) -> float:
    if len(left) > len(right):
        left, right = right, left
    return sum(weight * right.get(term, 0.0) for term, weight in left.items())


def cosine_similarity(left: Dict[str, float], right: Dict[str, float]) -> float:
    left_norm = vector_norm(left)
    right_norm = vector_norm(right)
    if left_norm == 0.0 or right_norm == 0.0:
        return 0.0
    return dot_product(left, right) / (left_norm * right_norm)
