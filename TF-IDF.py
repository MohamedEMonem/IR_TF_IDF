from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Dict, Iterable, List


BASE_DIR = Path(__file__).resolve().parent
CORPUS_DIR = BASE_DIR / "corpus"
COCA_DIR = CORPUS_DIR / "coca"
WIKI_FILE = CORPUS_DIR / "wiki" / "text.txt"

TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
DEFAULT_TOP_K = 10

STOPWORDS = {
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"but",
	"by",
	"for",
	"from",
	"had",
	"has",
	"have",
	"he",
	"her",
	"his",
	"i",
	"in",
	"is",
	"it",
	"its",
	"me",
	"my",
	"not",
	"of",
	"on",
	"or",
	"our",
	"she",
	"that",
	"the",
	"their",
	"them",
	"there",
	"they",
	"this",
	"to",
	"was",
	"we",
	"were",
	"with",
	"you",
	"your",
}


@dataclass(frozen=True)
class DocumentRecord:
	doc_id: int
	path: str
	name: str
	text: str
	tokens: List[str]
	term_counts: Dict[str, int]
	length: int


def tokenize(text: str, remove_stopwords: bool = True) -> List[str]:
	tokens = TOKEN_PATTERN.findall(text.lower())
	if remove_stopwords:
		tokens = [token for token in tokens if token not in STOPWORDS]
	return tokens


def load_text_files() -> List[Path]:
	paths: List[Path] = []

	if COCA_DIR.exists():
		paths.extend(sorted(COCA_DIR.glob("*.txt")))

	if WIKI_FILE.exists():
		paths.append(WIKI_FILE)

	return paths


def build_documents() -> List[DocumentRecord]:
	records: List[DocumentRecord] = []
	for doc_id, path in enumerate(load_text_files(), start=1):
		try:
			text = path.read_text(encoding="utf-8", errors="ignore")
		except OSError:
			continue

		tokens = tokenize(text)
		term_counts = Counter(tokens)
		records.append(
			DocumentRecord(
				doc_id=doc_id,
				path=path.relative_to(BASE_DIR).as_posix(),
				name=path.name,
				text=text,
				tokens=tokens,
				term_counts=dict(term_counts),
				length=len(tokens),
			)
		)

	return records


def compute_document_frequency(documents: Iterable[DocumentRecord]) -> Dict[str, int]:
	df = defaultdict(int)
	for document in documents:
		for term in set(document.term_counts):
			df[term] += 1
	return dict(df)


def compute_idf(document_frequency: Dict[str, int], total_docs: int) -> Dict[str, float]:
	return {
		term: math.log((1 + total_docs) / (1 + freq)) + 1.0
		for term, freq in document_frequency.items()
	}


def compute_tf(term_counts: Dict[str, int], length: int) -> Dict[str, float]:
	if length <= 0:
		return {}
	return {term: count / length for term, count in term_counts.items()}


def build_vector(term_counts: Dict[str, int], length: int, idf: Dict[str, float]) -> Dict[str, float]:
	tf = compute_tf(term_counts, length)
	return {term: tf_value * idf.get(term, 0.0) for term, tf_value in tf.items()}


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


def build_snippet(text: str, query_terms: List[str], fallback_length: int = 220) -> str:
	lowered = text.lower()
	for term in query_terms:
		index = lowered.find(term)
		if index != -1:
			start = max(index - 80, 0)
			end = min(index + 140, len(text))
			snippet = text[start:end].replace("\n", " ").strip()
			return snippet

	return " ".join(text.split())[:fallback_length]


def build_corpus_index() -> Dict[str, object]:
	documents = build_documents()
	document_frequency = compute_document_frequency(documents)
	idf = compute_idf(document_frequency, len(documents))

	indexed_documents = []
	for document in documents:
		vector = build_vector(document.term_counts, document.length, idf)
		indexed_documents.append(
			{
				"document": document,
				"vector": vector,
				"norm": vector_norm(vector),
			}
		)

	return {
		"documents": indexed_documents,
		"document_frequency": document_frequency,
		"idf": idf,
		"total_docs": len(documents),
	}


CORPUS_INDEX = build_corpus_index()


def explain_query(query: str) -> Dict[str, object]:
	tokens = tokenize(query)
	counts = Counter(tokens)
	tf = compute_tf(dict(counts), len(tokens))
	idf = CORPUS_INDEX["idf"]
	vector = {term: tf_value * idf.get(term, 0.0) for term, tf_value in tf.items()}
	norm = vector_norm(vector)

	term_details = []
	for term in sorted(counts):
		df = CORPUS_INDEX["document_frequency"].get(term, 0)
		term_idf = idf.get(term, math.log((1 + CORPUS_INDEX["total_docs"]) / 1) + 1.0)
		term_tf = tf.get(term, 0.0)
		term_tfidf = term_tf * term_idf
		term_details.append(
			{
				"term": term,
				"count": counts[term],
				"tf": term_tf,
				"df": df,
				"idf": term_idf,
				"tfidf": term_tfidf,
			}
		)

	return {
		"query": query,
		"tokens": tokens,
		"term_counts": dict(counts),
		"tf": tf,
		"vector": vector,
		"norm": norm,
		"details": term_details,
	}


