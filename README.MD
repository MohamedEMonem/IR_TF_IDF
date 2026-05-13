# Manual TF-IDF Ranker

The backend code now lives under `backend/` so the frontend team can add a separate `frontend/` folder without mixing concerns. The Python ranking engine stays manual and standard-library only.

## Folder structure

```text
backend/
	manage.py
	requirements.txt
	src/
		app.py
		api/
		config.py
		constants.py
		model/
		service/
		utils/
corpus/
```

## Run the backend

Start the Django backend from the repo root:

```bash
python backend/manage.py runserver 127.0.0.1:8000
```

## REST API

The Django backend uses a standard JSON envelope with `success`, `message`, `data`, `error`, and `meta`.

- `GET /health` for a service check
- `GET /meta` for corpus metadata and TF-IDF statistics
- `POST /rank` for ranked document results

Example:

```bash
curl -X POST http://127.0.0.1:8000/rank -H "Content-Type: application/json" -d "{\"query\":\"information retrieval\",\"top_k\":5}"
```

## Corpus scope

The ranker reads only:

- `corpus/coca/*.txt`
- `corpus/wiki/text.txt`

PDF files are excluded in this version.

## Frontend integration

The intended flow is React -> Express -> Python backend. The Express layer should proxy search requests to the Python service and keep the backend response contract stable for the frontend.
