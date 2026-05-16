# Backend TF-IDF Service

This folder contains the entire backend for the information retrieval project.

The active runtime is a Django API that loads a plain-text corpus, computes TF-IDF manually, ranks documents by cosine similarity, and returns the ranking together with the math used to produce it.

There is also a small legacy standard-library HTTP prototype in `src/`. That prototype is kept in the tree because it still explains the evolution of the backend, but the Django app is the source of truth for current behavior.

## What This Backend Is For

The backend is designed to answer a query against the corpus and explain why each document was ranked where it was ranked.

It does four main jobs:

1. Load the corpus from disk.
2. Normalize and tokenize the text.
3. Build TF, DF, IDF, and TF-IDF values manually.
4. Return ranked results with a readable explanation payload.

The implementation is intentionally lightweight. The ranking math is written in Python and does not depend on an external TF-IDF library.

## Entry Point

The supported entry point is `manage.py`.

Run the backend from inside this folder:

```bash
python manage.py runserver 127.0.0.1:8000
```

Run it from the repository root:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

`manage.py` sets `DJANGO_SETTINGS_MODULE` to `backend.django_project.settings`, adds the repository root to `sys.path`, and then hands control to Django's command runner.

## Backend Layout

```text
backend/
├── .gitignore
├── .venv/
├── Dockerfile
├── README.MD
├── django_app/
├── django_project/
├── manage.py
├── requirements.txt
└── src/
```

### `backend/manage.py`

Purpose: start Django management commands.

What it does line by line:

- Imports `os`, `sys`, and `Path` so it can resolve the backend location and modify the module search path.
- Resolves `base_dir` from the file location.
- Inserts the repository root into `sys.path` so `backend.*` imports work.
- Sets `DJANGO_SETTINGS_MODULE` to `backend.django_project.settings`.
- Imports `execute_from_command_line` from Django.
- Passes the full command-line arguments to Django.

Why it matters: this is the only supported startup path for the current backend.

### `backend/django_project/`

This folder is the Django project shell.

#### `backend/django_project/settings.py`

Purpose: define Django configuration.

Important values and why they exist:

- `BASE_DIR` points to the project root so file paths can be built relative to the repository.
- `SECRET_KEY` is a development placeholder.
- `DEBUG = True` keeps development errors visible.
- `ALLOWED_HOSTS = ["*"]` keeps local development simple.
- `INSTALLED_APPS` registers the Django contrib apps and `backend.django_app`.
- `MIDDLEWARE` enables the standard Django request pipeline.
- `ROOT_URLCONF` points to the project URL router.
- `TEMPLATES` enables Django's template engine, even though this backend primarily serves JSON.
- `WSGI_APPLICATION` and `ASGI_APPLICATION` expose standard deployment entry points.
- `DATABASES` uses SQLite at `db.sqlite3` in the backend root.
- `LANGUAGE_CODE`, `TIME_ZONE`, `USE_I18N`, and `USE_TZ` keep default Django behavior predictable.
- `STATIC_URL` and `DEFAULT_AUTO_FIELD` are standard project defaults.

This file is mostly configuration, but it also establishes the file path anchor used by the corpus loader and the local database file.

#### `backend/django_project/urls.py`

Purpose: mount the application URLs.

It routes `/api/` to `backend.django_app.urls`.

That means the project-level router stays very thin and the endpoint definitions live in the app layer where they belong.

#### `backend/django_project/asgi.py`

Purpose: provide an ASGI entry point for async-capable deployment servers.

It exposes the Django application object that ASGI servers expect.

#### `backend/django_project/wsgi.py`

Purpose: provide a WSGI entry point for standard deployment servers.

It exposes the Django application object that WSGI servers expect.

### `backend/django_app/`

This folder is the HTTP layer of the backend.

#### `backend/django_app/apps.py`

Purpose: register the app with Django.

It sets:

- `default_auto_field = "django.db.models.BigAutoField"`
- `name = "backend.django_app"`

This lets Django load the app cleanly during startup.

#### `backend/django_app/urls.py`

Purpose: map app routes to views.

Current endpoints:

- `GET /api/health`
- `GET /api/meta`
- `POST /api/rank`
- `POST /api/upload`

#### `backend/django_app/views.py`

Purpose: validate requests, call the ranking service, and return JSON.

This file is the request-handling center for the active backend.

What it does line by line:

