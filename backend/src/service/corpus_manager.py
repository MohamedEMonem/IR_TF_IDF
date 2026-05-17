from __future__ import annotations

import sys
import pickle
import hashlib
from collections import Counter, defaultdict
from pathlib import Path
from threading import RLock
from typing import Dict, List, Set

from ..config import CORPUS_DIR
from ..model import DocumentRecord
from ..utils.pdf import extract_pdf_text
from ..utils.tokenizer import tokenize
from ..utils.vector import compute_idf, compute_tf, vector_norm


class CorpusManager:
    def __init__(self) -> None:
        self._lock = RLock()        
        self._indexing_lock = RLock() 
        self.is_indexing = False
        self._documents: List[DocumentRecord] = []
        self._document_frequency: Dict[str, int] = {}
        self._idf: Dict[str, float] = {}
        self._vectors: List[Dict[str, object]] = []
        self._inverted_index: Dict[str, Set[int]] = {}
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
        if path.suffix.lower() == '.pdf':
            text = extract_pdf_text(path).strip()
            if text:
                yield text
            return

        with path.open('r', encoding='utf-8', errors='ignore') as f:
            current_article = []
            for line in f:
                if line.startswith('@@') and current_article:
                    yield "".join(current_article).strip()
                    current_article = [line]
                else:
                    current_article.append(line)
            
            if current_article:
                yield "".join(current_article).strip()

    def _compute_document_frequency(self, documents: List[DocumentRecord]) -> Dict[str, int]:
        df = defaultdict(int)
        for document in documents:
            for term in set(document.term_counts):
                df[term] += 1
        return dict(df)

    def _parse_specific_files(self, paths: List[Path], start_id: int) -> List[DocumentRecord]:
        records: List[DocumentRecord] = []
        doc_id_counter = start_id

        for path in paths:
            for article_text in self._stream_articles(path):
                if not article_text:
                    continue

                tokens = [sys.intern(t) for t in tokenize(article_text)]
                if not tokens:
                    continue
                    
                records.append(
                    DocumentRecord(
                        doc_id=doc_id_counter,
                        path=path.relative_to(Path(__file__).resolve().parents[3]).as_posix(),
                        name=f"{Path(path).name} (Article {doc_id_counter})",
                        text=article_text,
                        term_counts=dict(Counter(tokens)),
                        length=len(tokens),
                    )
                )
                del tokens 
                doc_id_counter += 1
        return records

    def _build_vectors(self, documents: List[DocumentRecord], idf: Dict[str, float]) -> List[Dict[str, object]]:
        indexed_documents: List[Dict[str, object]] = []
        for document in documents:
            tf = compute_tf(document.term_counts, document.length)
            vector = {term: tf_value * idf.get(term, 0.0) for term, tf_value in tf.items()}
            indexed_documents.append(
                {
                    "document": document,
                    "norm": vector_norm(vector), 
                }
            )
        return indexed_documents

    def refresh(self, force_rebuild: bool = False) -> None:
        cache_dir = CORPUS_DIR.parent / "data_cache"
        cache_dir.mkdir(exist_ok=True) 
        cache_file = cache_dir / ".index_cache.pkl"

        with self._indexing_lock:
            self.is_indexing = True 
            
            try:
                current_files = {}
                for path in self._load_text_paths():
                    try:
                        path_str = path.relative_to(Path(__file__).resolve().parents[3]).as_posix()
                        current_files[path_str] = {
                            "path": path, 
                            "mtime": path.stat().st_mtime
                        }
                    except OSError:
                        continue

                cached_documents = []
                cached_registry = {}
                cache_data = {} 
                if not force_rebuild and cache_file.exists():
                    try:
                        with cache_file.open("rb") as f:
                            cache_data = pickle.load(f)
                            cached_documents = cache_data.get("documents", [])
                            cached_registry = cache_data.get("registry", {})
                    except Exception as e:
                        print(f"⚠️ Failed to read cache: {e}. Building fresh.")

                docs_to_keep = []
                paths_to_parse = []
                for doc in cached_documents:
                    if doc.path in current_files:
                        if cached_registry.get(doc.path) == current_files[doc.path]["mtime"]:
                            docs_to_keep.append(doc)

                for path_str, info in current_files.items():
                    if path_str not in cached_registry or cached_registry.get(path_str) != info["mtime"]:
                        paths_to_parse.append(info["path"])

                # Check if we can exit early
                if not paths_to_parse and len(docs_to_keep) == len(cached_documents):
                    print("✅ No corpus changes detected. Loaded index instantly from persistent cache.")
                    
                    inverted_index = cache_data.get("inverted_index")
                    if not inverted_index:
                        print("⚙️ Upgrading old cache: Building Inverted Index...")
                        inverted_index = {}
                        for i, doc in enumerate(cached_documents):
                            for term in doc.term_counts:
                                if term not in inverted_index:
                                    inverted_index[term] = set()
                                inverted_index[term].add(i)
                                
                        # Save the upgraded cache immediately
                        try:
                            with cache_file.open("wb") as f:
                                cache_data["inverted_index"] = inverted_index
                                pickle.dump(cache_data, f, protocol=pickle.HIGHEST_PROTOCOL)
                        except OSError:
                            pass

                    with self._lock:
                        self._documents = cached_documents
                        self._document_frequency = cache_data.get("document_frequency", {})
                        self._idf = cache_data.get("idf", {})
                        self._vectors = cache_data.get("vectors", [])
                        self._inverted_index = inverted_index
                    return

                if paths_to_parse:
                    print(f"⏳ Parsing {len(paths_to_parse)} new or modified files...")
                    new_documents = self._parse_specific_files(paths_to_parse, start_id=len(docs_to_keep) + 1)
                    all_documents = docs_to_keep + new_documents
                else:
                    print("⏳ Files were deleted. Re-indexing remaining files...")
                    all_documents = docs_to_keep

                # Fix IDs bypassing frozen lock
                updated_documents = []
                for i, doc in enumerate(all_documents):
                    new_id = i + 1
                    updated_documents.append(
                        DocumentRecord(
                            doc_id=new_id,
                            path=doc.path,
                            name=f"{Path(doc.path).name} (Article {new_id})",
                            text=doc.text,
                            term_counts=doc.term_counts,
                            length=doc.length,
                        )
                    )
                all_documents = updated_documents

                print("🧮 Recomputing TF-IDF math...")
                document_frequency = self._compute_document_frequency(all_documents)
                idf = compute_idf(document_frequency, len(all_documents))
                vectors = self._build_vectors(all_documents, idf)

                print("⚙️ Building Inverted Index...")
                inverted_index = {}
                for i, doc in enumerate(all_documents):
                    for term in doc.term_counts:
                        if term not in inverted_index:
                            inverted_index[term] = set()
                        inverted_index[term].add(i)

                with self._lock:
                    self._documents = all_documents
                    self._document_frequency = document_frequency
                    self._idf = idf
                    self._vectors = vectors
                    self._inverted_index = inverted_index

                # Save Cache to Disk WITH the Inverted Index
                new_registry = {path_str: info["mtime"] for path_str, info in current_files.items()}
                try:
                    with cache_file.open("wb") as f:
                        pickle.dump({
                            "registry": new_registry,
                            "documents": all_documents,
                            "document_frequency": document_frequency,
                            "idf": idf,
                            "vectors": vectors, 
                            "inverted_index": inverted_index,
                        }, f, protocol=pickle.HIGHEST_PROTOCOL)
                    print("💾 Saved updated index to persistent cache.")
                except OSError as e:
                    print(f"❌ Warning: Failed to write cache to disk: {e}")
                    
            finally:
                self.is_indexing = False
                
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

    def get_inverted_index(self) -> Dict[str, Set[int]]:
        with self._lock:
            return dict(self._inverted_index)

    def get_metadata(self) -> Dict[str, object]:
        with self._lock:
            return {
                "total_documents": len(self._documents),
                "unique_terms": len(self._idf),
                "document_frequency": dict(self._document_frequency),
                "idf": dict(self._idf),
            }