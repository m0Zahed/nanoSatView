# Spring Boot Diagram Event Processor

This service now supports:
- In-process Spring events (learning/demo)
- Optional Kafka pub-sub
- Diagram save ingestion for Operational Flow with DB persistence

## Diagram schema persisted in DB

Table: `project_management_diagrams`

Columns:
- `event_time`
- `id_of_last_member_who_edited`
- `project_id`
- `diagram_id`
- `diagram_name`
- `diagram_description`
- `filepath_local`
- `filepath_s3` (nullable, only populated when S3 upload succeeds)

## Diagram save endpoint

`POST /api/diagrams/save`

Request body:

```json
{
  "projectId": "project-guid-or-id",
  "memberId": "member-id",
  "diagramName": "Operational Flow v1",
  "diagramDescription": "Main mission workflow",
  "xmlContent": "<?xml version=\"1.0\" ... >...</xml>"
}
```

Success response:

```json
{
  "success": true,
  "message": "Diagram saved successfully.",
  "diagramId": "uuid",
  "time": "2026-02-25T...",
  "filePath": "..."
}
```

## Useful read endpoints

- `GET /api/diagrams/project/{projectId}`
- `GET /api/diagrams/{diagramId}`
- `GET /api/diagrams/storage/health`

## Run (no Docker required)

```powershell
$env:JAVA_HOME='D:\Program Files\Java'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn spring-boot:run
```

Default DB is local H2 file storage (`./data/project-management`) and XML files are stored under `./data/diagrams`.

## Optional S3 backup storage

The service always stores incoming diagram XML files locally first, then attempts S3 upload only when enabled.

Environment-backed properties:

```properties
APP_S3_ENABLED=true
APP_S3_BUCKET=your-bucket-name
APP_S3_REGION=us-east-1
APP_S3_KEY_PREFIX=diagrams
APP_S3_ENDPOINT=
APP_S3_PATH_STYLE_ACCESS=false
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...
```

Local dev secret file option:
- Copy `.env.local.example` to `.env.local` in this folder.
- The file is auto-loaded at startup via `spring.config.import=optional:file:.env.local[.properties]`.
- `.env.local` is ignored by git via the root `.gitignore` (`.env.*`).

Quick local setup helper (stores secrets in your user environment, not in git files):

```powershell
.\scripts\set-local-secrets.ps1 -S3Bucket your-bucket-name -S3Region us-east-1
```

Least-privilege IAM policy template:
- `ops/iam/s3-diagram-policy.json` (replace `REPLACE_WITH_BUCKET_NAME`)

## Optional Kafka mode

If you already have Kafka running on `localhost:9092`:

```powershell
mvn spring-boot:run "-Dspring-boot.run.arguments=--app.kafka.enabled=true"
```

When enabled, successful diagram saves also publish to topic:
- `app.kafka.topic.diagram-saved=diagram-saved-topic`
