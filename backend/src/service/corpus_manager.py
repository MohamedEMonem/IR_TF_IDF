from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List

from ..config import COCA_DIR, WIKI_FILE
from ..model import DocumentRecord
from ..utils.tokenizer import tokenize
from ..utils.vector import compute_idf, compute_tf, vector_norm


class CorpusManager:
    def __init__(self) -> None:
        self._documents = self._load_documents()
        self._document_frequency = self._compute_document_frequency(self._documents)
        self._idf = compute_idf(self._document_frequency, len(self._documents))
        self._vectors = self._build_vectors(self._documents, self._idf)

    @staticmethod
    def _load_text_paths() -> List[Path]:
        paths: List[Path] = []
        if COCA_DIR.exists():
            paths.extend(sorted(COCA_DIR.glob("*.txt")))
        if WIKI_FILE.exists():
            paths.append(WIKI_FILE)
        return paths

    def _load_documents(self) -> List[DocumentRecord]:
        records: List[DocumentRecord] = []
        for doc_id, path in enumerate(self._load_text_paths(), start=1):
            try:
                text = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue

            tokens = tokenize(text)
            term_counts = dict(Counter(tokens))
            records.append(
                DocumentRecord(
                    doc_id=doc_id,
                    path=path.relative_to(Path(__file__).resolve().parents[3]).as_posix(),
                    name=path.name,
                    text=text,
                    tokens=tokens,
                    term_counts=term_counts,
                    length=len(tokens),
                )
            )
        return records

    @staticmethod
    def _compute_document_frequency(documents: List[DocumentRecord]) -> Dict[str, int]:
        df = defaultdict(int)
        for document in documents:
            for term in set(document.term_counts):
                df[term] += 1
        return dict(df)

    @staticmethod
    def _build_vectors(documents: List[DocumentRecord], idf: Dict[str, float]) -> List[Dict[str, object]]:
        indexed_documents: List[Dict[str, object]] = []
        for document in documents:
            tf = compute_tf(document.term_counts, document.length)
            vector = {term: tf_value * idf.get(term, 0.0) for term, tf_value in tf.items()}
            indexed_documents.append(
                {
                    "document": document,
                    "vector": vector,
                    "norm": vector_norm(vector),
                    "tf": tf,
                }
            )
        return indexed_documents

    def get_documents(self) -> List[DocumentRecord]:
        return self._documents

    def get_document_frequency(self) -> Dict[str, int]:
        return self._document_frequency

    def get_idf(self) -> Dict[str, float]:
        return self._idf

    def get_indexed_documents(self) -> List[Dict[str, object]]:
        return self._vectors

    def get_metadata(self) -> Dict[str, object]:
        return {
            "total_documents": len(self._documents),
            "unique_terms": len(self._idf),
            "document_frequency": self._document_frequency,
            "idf": self._idf,
        }