- Imports `json` because the rank endpoint reads a JSON body.
- Imports `HttpRequest` and `JsonResponse` from Django.
- Uses `@csrf_exempt` on the rank endpoint because this backend is acting like a JSON API.
- Creates a single shared `CorpusManager` instance at import time.
- Creates a single shared `Ranker` instance using that corpus manager.
- Defines `_success(...)` to build the standard success envelope.
- Defines `_failure(...)` to build the standard error envelope.
- Defines `health_view(...)` to return a simple status payload.
- Defines `meta_view(...)` to return corpus metadata and IDF statistics.
- Defines `rank_view(...)` to parse the request body, validate the query, call the ranker, serialize the result, and return the response.

#### Upload endpoint (`POST /api/upload`)

Purpose: accept user uploads of plain-text (`.txt`) and PDF (`.pdf`) files, persist them into the corpus, extract text from PDFs, and trigger an immediate re-index so newly uploaded files become searchable right away.

Behavior and request format:

- Accepts `multipart/form-data` POST requests where the file field is named `files`. Multiple files may be supplied by repeating the `files` field.
- Allowed file extensions: `.txt` and `.pdf` (other file types are rejected).
- Uploaded files are saved under the persistent uploads directory: `backend/corpus/uploads/` with a generated unique filename to avoid collisions.
- For `.pdf` uploads the backend extracts text using `pypdf` (helper: `backend/src/utils/pdf.py`) before indexing.
- After files are saved the view calls `CorpusManager.refresh()` to rebuild in-memory TF/IDF statistics and document vectors so the new documents are immediately included in subsequent `/api/rank` calls.

Example `curl` usage:

```bash
curl -v -X POST http://127.0.0.1:8000/api/upload \
  -F "files=@/path/to/file1.txt" \
  -F "files=@/path/to/file2.pdf"
```

Example Django test-client usage (from repository root):

```python
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile

client = Client()
files = [
    SimpleUploadedFile('example.txt', b'this is a test document'),
    SimpleUploadedFile('paper.pdf', open('local.pdf','rb').read(), content_type='application/pdf'),
]
resp = client.post('/api/upload', data={'files': files})
print(resp.json())
```

Response shape:

- The endpoint responds with the standard API envelope used elsewhere in the project: `success`, `message`, `data`, `error`, and `meta`.
- `data` contains a `saved_files` array with objects describing each saved file (original filename, saved path, saved name).
- `meta` contains the path `/api/upload` and may include updated corpus metadata when the refresh completes.

Notes and operational details:

- `pypdf` is required to extract text from PDFs; the package was added to `backend/requirements.txt` as `pypdf>=5.0,<6`.
- Uploaded PDFs that cannot be parsed gracefully fall back to being skipped for indexing (the file is still saved to disk) so the service remains robust.
- This endpoint does not implement production hardening (authentication, virus scanning, file size limits). Add those protections before exposing the endpoint publicly.

Important behavior details:

- `rank_view` only accepts `POST`.
- Invalid JSON returns a `400` error.
- Missing or blank `query` returns a `400` error.
- `top_k` defaults to `DEFAULT_TOP_K` from `backend/src/constants.py`.
- The response always uses the same envelope shape, with `success`, `message`, `data`, `error`, and `meta`.

### `backend/src/`

This folder contains the manual TF-IDF implementation and the data model used by the backend.

#### `backend/src/config.py`

Purpose: define backend paths and runtime defaults.

What it contains:

- `BASE_DIR`: repository root for the backend package.
- `CORPUS_DIR`: `BASE_DIR / "corpus"`.
- `COCA_DIR`: `corpus/coca`.
- `WIKI_FILE`: `corpus/wiki/text.txt`.
- `DEFAULT_HOST`: `127.0.0.1`.
- `DEFAULT_PORT`: `8000`.

This file keeps path logic in one place so the rest of the backend does not hardcode directories.

#### `backend/src/constants.py`

Purpose: hold tokenization and ranking constants.

What it contains:

- `TOKEN_PATTERN = re.compile(r"[a-z0-9]+")`
- `DEFAULT_TOP_K = 10`
- `STOPWORDS`: a built-in set of common English stopwords

Why it matters: tokenization uses the same rules everywhere, so the document corpus and the query are normalized in the same way.

#### `backend/src/model/`

Purpose: store immutable data objects used by the ranking pipeline.

These files do not perform ranking themselves. They describe the shape of the data.

##### `backend/src/model/document.py`

`DocumentRecord` stores one corpus document.

Fields:

