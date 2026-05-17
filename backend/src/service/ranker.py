from __future__ import annotations

import math
from collections import Counter
from time import perf_counter
from typing import Dict, List

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

    def rank(self, query: str, page: int = 1, page_size: int = 10) -> RankResponse:
        query_info = self.explain_query(query)
        query_vector = query_info.vector
        
        started_at = perf_counter()
        
        query_terms_set = set(query_info.tokens) 
        query_terms_list = list(query_terms_set)
        idf = self._corpus_manager.get_idf()
        inverted_index = self._corpus_manager.get_inverted_index()

        term_cache = {
            term: query_vector.get(term, 0.0) * idf.get(term, 0.0)
            for term in query_terms_set
        }

        # 1. Grab ONLY the matched documents instantly
        matching_doc_indices = set()
        for term in query_terms_set:
            matching_doc_indices.update(inverted_index.get(term, set()))

        all_indexed = self._corpus_manager.get_indexed_documents()
        raw_scored_docs = []

        # 2. FAST LOOP: Only do Math (No string snippets!)
        for idx in matching_doc_indices:
            entry = all_indexed[idx]
            document = entry["document"]
            
            matched_terms_set = query_terms_set.intersection(document.term_counts)
            if not matched_terms_set:
                continue 
                
            dot_product = 0.0
            doc_length = document.length
            
            for term in matched_terms_set:
                doc_tf = document.term_counts[term] / doc_length
                dot_product += doc_tf * term_cache[term]

            doc_norm = entry["norm"]
            score = dot_product / (query_info.norm * doc_norm) if query_info.norm and doc_norm else 0.0

            raw_scored_docs.append((score, document, doc_norm, matched_terms_set))

        # 3. Sort ONLY the lightweight math results
        raw_scored_docs.sort(key=lambda item: item[0], reverse=True)
        
        total_matches = len(raw_scored_docs)
        total_pages = math.ceil(total_matches / page_size) if total_matches > 0 else 1
        
        if page > total_pages:
            page = total_pages
            
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_raw = raw_scored_docs[start_idx:end_idx]

        # 4. POST-PROCESSING: Build text snippets ONLY for the 10 shown results
        final_results = []
        for score, document, doc_norm, matched_terms_set in paginated_raw:
            matched_terms = sorted(matched_terms_set)
            matched_details = []
            
            for term in matched_terms:
                doc_tf = document.term_counts[term] / document.length
                doc_idf = idf.get(term, 0.0)
                
                matched_details.append(
                    MatchedTerm(
                        term=term, 
                        doc_tf=doc_tf, 
                        doc_idf=doc_idf, 
                        doc_tfidf=doc_tf * doc_idf,
                        query_tf=query_info.tf.get(term, 0.0), 
                        query_idf=doc_idf, 
                        query_tfidf=query_vector.get(term, 0.0),
                    )
                )

            final_results.append(
                RankedDocument(
                    doc_id=document.doc_id,
                    path=document.path,
                    name=document.name,
                    score=score,
                    doc_length=document.length,
                    doc_norm=doc_norm,
                    snippet=build_snippet(document.text, query_terms_list),
                    matched_terms=matched_terms,
                    matched_details=matched_details,
                )
            )

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
            },
            pagination={
                "page": page,
                "page_size": page_size,
                "total_matches": total_matches,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
            results=final_results,
            rank_time_ms=(perf_counter() - started_at) * 1000.0,
        )