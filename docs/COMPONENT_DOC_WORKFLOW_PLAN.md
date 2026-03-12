# Component Document Workflow Plan

## Branch

- `feat/component-doc-upload-builder`

## Goal

Implement an end-to-end component documentation workflow where users:

1. Upload documents from frontend
2. Search/fetch document cards
3. Drag cards into the Document Builder stack
4. Generate markdown from stack data through a Python API
5. Feed markdown into later RAG/agentic pipelines (future branch)

## Architecture

### Frontend (`nanoSatSystems`)

- Extend `ComponentsView` with:
  - Document upload input in the docs search section
  - Search + fetched document cards
  - Drag-and-drop from docs cards to builder canvas
  - Builder stack containing text/document/diagram blobs
  - "Generate Markdown from Stack" action

### Python API (`nanoSatAPI/componentComposer`)

- `POST /api/v1/documents/upload`: store uploaded files + metadata
- `GET /api/v1/documents?query=`: search/list document card metadata
- `POST /api/v1/markdown/from-stack`: convert stack payload to markdown
- `GET /healthz`: health endpoint

## Test Plan

### Frontend

- `ComponentsView.test.tsx`:
  - Fetch docs list
  - Upload a file
  - Drag uploaded card to builder drop zone
  - Assert document blob appears in stack

### Python API

- `tests/test_api.py`:
  - Health endpoint returns `ok`
  - Markdown generation includes project/component/requirement data

## Completed in this branch

- Added frontend upload/search/drag-drop/stack/generate behavior in `ComponentsView`
- Added Python FastAPI service with required endpoints
- Added frontend + backend tests for the above flow
- Added API README for local startup and endpoint usage

## Deferred to next branch (your RAG branch)

- OpenSearch Serverless indexing pipeline
- Bedrock Agent orchestration and tool routing
- Retrieval + synthesis prompts and policy controls
- Multi-agent verification loops and citation grounding
- Production auth, tenancy, and audit logging
