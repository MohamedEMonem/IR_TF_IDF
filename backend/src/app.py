from __future__ import annotations

from http.server import ThreadingHTTPServer

from .config import DEFAULT_HOST, DEFAULT_PORT
from .api.routes import RankRequestHandler
from .service import CorpusManager, Ranker


def create_app(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> ThreadingHTTPServer:
    corpus_manager = CorpusManager()
    RankRequestHandler.ranker = Ranker(corpus_manager)
    return ThreadingHTTPServer((host, port), RankRequestHandler)


def run_server(host: str = DEFAULT_HOST, port: int = DEFAULT_PORT) -> None:
    server = create_app(host=host, port=port)
    print(f"TF-IDF backend listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down backend...")
    finally:
        server.server_close()