def rank_documents(query: str, top_k: int = DEFAULT_TOP_K) -> Dict[str, object]:
	query_info = explain_query(query)
	query_vector = query_info["vector"]
	query_terms = query_info["tokens"]

	results = []
	for entry in CORPUS_INDEX["documents"]:
		document = entry["document"]
		similarity = cosine_similarity(query_vector, entry["vector"])
		matched_terms = sorted(set(query_terms).intersection(document.term_counts))
		matched_details = []
		document_tf = compute_tf(document.term_counts, document.length)
		for term in matched_terms:
			matched_details.append(
				{
					"term": term,
					"doc_tf": document_tf.get(term, 0.0),
					"doc_idf": CORPUS_INDEX["idf"].get(term, 0.0),
					"doc_tfidf": entry["vector"].get(term, 0.0),
					"query_tf": query_info["tf"].get(term, 0.0),
					"query_idf": CORPUS_INDEX["idf"].get(term, 0.0),
					"query_tfidf": query_vector.get(term, 0.0),
				}
			)

		results.append(
			{
				"doc_id": document.doc_id,
				"path": document.path,
				"name": document.name,
				"score": similarity,
				"doc_length": document.length,
				"doc_norm": entry["norm"],
				"snippet": build_snippet(document.text, query_terms),
				"matched_terms": matched_terms,
				"matched_details": matched_details,
			}
		)

	results.sort(key=lambda item: item["score"], reverse=True)

	return {
		"query": query_info,
		"corpus": {
			"total_documents": CORPUS_INDEX["total_docs"],
			"unique_terms": len(CORPUS_INDEX["idf"]),
			"top_k": top_k,
		},
		"results": results[:top_k],
	}


def json_response(payload: Dict[str, object]) -> bytes:
	return json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")


class RankerRequestHandler(BaseHTTPRequestHandler):
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
			self.wfile.write(
				json_response(
					{
						"status": "ok",
						"total_documents": CORPUS_INDEX["total_docs"],
					}
				)
			)
			return

		if self.path.rstrip("/") == "/meta":
			self._set_headers(200)
			self.wfile.write(
				json_response(
					{
						"total_documents": CORPUS_INDEX["total_docs"],
						"document_frequency": CORPUS_INDEX["document_frequency"],
						"idf": CORPUS_INDEX["idf"],
					}
				)
			)
			return

		self._set_headers(404)
		self.wfile.write(json_response({"error": "Not found"}))

	def do_POST(self) -> None:
		if self.path.rstrip("/") != "/rank":
			self._set_headers(404)
			self.wfile.write(json_response({"error": "Not found"}))
			return

		content_length = int(self.headers.get("Content-Length", "0"))
		raw_body = self.rfile.read(content_length).decode("utf-8", errors="ignore")

		try:
			request_data = json.loads(raw_body or "{}")
		except json.JSONDecodeError:
			self._set_headers(400)
			self.wfile.write(json_response({"error": "Invalid JSON body"}))
			return

		query = str(request_data.get("query", "")).strip()
		top_k = int(request_data.get("top_k", DEFAULT_TOP_K))
		if not query:
			self._set_headers(400)
			self.wfile.write(json_response({"error": "Query is required"}))
			return

		payload = rank_documents(query, top_k=top_k)
		self._set_headers(200)
		self.wfile.write(json_response(payload))

	def log_message(self, format: str, *args: object) -> None:
		return


def run_server(host: str, port: int) -> None:
	server = ThreadingHTTPServer((host, port), RankerRequestHandler)
	print(f"TF-IDF service listening on http://{host}:{port}")
	try:
		server.serve_forever()
	except KeyboardInterrupt:
		print("\nShutting down TF-IDF service...")
	finally:
		server.server_close()


def run_demo(query: str, top_k: int) -> None:
	payload = rank_documents(query, top_k=top_k)
	print(json.dumps(payload, ensure_ascii=False, indent=2))


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Manual TF-IDF ranker service")
	parser.add_argument("--serve", action="store_true", help="Run as an HTTP service")
	parser.add_argument("--host", default="127.0.0.1", help="Host for the HTTP service")
	parser.add_argument("--port", default=8000, type=int, help="Port for the HTTP service")
	parser.add_argument("--query", help="Run a one-off ranking demo for the given query")
	parser.add_argument("--top-k", default=DEFAULT_TOP_K, type=int, help="Number of ranked documents to return")
	return parser.parse_args()


def main() -> None:
	args = parse_args()
	if args.serve:
		run_server(args.host, args.port)
		return

	query = args.query
	if not query:
		try:
			query = input("Enter query: ").strip()
		except EOFError:
			query = ""

	if not query:
		raise SystemExit("A query is required. Use --query or run with --serve.")

	run_demo(query, args.top_k)


if __name__ == "__main__":
	main()
