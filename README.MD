# Manual TF-IDF Information Retrieval Engine

A lightweight, explainable document ranking system built with manual TF-IDF computation in Python. This backend calculates term frequency, inverse document frequency, and cosine similarity scoring while returning detailed mathematical explanations for each ranked result.

## What This Project Does

This is an **information retrieval engine** that:

1. **Loads a corpus** of plain-text documents from disk
2. **Tokenizes and normalizes** text using consistent rules
3. **Computes TF-IDF scores** manually in Python (no external ML libraries)
4. **Ranks documents** by cosine similarity to a query
5. **Returns results with transparency** — includes snippets, matched terms, and the math behind each score

The ranking math is fully explainable: you can see exactly how each term contributes to the final score.

## Quick Start

### Run the Backend

From the repository root:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

The server starts on `http://127.0.0.1:8000`.

### Search the Corpus

```bash
curl -X POST http://127.0.0.1:8000/api/rank \
  -H "Content-Type: application/json" \
  -d '{"query":"information retrieval","top_k":5}'
```

Response includes ranked documents, matched terms, relevance scores, and snippets with ellipsis showing truncation boundaries.

### Check Service Status

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/meta
```

## Project Structure

```
.
├── README.MD                          # This file
├── backend/                           # Django REST API
│   ├── manage.py                      # Entry point
│   ├── requirements.txt               # Python dependencies (Django)
│   ├── Dockerfile                     # Container configuration
│   ├── django_project/                # Django project config
│   ├── django_app/                    # HTTP request handlers
│   └── src/
│       ├── config.py                  # Paths and runtime defaults
│       ├── constants.py               # Tokenization rules, stopwords
│       ├── model/                     # Data structures (query, document, ranking)
│       ├── service/                   # Corpus loader and ranker
│       ├── utils/                     # TF-IDF math, tokenizer, snippets
│       └── api/                       # Legacy HTTP prototype (reference only)
└── corpus/                            # Plain-text document corpus
    ├── coca/                          # COCA corpus (8 genre files)
    ├── wiki/                          # Wikipedia content
    └── PDFs/                          # (Not used in current version)
```

**More details:** See [backend/README.md](backend/README.md) for comprehensive backend documentation.

## Features

### Keyword-in-Context Snippets

Search results include smart snippets that show the query term in context:

- **Before:** `"classical art in the 18th century, which was a strange"`
- **After:** `"...history of European classical art in the 18th century, which was a..."`

Ellipsis (`...`) visually indicates where text has been truncated, making it clear you're viewing a preview.

### Explainable Scoring

Every ranked result includes:

- **Matched terms** — which query words matched the document
- **TF/IDF values** — how often each term appears and how distinctive it is
- **Cosine similarity score** — the final ranking metric
- **Document metadata** — ID, filename, text length

### Corpus Statistics

The `/api/meta` endpoint returns:

- Total document count
- Unique term count  
- Document frequency map
- IDF scores for all terms

## TF-IDF Ranking

The backend uses the standard information retrieval pipeline:

1. **Tokenization** — lowercase, extract `[a-z0-9]+`, remove stopwords
2. **Term Frequency (TF)** — `count(term, document) / |document|`
3. **Inverse Document Frequency (IDF)** — `log((1 + N) / (1 + df)) + 1` (smoothed)
4. **TF-IDF Weight** — `TF × IDF`
5. **Cosine Similarity** — dot product normalized by vector magnitudes

The smoothed IDF formula prevents zero-weighting terms that appear in every document.

## REST API Endpoints

All responses use a standard envelope:

```json
{
  "success": true,
  "message": "Description",
  "data": {},
  "error": null,
  "meta": {"path": "/api/endpoint"}
}
```

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Service status check |
| `GET` | `/api/meta` | Corpus metadata and term statistics |
| `POST` | `/api/rank` | Search and rank documents |

### POST /api/rank

**Request:**
```json
{
  "query": "information retrieval",
  "top_k": 5
}
```

- `query` (required) — search terms
- `top_k` (optional) — number of results to return (default: 10)

**Response includes:**
- Analyzed query (tokens, TF, IDF, vector, norm)
- Corpus summary (total docs, unique terms)
- Ranked results with snippets and matched-term math

## Docker

### Build

```bash
docker build -f backend/Dockerfile -t ir-tfidf-backend .
```

### Run

```bash
docker run --rm -p 8000:8000 ir-tfidf-backend
```

The container includes the Django backend and the corpus (COCA + Wikipedia). PDFs are excluded.

## Corpus

The ranker indexes:

- `corpus/coca/*.txt` — COCA corpus in 8 genres (academic, blog, fiction, magazine, news, spoken, TV/movie, web)
- `corpus/wiki/text.txt` — Wikipedia articles

**Not indexed:**
- `corpus/PDFs/` — PDF parsing not implemented in this version

## Architecture

```
HTTP Request
    ↓
Django Views (django_app/views.py)
    ↓
Ranker Service (src/service/ranker.py)
    ├→ Corpus Manager (corpus_manager.py) — loads and caches documents
    ├→ Tokenizer (utils/tokenizer.py) — normalizes text
    ├→ Vector Math (utils/vector.py) — TF-IDF and cosine similarity
    └→ Snippet Builder (utils/text.py) — extracts context with ellipsis
    ↓
JSON Response (src/api/schemas.py)
    ↓
HTTP Response
```

## Development

### Prerequisites

- Python 3.11+
- Django 5.1+

### Install Dependencies

```bash
pip install -r backend/requirements.txt
```

### Run Tests

Unit tests for snippet generation and TF-IDF math:

```bash
python -m pytest backend/tests/ -v
```

*Note: Test suite currently in development.*

## Changelog

**May 13, 2026** — Enhanced snippet generation with visual ellipsis indicators. See [backend/README.md#changelog](backend/README.md#changelog) for details.

## Frontend Integration

The intended architecture is:

```
React Frontend
    ↓
Express Middleware (optional)
    ↓
Python TF-IDF Backend (this repo)
```

The Express layer can proxy requests to this backend and maintain a stable contract for the frontend, while the Python service handles all ranking logic.

## How to Read the Code

**Fastest path to understanding:**

1. [backend/README.md](backend/README.md) — Start here for full backend documentation
2. `backend/django_app/views.py` — HTTP entry points
3. `backend/src/service/ranker.py` — Core ranking logic
4. `backend/src/utils/vector.py` — TF-IDF math
5. `backend/src/model/ranking.py` — Response structure

## License

This is an educational information retrieval project.

## Summary

A clean, transparent TF-IDF ranking engine built to explain how and why documents are ranked. Manual math, no external ML libraries, explainable results.