- `doc_id`: numeric identifier assigned during loading
- `path`: relative path to the corpus file
- `name`: filename only
- `text`: original document text
- `tokens`: normalized token list
- `term_counts`: token frequency map
- `length`: token count

##### `backend/src/model/query.py`

`QueryAnalysis` stores the query after it has been tokenized and weighted.

Fields:

- `query`: original query string
- `tokens`: normalized query tokens
- `term_counts`: query term counts
- `tf`: query term frequencies
- `vector`: query TF-IDF vector
- `norm`: vector norm
- `details`: per-term breakdown with count, TF, DF, IDF, and TF-IDF

##### `backend/src/model/ranking.py`

This file stores the ranking result objects.

`MatchedTerm` keeps the per-term comparison between query and document:

- document TF, IDF, and TF-IDF
- query TF, IDF, and TF-IDF

`RankedDocument` stores one ranked result:

- `doc_id`
- `path`
- `name`
- `score`
- `doc_length`
- `doc_norm`
- `snippet`
- `matched_terms`
- `matched_details`

`RankResponse` wraps the full ranking payload:

- `query`
- `corpus`
- `results`

#### `backend/src/service/`

Purpose: run the ranking logic.

##### `backend/src/service/corpus_manager.py`

Purpose: load the corpus once, compute corpus statistics, and cache document vectors.

What it does line by line:

- Imports `Counter` and `defaultdict` to count terms and document frequency.
- Imports `Path` for filesystem access.
- Imports `DocumentRecord` so each document has a structured representation.
- Imports `tokenize(...)` to normalize text before counting terms.
- Imports `compute_idf`, `compute_tf`, and `vector_norm` from `backend/src/utils/vector.py`.
- In `__init__`, loads documents, computes document frequency, computes IDF, and builds vectors.
- `_load_text_paths(...)` collects the allowed corpus files.
- `_load_documents(...)` reads each file, tokenizes it, counts terms, and creates a `DocumentRecord`.
- `_compute_document_frequency(...)` counts in how many documents each term appears.
- `_build_vectors(...)` converts each document into a TF-IDF vector and stores its norm.
- `get_documents(...)`, `get_document_frequency(...)`, `get_idf(...)`, and `get_indexed_documents(...)` expose the cached data.
- `get_metadata(...)` returns the corpus summary used by `/api/meta`.

Important corpus rule:

- It reads `corpus/coca/*.txt`.
- It reads `corpus/wiki/text.txt`.
- It does not read `corpus/PDFs/`.

##### `backend/src/service/ranker.py`

Purpose: analyze a query, score every document, and build the ranked response.

What it does line by line:

- Imports `math` for the fallback IDF calculation used when a query term is not present in the corpus dictionary.
- Imports `Counter` to count query terms.
- Imports the ranking model classes.
- Imports `build_snippet(...)` for document previews.
- Imports `tokenize(...)` so query tokenization matches document tokenization.
- Imports `compute_tf(...)`, `cosine_similarity(...)`, and `vector_norm(...)` for the math.
- Stores the shared `CorpusManager` in `__init__`.
- `explain_query(...)` tokenizes the query, counts terms, computes TF, builds a TF-IDF vector, and prepares a term-by-term explanation list.
- `rank(...)` reuses the query analysis, compares the query vector against every indexed document, computes cosine similarity, collects matched terms, builds `MatchedTerm` objects, sorts results, and truncates to `top_k`.
- `get_metadata(...)` simply forwards corpus metadata.

Important behavior details:

- The query and documents use the same tokenization rules.
- The ranking score is cosine similarity.
- Result order is descending by score.
- Each result includes a snippet chosen from the first matched term when possible.

#### `backend/src/utils/`

Purpose: keep the pure helper functions separate from the service layer.

##### `backend/src/utils/tokenizer.py`

Purpose: normalize text into comparable tokens.

What it does:

- Lowercases the text.
- Extracts tokens with the regex `[a-z0-9]+`.
- Removes stopwords unless `remove_stopwords=False` is passed.

This keeps the query and documents on the same lexical footing.

##### `backend/src/utils/text.py`

Purpose: build snippets for ranked results.

What it does:

- Searches the lowercased document text for any query term.
- If it finds a term, it returns a window around the first match.
- If it does not find a term, it returns a shortened whitespace-normalized fallback snippet.

This keeps the response readable without needing the entire document body.

##### `backend/src/utils/vector.py`

Purpose: implement the actual TF-IDF math.

Functions:

