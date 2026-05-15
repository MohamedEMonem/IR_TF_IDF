from __future__ import annotations

import math
from collections import Counter
from time import perf_counter
from typing import Dict, List

from ..constants import DEFAULT_TOP_K
from ..model import MatchedTerm, QueryAnalysis, RankedDocument, RankResponse
from ..utils.text import build_snippet
from ..utils.tokenizer import tokenize
from ..utils.vector import compute_tf, cosine_similarity, vector_norm
from .corpus_manager import CorpusManager


class Ranker:
    def __init__(self, corpus_manager: CorpusManager) -> None:
        self._corpus_manager = corpus_manager

    def explain_query(self, query: str) -> QueryAnalysis:
        tokens = tokenize(query)
        counts = Counter(tokens)
        tf = compute_tf(dict(counts), len(tokens))
        idf = self._corpus_manager.get_idf()
        vector = {term: tf_value * idf.get(term, 0.0) for term, tf_value in tf.items()}
        norm = vector_norm(vector)

        details = []
        total_docs = len(self._corpus_manager.get_documents())
        for term in sorted(counts):
            df = self._corpus_manager.get_document_frequency().get(term, 0)
            term_idf = idf.get(term, math.log((1 + total_docs) / 1) + 1.0)
            term_tf = tf.get(term, 0.0)
            details.append(
                {
                    "term": term,
                    "count": counts[term],
                    "tf": term_tf,
                    "df": df,
                    "idf": term_idf,
                    "tfidf": term_tf * term_idf,
                }
            )

        return QueryAnalysis(
            query=query,
            tokens=tokens,
            term_counts=dict(counts),
            tf=tf,
            vector=vector,
            norm=norm,
            details=details,
        )

    def rank(self, query: str, top_k: int = DEFAULT_TOP_K) -> RankResponse:
        started_at = perf_counter()
        query_info = self.explain_query(query)
        query_vector = query_info.vector
        
        # 1. OPTIMIZATION: Convert to set once for fast lookups
        query_terms_set = set(query_info.tokens) 
        idf = self._corpus_manager.get_idf()

        ranked_documents: List[RankedDocument] = []
        for entry in self._corpus_manager.get_indexed_documents():
            document = entry["document"]
            
            # 2. OPTIMIZATION: Find matched terms BEFORE doing heavy math
            matched_terms_set = query_terms_set.intersection(document.term_counts)
            
            # 3. BIGGEST FIX: If the document doesn't have the word, SKIP IT completely!
            if not matched_terms_set:
                continue 
                
            # If it passed the check, now we do the heavy calculations
            matched_terms = sorted(matched_terms_set)
            score = cosine_similarity(query_vector, entry["vector"])
            
            matched_details = [
                MatchedTerm(
                    term=term,
                    doc_tf=entry["tf"].get(term, 0.0),
                    doc_idf=idf.get(term, 0.0),
                    doc_tfidf=entry["vector"].get(term, 0.0),
                    query_tf=query_info.tf.get(term, 0.0),
                    query_idf=idf.get(term, 0.0),
                    query_tfidf=query_vector.get(term, 0.0),
                )
                for term in matched_terms
            ]

            ranked_documents.append(
                RankedDocument(
                    doc_id=document.doc_id,
                    path=document.path,
                    name=document.name,
                    score=score,
                    doc_length=document.length,
                    doc_norm=entry["norm"],
                    snippet=build_snippet(document.text, list(query_terms_set)),
                    matched_terms=matched_terms,
                    matched_details=matched_details,
                )
            )

        ranked_documents.sort(key=lambda item: item.score, reverse=True)
        return RankResponse(
            query={
                "query": query_info.query,
                "tokens": query_info.tokens,
                "term_counts": query_info.term_counts,
                "tf": query_info.tf,
                "vector": query_info.vector,
                "norm": query_info.norm,
                "details": query_info.details,
            },
            corpus={
                "total_documents": len(self._corpus_manager.get_documents()),
                "unique_terms": len(idf),
                "top_k": top_k,
            },
            results=ranked_documents[:top_k],
            rank_time_ms=(perf_counter() - started_at) * 1000.0,
        )

    def get_metadata(self) -> Dict[str, object]:
        return self._corpus_manager.get_metadata()
