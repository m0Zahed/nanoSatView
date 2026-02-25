# Basic Spring Boot Event Demo (Spring + Kafka)

This project demonstrates two pub-sub styles:
- Spring in-process events (`ApplicationEventPublisher` + `@EventListener`) - always on
- Kafka events (`KafkaTemplate` + `@KafkaListener`) - optional

## Flow overview

1. Call `GET /users/create?username=bob`.
2. `UserService` publishes:
   - `UserCreatedEvent` (in-process Spring event)
   - `KafkaUserCreatedEvent` (to Kafka topic, only if Kafka is enabled)
3. Two listeners react independently:
   - `UserEventListener` for Spring event
   - `KafkaUserEventListener` for Kafka topic event (only if Kafka is enabled)

## Run without Docker (default)

```powershell
$env:JAVA_HOME='D:\Program Files\Java'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn spring-boot:run
```

In this mode, `app.kafka.enabled=false` so only Spring in-process pub-sub is active.

## Optional: run with Kafka (no Docker)

If you already have Kafka running locally on `localhost:9092`, enable Kafka like this:

```powershell
$env:JAVA_HOME='D:\Program Files\Java'
$env:Path="$env:JAVA_HOME\bin;$env:Path"
mvn spring-boot:run "-Dspring-boot.run.arguments=--app.kafka.enabled=true"
```

If you prefer, you can also edit `application.properties` and set:

```properties
app.kafka.enabled=true
```

## Trigger event

```text
http://localhost:8080/users/create?username=bob
```

Expected logs:
- Always: Spring listener log from `UserEventListener`
- If enabled: Kafka listener log from `KafkaUserEventListener`

## Key settings

See `src/main/resources/application.properties`:
- `app.kafka.enabled=false` (default)
- `spring.kafka.bootstrap-servers=localhost:9092`
- `app.kafka.topic.user-created=user-created-topic`
- JSON serializer/deserializer setup for `KafkaUserCreatedEvent`

## Docker option (if needed later)

You can still use Docker with:

```powershell
docker compose up -d
mvn spring-boot:run
```