- `compute_tf(term_counts, length)` returns `count / length` for each term.
- `compute_idf(document_frequency, total_docs)` returns smoothed IDF values using `log((1 + N) / (1 + df)) + 1`.
- `vector_norm(vector)` returns the Euclidean norm.
- `dot_product(left, right)` multiplies aligned weights and sums them.
- `cosine_similarity(left, right)` returns the normalized similarity score and guards against zero-length vectors.

These are the core mathematical primitives used by the backend.

#### `backend/src/api/`

Purpose: hold serialization and the legacy HTTP prototype.

This folder is still in the tree, so it should be documented, but the Django app is the active runtime.

##### `backend/src/api/schemas.py`

Purpose: convert ranking dataclasses into plain dictionaries that can be JSON encoded.

`serialize_rank_response(...)` uses `dataclasses.asdict(...)` on each ranked document and returns a dictionary with `query`, `corpus`, and `results`.

This module is used by the Django view before the response is wrapped in the standard API envelope.

##### `backend/src/api/routes.py`

Purpose: legacy standard-library HTTP request handler.

What it does line by line:

- Subclasses `BaseHTTPRequestHandler`.
- Keeps a `Ranker` instance on the handler class.
- Defines `_set_headers(...)` to send JSON headers and CORS headers.
- Handles `OPTIONS` requests for preflight.
- Handles `GET /health` and `GET /meta`.
- Handles `POST /rank`.
- Parses JSON manually from the request body.
- Validates the query and `top_k`.
- Serializes the rank response into JSON.
- Overrides `log_message(...)` so the server does not print noisy request logs.

This file explains the original non-Django prototype, but it is not the active HTTP path now.

##### `backend/src/app.py`

Purpose: legacy server bootstrap for the standard-library prototype.

What it does line by line:

- Imports `ThreadingHTTPServer`.
- Imports the default host and port from `config.py`.
- Imports the legacy `RankRequestHandler`.
- Creates a `CorpusManager`.
- Attaches a `Ranker` instance to the handler class.
- Builds a `ThreadingHTTPServer` instance.
- Starts the server and keeps it alive until interrupted.

This file is useful as historical context, but the Django path is the one that currently runs.

## Request Flow

The active request path looks like this:

```text
HTTP request
  -> Django routing
  -> backend.django_app.views
  -> backend.src.service.Ranker
  -> backend.src.service.CorpusManager
  -> backend.src.utils.* helpers
  -> JSON response
```

For a rank request, the flow is:

1. Django receives `POST /api/rank`.
2. The view checks that the method is `POST`.
3. The view parses the JSON body.
4. The query is tokenized the same way the corpus was tokenized.
5. The ranker computes the query vector.
6. The corpus manager provides cached document vectors and IDF values.
7. The ranker calculates cosine similarity against every document.
8. The results are sorted from best match to worst match.
9. The response is wrapped in the standard JSON envelope.

## TF-IDF Math

The backend uses the standard information retrieval scoring chain.

### Tokenization

Text is normalized by:

- converting to lowercase
- extracting alphanumeric tokens with `[a-z0-9]+`
- removing built-in stopwords

This is done by `backend/src/utils/tokenizer.py`.

### Term Frequency

For a term `t` in a document `d`:

```text
tf(t, d) = count(t, d) / |d|
```

`|d|` is the token count after normalization.

### Document Frequency

Document frequency is the number of documents containing the term at least once:

```text
df(t) = number of documents where t appears
```

The corpus manager computes this once during startup.

### Smoothed IDF

The backend uses smoothed inverse document frequency:

```text
idf(t) = log((1 + N) / (1 + df(t))) + 1
```

Where:

- `N` is the total number of documents
- `df(t)` is the number of documents containing the term

This avoids division by zero and keeps the scale stable.

### TF-IDF Weight

The term weight is:

```text
tfidf(t, d) = tf(t, d) * idf(t)
```

The same idea is applied to the query vector and each document vector.

### Vector Norm

The Euclidean norm is:

```text
||v|| = sqrt(sum(w_i^2))
```

### Dot Product

The dot product is:

```text
q · d = sum(q_i * d_i)
```

Only shared terms contribute.

### Cosine Similarity

The final score is:

```text
score(q, d) = (q · d) / (||q|| * ||d||)
```

If either vector has zero norm, the score is `0.0`.

## API Contract

All current Django endpoints return the same envelope shape:

```json
{
  "success": true,
  "message": "Ranked results",
  "data": {},
  "error": null,
  "meta": {
    "path": "/api/rank"
  }
}
```

