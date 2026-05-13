# Manual TF-IDF Ranker

This project uses a pure-Python TF-IDF engine that ranks documents from the plain-text corpus in `corpus/coca/` and `corpus/wiki/`. The ranking math is implemented manually with the Python standard library only.

## What the Python service returns

The service exposes a JSON API that includes:

- Ranked documents in descending score order
- Final cosine similarity score for each document
- Document term frequency, IDF, TF-IDF weights, and vector norm
- Query term breakdown with the same math values
- A short snippet and matched terms for each result

This makes the output suitable both for an information retrieval course and for a React/Express frontend that needs ranked search results.

## Run as a service

Start the API server:

```bash
python TF-IDF.py --serve --host 127.0.0.1 --port 8000
```

Available endpoints:

- `GET /health` returns a simple status check
- `GET /meta` returns corpus-level TF-IDF metadata
- `POST /rank` accepts JSON like `{ "query": "information retrieval", "top_k": 10 }`

Example request:

```bash
curl -X POST http://127.0.0.1:8000/rank -H "Content-Type: application/json" -d "{\"query\":\"information retrieval\",\"top_k\":5}"
```

## Run a one-off demo

If you want to test the ranking math from the terminal without starting the service:

```bash
python TF-IDF.py --query "information retrieval"
```

## Current corpus scope

For the first version, the ranker reads only:

- `corpus/coca/*.txt`
- `corpus/wiki/text.txt`

The PDF files are intentionally excluded in this version.

## Frontend integration

The intended flow is:

1. React sends the query to an Express API
2. Express forwards the request to this Python service
3. Python returns ranked results and the math details needed for display

The Express and React parts are not implemented yet, but the Python API is ready for them.
