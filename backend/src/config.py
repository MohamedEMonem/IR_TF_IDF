from __future__ import annotations

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
CORPUS_DIR = BASE_DIR / "corpus"
CACHE_FILE_PATH = BASE_DIR / "corpus" / ".index_cache.pkl"
COCA_DIR = CORPUS_DIR / "coca"
WIKI_FILE = CORPUS_DIR / "wiki" / "text.txt"
UPLOADS_DIR = CORPUS_DIR / "uploads"
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000