### `GET /api/health`

Returns a simple health payload:

```json
{
  "status": "ok"
}
```

### `GET /api/meta`

Returns corpus metadata, including:

- total document count
- unique term count
- document frequency map
- IDF map

### `POST /api/rank`

Request body:

```json
{
    "query": "information retrieval",
    "page": 1,
    "page_size": 10
}
```

Rules:

- `query` is required.
- `page` is optional.
- `page_size` is optional.
- If `page` is missing, the backend uses `1`.
- If `page_size` is missing, the backend uses `10`.
- If the JSON body is invalid, the backend returns `400`.
- If `query` is blank, the backend returns `400`.

The response includes the analyzed query, corpus summary, ranked results, snippets, and matched-term math.

### `POST /api/upload`

Accepts file uploads and adds them to the corpus. Supports `.txt` and `.pdf` files.

Request format:

```bash
curl -X POST http://127.0.0.1:8000/api/upload \
  -F "files=@document1.txt" \
  -F "files=@document2.pdf"
```

Request body rules:

- Use `multipart/form-data` content type
- The file field name must be `files`
- Multiple files can be uploaded by repeating the `files` field
- Allowed extensions: `.txt` and `.pdf` (other file types are rejected)

Response data includes:

```json
{
  "saved_files": [
    {
      "name": "original_filename.txt",
      "stored_name": "original_filename-<uuid>.txt",
      "path": "backend/corpus/uploads/original_filename-<uuid>.txt",
      "size": 1024
    }
  ],
  "corpus": { "total_documents": 100, "unique_terms": 5000 }
}
```

Behavior:

- Uploaded files are saved to `backend/corpus/uploads/` with a unique filename to avoid collisions
- PDF files are automatically parsed for text extraction
- After upload completes, the corpus is automatically refreshed so new documents are immediately searchable
- Returns `400` if no files are provided or file type is not supported
- Returns `405` if the request method is not `POST`
- Returns `500` if file save fails

### `GET /api/document/{doc_id}`

Retrieves a specific document by its ID.

Behavior:

- **Text Files (`.txt`)**: Returns the standard JSON envelope where the `data` object contains the document's metadata and full raw text.
- **PDF Files (`.pdf`)**: Bypasses the standard JSON envelope and directly streams the binary file back to the client (`Content-Type: application/pdf`).
- Returns `404` if the document is not found in the index or if the file is missing from the disk.
- Returns `405` if the request method is not `GET`.

Response `data` object (for text documents):

```json
{
  "doc_id": 4556,
  "name": "text_web.txt (Article 4556)",
  "path": "corpus/coca/text_web.txt",
  "text": "@@5095241 <h> Privacy Policy <p> First Place 4 Health believes that privacy is important to the success and use of the Internet..."
}
```

### `GET /api/status`

Returns the current status of the backend, including uptime, total requests handled, and last refresh time.
Response example:

```json
{
  "success": true,
  "message": "System status retrieved",
  "data": {
    "is_indexing": true,
    "status": "indexing"
  },
  "error": null,
  "meta": {
    "path": "/api/status"
  }
}
```

## Corpus Scope

The backend reads only these plain-text sources:

- `../corpus/coca/*.txt`
- `../corpus/wiki/text.txt`

The `../corpus/PDFs/` folder is not part of the ranking pipeline.

Why that matters:

- the backend currently works with plain text only
- PDF parsing is not implemented in this version
- keeping the input types narrow makes the TF-IDF math predictable and easy to explain

## Docker

### `backend/Dockerfile`

This container file does the following:

- uses `python:3.13-slim-bookworm`
- sets `PYTHONDONTWRITEBYTECODE=1`
- sets `PYTHONUNBUFFERED=1`
- sets the working directory to `/app`
- copies `backend/requirements.txt`
- installs the Python dependencies
- copies `backend/` into the image
- copies `corpus/` into the image
- changes the working directory to `/app/backend`
- exposes port `8000`
- runs `python manage.py runserver 0.0.0.0:8000`

Build it from the repository root:

```bash
docker build -f backend/Dockerfile -t ir-tfidf-backend .
```

Run it:

```bash
docker run --rm -p 8000:8000 ir-tfidf-backend
```

### Docker Compose

A `docker-compose.yml` file is provided in the repository root for local development and deployment.

Services:

- `backend`: The Django API service running on port 8000

