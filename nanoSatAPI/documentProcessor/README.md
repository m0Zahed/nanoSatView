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

## Run (no Docker required)

```powershell
$env:JAVA_HOME='D:\Program Files\Java'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn spring-boot:run
```

Default DB is local H2 file storage (`./data/project-management`) and XML files are stored under `./data/diagrams`.

## Optional Kafka mode

If you already have Kafka running on `localhost:9092`:

```powershell
mvn spring-boot:run "-Dspring-boot.run.arguments=--app.kafka.enabled=true"
```

When enabled, successful diagram saves also publish to topic:
- `app.kafka.topic.diagram-saved=diagram-saved-topic`
