from __future__ import annotations

import sys
from collections import Counter, defaultdict
from pathlib import Path
from threading import RLock
from typing import Dict, List
import gc  
from ..config import CORPUS_DIR
from ..model import DocumentRecord
from ..utils.pdf import extract_pdf_text
from ..utils.tokenizer import tokenize
from ..utils.vector import compute_idf, compute_tf, vector_norm
import hashlib
import pickle
from collections import Counter, defaultdict

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
    
    @staticmethod
    def _stream_articles(path: Path):
        """Yields articles one by one to keep RAM usage near zero."""
        if path.suffix.lower() == '.pdf':
            # PDFs must still be extracted all at once
            text = extract_pdf_text(path).strip()
            if text:
                yield text
            return

        # For massive text files, read line-by-line!
        with path.open('r', encoding='utf-8', errors='ignore') as f:
            current_article = []
            for line in f:
                # If we hit a new @@ tag, yield the completed article
                if line.startswith('@@') and current_article:
                    yield "".join(current_article).strip()
                    current_article = [line]
                else:
                    current_article.append(line)
            
            # Yield the final article at the end of the file
            if current_article:
                yield "".join(current_article).strip()


    def _load_documents(self) -> List[DocumentRecord]:
        records: List[DocumentRecord] = []
        doc_id_counter = 1

        for path in self._load_text_paths():
            for article_text in self._stream_articles(path):
                if not article_text:
                    continue

                # MEMORY SAVER: sys.intern() forces Python to share memory for identical 
                # words instead of creating hundreds of thousands of duplicate strings.
                tokens = [sys.intern(t) for t in tokenize(article_text)]
                
                if not tokens:
                    continue
                    
                term_counts = dict(Counter(tokens))
                length = len(tokens)
                
                # Nuke the temporary list from RAM
                del tokens 

                records.append(
                    DocumentRecord(
                        doc_id=doc_id_counter,
                        path=path.relative_to(Path(__file__).resolve().parents[3]).as_posix(),
                        name=f"{path.name} (Article {doc_id_counter})",
                        text=article_text,
                        term_counts=term_counts,
                        length=length,
                    )
                )
                
                # CPU FIX: Removed gc.collect() entirely!
                doc_id_counter += 1

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

    def _generate_fingerprint(self) -> str:
        """Generates a unique hash based on corpus file names and sizes."""
        hasher = hashlib.sha256()
        for path in self._load_text_paths():
            try:
                stat = path.stat()
                fingerprint_str = f"{path.name}-{stat.st_size}"
                hasher.update(fingerprint_str.encode("utf-8"))
            except OSError:
                continue
        return hasher.hexdigest()

    def refresh(self, force_rebuild: bool = False) -> None:
        """Loads from cache if valid, otherwise rebuilds the index and saves it."""
        # Moving the cache file one level up to avoid triggering Django's file watcher repeatedly
        cache_file = CORPUS_DIR.parent / ".index_cache.pkl"

        with self._lock:
            current_fingerprint = self._generate_fingerprint()

            # 1. Attempt to load from disk cache
            if not force_rebuild and cache_file.exists():
                try:
                    with cache_file.open("rb") as f:
                        cache_data = pickle.load(f)
                    
                    if cache_data.get("fingerprint") == current_fingerprint:
                        self._documents = cache_data["documents"]
                        self._document_frequency = cache_data["document_frequency"]
                        self._idf = cache_data["idf"]
                        self._vectors = cache_data["vectors"]
                        print("✅ Loaded corpus index instantly from cache.")
                        return  # Exit early, cache hit!
                    else:
                        print(f"⚠️ Cache invalidated. Fingerprint mismatch.")
                        print(f"   Old: {cache_data.get('fingerprint')}")
                        print(f"   New: {current_fingerprint}")
                except Exception as e:
                    # Catching ALL exceptions here so we don't swallow import/pickle errors silently
                    print(f"⚠️ Failed to read cache file: {repr(e)}")

            # 2. Cache miss or forced rebuild: build from scratch
            print("⏳ Building corpus index from scratch (This will take a moment)...")
            documents = self._load_documents()
            document_frequency = self._compute_document_frequency(documents)
            idf = compute_idf(document_frequency, len(documents))
            vectors = self._build_vectors(documents, idf)

            self._documents = documents
            self._document_frequency = document_frequency
            self._idf = idf
            self._vectors = vectors

            # 3. Serialize and save the new cache to disk
            try:
                with cache_file.open("wb") as f:
                    pickle.dump({
                        "fingerprint": current_fingerprint,
                        "documents": self._documents,
                        "document_frequency": self._document_frequency,
                        "idf": self._idf,
                        "vectors": self._vectors,
                    }, f, protocol=pickle.HIGHEST_PROTOCOL)
                print("💾 Saved new corpus index to cache.")
            except OSError as e:
                print(f"❌ Warning: Failed to write cache to disk: {e}")
                
                
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
