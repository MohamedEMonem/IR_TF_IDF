from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler

from ..constants import DEFAULT_TOP_K
from ..service import Ranker
from .schemas import serialize_rank_response


class RankRequestHandler(BaseHTTPRequestHandler):
    ranker: Ranker | None = None

    def _set_headers(self, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self) -> None:
        self._set_headers(204)

    def do_GET(self) -> None:
        if self.path.rstrip("/") == "/health":
            self._set_headers(200)
            self.wfile.write(json.dumps(self._success("ok", {"status": "ok"})).encode("utf-8"))
            return

        if self.path.rstrip("/") == "/meta":
            self._set_headers(200)
            self.wfile.write(json.dumps(self._success("Corpus metadata", self.ranker.get_metadata())).encode("utf-8"))
            return

        self._set_headers(404)
        self.wfile.write(json.dumps(self._failure("Not found")).encode("utf-8"))

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/rank":
            self._set_headers(404)
            self.wfile.write(json.dumps(self._failure("Not found")).encode("utf-8"))
            return

        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8", errors="ignore")
        try:
            request_data = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps(self._failure("Invalid JSON body")).encode("utf-8"))
            return

        query = str(request_data.get("query", "")).strip()
        top_k = int(request_data.get("top_k", DEFAULT_TOP_K))
        if not query:
            self._set_headers(400)
            self.wfile.write(json.dumps(self._failure("Query is required")).encode("utf-8"))
            return

        payload = serialize_rank_response(self.ranker.rank(query, top_k=top_k))
        self._set_headers(200)
        self.wfile.write(json.dumps(self._success("Ranked results", payload)).encode("utf-8"))

    def _success(self, message: str, data: dict) -> dict:
        return {
            "success": True,
            "message": message,
            "data": data,
            "error": None,
            "meta": {"path": self.path},
        }

    def _failure(self, message: str) -> dict:
        return {
            "success": False,
            "message": message,
            "data": None,
            "error": {"message": message},
            "meta": {"path": self.path},
        }

    def log_message(self, format: str, *args: object) -> None:
        return
