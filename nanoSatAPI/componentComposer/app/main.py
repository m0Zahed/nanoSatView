from __future__ import annotations

import json
import mimetypes
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
METADATA_FILE = DATA_DIR / "metadata.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
if not METADATA_FILE.exists():
    METADATA_FILE.write_text("[]", encoding="utf-8")


def _load_metadata() -> list[dict[str, Any]]:
    try:
        raw = METADATA_FILE.read_text(encoding="utf-8")
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
    except (OSError, json.JSONDecodeError):
        pass
    return []


def _save_metadata(items: list[dict[str, Any]]) -> None:
    METADATA_FILE.write_text(json.dumps(items, indent=2), encoding="utf-8")


class BuilderBlob(BaseModel):
    id: str
    type: str
    title: str
    content: str
    sourceId: str | None = None


class MarkdownRequest(BaseModel):
    projectName: str
    component: dict[str, Any] | None = None
    requirements: list[dict[str, Any]] = []
    stack: list[BuilderBlob] = []


app = FastAPI(title="Component Composer API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/documents/upload")
async def upload_document(file: UploadFile = File(...)) -> dict[str, Any]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    doc_id = str(uuid.uuid4())
    safe_name = file.filename or f"{doc_id}.bin"
    target = UPLOADS_DIR / f"{doc_id}-{safe_name}"
    target.write_bytes(content)

    mime_type = file.content_type or mimetypes.guess_type(safe_name)[0] or "application/octet-stream"
    item = {
        "id": doc_id,
        "name": safe_name,
        "mimeType": mime_type,
        "sizeBytes": len(content),
        "uploadedAt": datetime.now(timezone.utc).isoformat(),
        "path": str(target),
    }

    metadata = _load_metadata()
    metadata.insert(0, item)
    _save_metadata(metadata)
    return {k: v for k, v in item.items() if k != "path"}


@app.get("/api/v1/documents")
def list_documents(query: str | None = None) -> dict[str, list[dict[str, Any]]]:
    metadata = _load_metadata()
    if query:
        needle = query.strip().lower()
        metadata = [
            item
            for item in metadata
            if needle in item.get("id", "").lower()
            or needle in item.get("name", "").lower()
            or needle in item.get("mimeType", "").lower()
        ]

    return {"documents": [{k: v for k, v in item.items() if k != "path"} for item in metadata]}


@app.post("/api/v1/markdown/from-stack")
def generate_markdown(request: MarkdownRequest) -> dict[str, str]:
    component = request.component or {}
    component_name = component.get("name") or "Unspecified Component"
    component_type = component.get("type") or "Unknown"
    component_quantity = component.get("quantity") or 1

    stack_lines: list[str] = []
    for index, blob in enumerate(request.stack, start=1):
        stack_lines.append(f"### {index}. [{blob.type.upper()}] {blob.title}")
        stack_lines.append(blob.content or "_No content_")
        if blob.sourceId:
            stack_lines.append(f"- Source ID: `{blob.sourceId}`")
        stack_lines.append("")

    if not stack_lines:
        stack_lines = ["_No stack blobs provided._", ""]

    req_lines = []
    for req in request.requirements[:20]:
        req_id = req.get("reqId") or req.get("id") or "REQ"
        req_description = req.get("description") or req.get("title") or "Untitled requirement"
        req_lines.append(f"- **{req_id}** {req_description}")
    if not req_lines:
        req_lines = ["- No linked requirements."]

    markdown = "\n".join(
        [
            f"# {request.projectName} Component Draft",
            "",
            "## Component Summary",
            f"- Name: {component_name}",
            f"- Type: {component_type}",
            f"- Quantity: {component_quantity}",
            "",
            "## Builder Stack",
            *stack_lines,
            "## Linked Requirements",
            *req_lines,
            "",
            "## Draft Prompt",
            "Generate a systems-engineering document section from the stack above, preserving traceability.",
            "",
        ]
    )

    return {"markdown": markdown}
