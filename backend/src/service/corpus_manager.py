from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from threading import RLock
from typing import Dict, List

from ..config import CORPUS_DIR
from ..model import DocumentRecord
from ..utils.pdf import extract_pdf_text
from ..utils.tokenizer import tokenize
from ..utils.vector import compute_idf, compute_tf, vector_norm


class CorpusManager:
    def __init__(self) -> None:
        self._lock = RLock()
        self._documents: List[DocumentRecord] = []
        self._document_frequency: Dict[str, int] = {}
        self._idf: Dict[str, float] = {}
        self._vectors: List[Dict[str, object]] = []
        self.refresh()

    @staticmethod
    def _load_text_paths() -> List[Path]:
        if not CORPUS_DIR.exists():
            return []
        return sorted(
            path
            for path in CORPUS_DIR.rglob("*")
            if path.is_file() and path.suffix.lower() in {".txt", ".pdf"}
        )

    @staticmethod
    def _read_document_text(path: Path) -> str:
        if path.suffix.lower() == ".pdf":
            return extract_pdf_text(path)
        return path.read_text(encoding="utf-8", errors="ignore")

    def _load_documents(self) -> List[DocumentRecord]:
        records: List[DocumentRecord] = []
        for doc_id, path in enumerate(self._load_text_paths(), start=1):
            try:
                text = self._read_document_text(path)
            except OSError:
                continue
            except RuntimeError:
                continue

            text = text.strip()
            if not text:
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

    def refresh(self) -> None:
        with self._lock:
            documents = self._load_documents()
            document_frequency = self._compute_document_frequency(documents)
            idf = compute_idf(document_frequency, len(documents))
            vectors = self._build_vectors(documents, idf)

            self._documents = documents
            self._document_frequency = document_frequency
            self._idf = idf
            self._vectors = vectors

    def get_documents(self) -> List[DocumentRecord]:
        with self._lock:
            return list(self._documents)

    def get_document_frequency(self) -> Dict[str, int]:
        with self._lock:
            return dict(self._document_frequency)

    def get_idf(self) -> Dict[str, float]:
        with self._lock:
            return dict(self._idf)

    def get_indexed_documents(self) -> List[Dict[str, object]]:
        with self._lock:
            return [dict(entry) for entry in self._vectors]

    def get_metadata(self) -> Dict[str, object]:
        with self._lock:
            return {
                "total_documents": len(self._documents),
                "unique_terms": len(self._idf),
                "document_frequency": dict(self._document_frequency),
                "idf": dict(self._idf),
            }