Configuration:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: tf-idf-backend:latest
    container_name: tfidf-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      DJANGO_SETTINGS_MODULE: backend.django_project.settings
      PYTHONUNBUFFERED: "1"
    volumes:
      - ./backend:/app/backend
      - ./backend/corpus:/app/corpus
```

Start the service:

```bash
docker-compose up -d --build
```

View logs:

```bash
docker-compose logs -f backend
```

Stop the service:

```bash
docker-compose down
```

Notes:

- The `restart: unless-stopped` policy ensures the container restarts automatically unless explicitly stopped
- The `volumes` mounts ensure code changes and corpus files persist between container restarts
- `PYTHONUNBUFFERED=1` ensures Python output is sent directly to logs without buffering
- The image is tagged as `tf-idf-backend:latest` for easy identification

## Local Setup

Install dependencies:

```bash
pip install -r backend/requirements.txt
```

That file currently pins Django with a simple version range:

```text
Django>=5.1,<6
```

Run the backend from inside `backend/`:

```bash
python manage.py runserver 127.0.0.1:8000
```

Or run it from the repository root:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

## Generated Or Local-Only Files

### `backend/.gitignore`

This file keeps local and generated files out of version control.

It ignores:

- Python bytecode and caches
- test and lint caches
- virtual environments, including `.venv/`
- SQLite database files
- static and media output
- `.env` files
- editor and OS clutter

### `backend/.venv/`

This directory is a local virtual environment.

It is not part of the backend source and is ignored by `.gitignore`.

## How To Read The Code

If you want to understand the backend in the fastest order, read it this way:

1. `manage.py` to see how the app starts.
2. `django_project/settings.py` to see the Django configuration.
3. `django_app/views.py` and `django_app/urls.py` to see the HTTP entry points.
4. `src/config.py` and `src/constants.py` to see the paths and tokenization rules.
5. `src/utils/vector.py` to see the math.
6. `src/utils/tokenizer.py` and `src/utils/text.py` to see normalization and snippets.
7. `src/model/*.py` to see the response objects.
8. `src/service/corpus_manager.py` and `src/service/ranker.py` to see how the ranking actually happens.
9. `src/api/schemas.py`, `src/api/routes.py`, and `src/app.py` if you want the legacy prototype and serialization layer.

## Changelog

### May 13, 2026 - Enhanced Snippet Generation with Visual Ellipsis Indicators

**File Modified:** `backend/src/utils/text.py`

**What Changed:**
The `build_snippet()` function now adds visual ellipsis (`...`) markers to indicate when document text has been truncated in search result previews.

**Changes:**

1. **Leading Ellipsis** - Added when the matched term is found more than 80 characters from the document start
   - Indicates content was cut from the beginning
   - Example: `"...history of European classical art in the 18th century..."`

2. **Trailing Ellipsis** - Added when the context window ends before the document ends
   - Indicates content was cut from the end
   - Example: `"...classical art in the 18th century, which was..."`

3. **Improved Fallback** - When no search term is found, returns first 220 characters with trailing ellipsis if document is longer
   - Example: `"First 220 characters of the document when no term is found..."`

**Why This Matters:**
Previously, users couldn't tell if a snippet was cut off or if the search term actually didn't appear in the full document. Now ellipsis clearly shows truncation boundaries, making search results more transparent.

**Example Before/After:**

Before:

```json
{
  "snippet": "classical art in the 18th century, which was a strange",
  "matched_terms": ["art"]
}
```

After:

```json
{
  "snippet": "...history of European classical art in the 18th century, which was a...",
  "matched_terms": ["art"]
}
```

**Backward Compatibility:** ✓ Fully compatible - function signature unchanged, only output format enhanced.

**Testing:** All edge cases verified:

- ✓ Term in middle with truncation: generates both leading and trailing `...`
- ✓ Term at start: no leading `...`
- ✓ Term at end: no trailing `...`
- ✓ Term not found: graceful fallback with trailing `...` for long documents

---

## Summary

This backend is a manual TF-IDF ranking service built with Django.

The important ideas are:

- the corpus is loaded from text files on disk
- tokenization is manual and shared by documents and queries
- TF-IDF is computed in Python with explicit formulas
- cosine similarity is the ranking score
- the API returns both results and the math behind them
- the active runtime is Django, not the legacy HTTP prototype

If you only remember one thing: `backend/manage.py` is the entry point, `backend/django_app/views.py` is the request layer, and `backend/src/service/ranker.py` is where the ranking logic lives.
