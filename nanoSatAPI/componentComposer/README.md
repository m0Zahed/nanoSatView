# Component Composer API (Python)

This service provides a focused API for the `ComponentsView` document workflow:

- Upload document blobs from frontend
- Fetch/search document blobs as card data
- Generate markdown from the frontend builder stack (`text`, `document`, `diagram`)

## Run locally

```powershell
cd nanoSatAPI/componentComposer
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8090
```

## Endpoints

- `POST /api/v1/documents/upload` (multipart file upload)
- `GET /api/v1/documents?query=...` (list/search cards)
- `POST /api/v1/markdown/from-stack` (generate markdown draft)
- `GET /healthz` (health)

## Notes

- Files are stored in `./data/uploads`
- Metadata is stored in `./data/metadata.json`
- This is intentionally lightweight and meant to be replaced/extended in your next branch for OpenSearch/Bedrock agentic pipelines.
