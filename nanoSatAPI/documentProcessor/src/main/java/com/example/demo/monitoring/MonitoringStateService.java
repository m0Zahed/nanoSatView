package com.example.demo.monitoring;

import com.example.demo.diagram.DiagramSaveRequest;
import com.example.demo.diagram.DiagramSaveResponse;
import com.example.demo.diagram.DiagramSummaryResponse;
import com.example.demo.diagram.ProjectManagementDiagramEntity;
import com.example.demo.event.UserCreatedEvent;
import com.example.demo.kafka.DiagramSavedKafkaEvent;
import com.example.demo.kafka.KafkaUserCreatedEvent;
import java.io.IOException;
import java.lang.annotation.Annotation;
import java.lang.reflect.Field;
import java.lang.reflect.RecordComponent;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Service
public class MonitoringStateService {

    private static final int MAX_RECENT_REQUESTS = 120;

    private final Instant startedAt = Instant.now();
    private final Map<String, AtomicLong> producedByTopic = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> consumedByTopic = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastKafkaEventAt = new ConcurrentHashMap<>();
    private final Deque<RequestTrace> recentRequests = new LinkedList<>();
    private final RequestMappingHandlerMapping requestMappingHandlerMapping;
    private final String storageRoot;
    private final boolean kafkaEnabled;

    public MonitoringStateService(
        RequestMappingHandlerMapping requestMappingHandlerMapping,
        @Value("${app.diagram.storage-root:./data/diagrams}") String storageRoot,
        @Value("${app.kafka.enabled:false}") boolean kafkaEnabled
    ) {
        this.requestMappingHandlerMapping = requestMappingHandlerMapping;
        this.storageRoot = storageRoot;
        this.kafkaEnabled = kafkaEnabled;
    }

    public void recordKafkaProduced(String topic) {
        producedByTopic.computeIfAbsent(topic, key -> new AtomicLong()).incrementAndGet();
        lastKafkaEventAt.put(topic, Instant.now());
    }

    public void recordKafkaConsumed(String topic) {
        consumedByTopic.computeIfAbsent(topic, key -> new AtomicLong()).incrementAndGet();
        lastKafkaEventAt.put(topic, Instant.now());
    }

    public void recordRequest(RequestTrace requestTrace) {
        synchronized (recentRequests) {
            recentRequests.addFirst(requestTrace);
            while (recentRequests.size() > MAX_RECENT_REQUESTS) {
                recentRequests.removeLast();
            }
        }
    }

    public MonitoringSnapshot snapshot() {
        Instant now = Instant.now();
        long uptimeSeconds = Math.max(0, now.getEpochSecond() - startedAt.getEpochSecond());

        return new MonitoringSnapshot(
            now,
            uptimeSeconds,
            kafkaEnabled,
            buildKafkaFlows(),
            buildEndpoints(),
            buildSchemas(),
            buildDiagramStorageInfo(),
            snapshotRequests()
        );
    }

    private List<KafkaFlowInfo> buildKafkaFlows() {
        return Stream.concat(producedByTopic.keySet().stream(), consumedByTopic.keySet().stream())
            .distinct()
            .sorted()
            .map(topic -> new KafkaFlowInfo(
                topic,
                producedByTopic.getOrDefault(topic, new AtomicLong()).get(),
                consumedByTopic.getOrDefault(topic, new AtomicLong()).get(),
                lastKafkaEventAt.get(topic)
            ))
            .toList();
    }

    private List<EndpointInfo> buildEndpoints() {
        return requestMappingHandlerMapping.getHandlerMethods().entrySet().stream()
            .map(this::toEndpointInfo)
            .sorted(Comparator.comparing(EndpointInfo::path))
            .toList();
    }

    private EndpointInfo toEndpointInfo(Map.Entry<RequestMappingInfo, ?> entry) {
        RequestMappingInfo requestMappingInfo = entry.getKey();
        List<String> paths = requestMappingInfo.getPatternValues().stream().sorted().toList();
        String path = paths.isEmpty() ? "(unknown)" : String.join(", ", paths);
        List<String> methods = requestMappingInfo.getMethodsCondition().getMethods().stream()
            .map(Enum::name)
            .sorted()
            .toList();

        return new EndpointInfo(
            path,
            methods.isEmpty() ? List.of("ALL") : methods,
            String.valueOf(entry.getValue())
        );
    }

    private List<SchemaInfo> buildSchemas() {
        List<Class<?>> classes = List.of(
            DiagramSaveRequest.class,
            DiagramSaveResponse.class,
            DiagramSummaryResponse.class,
            ProjectManagementDiagramEntity.class,
            UserCreatedEvent.class,
            KafkaUserCreatedEvent.class,
            DiagramSavedKafkaEvent.class
        );
        return classes.stream().map(this::toSchemaInfo).toList();
    }

    private SchemaInfo toSchemaInfo(Class<?> type) {
        if (type.isRecord()) {
            List<SchemaFieldInfo> recordFields = Arrays.stream(type.getRecordComponents())
                .map(this::toSchemaFieldInfo)
                .toList();
            return new SchemaInfo(type.getSimpleName(), recordFields);
        }

        List<SchemaFieldInfo> fields = Arrays.stream(type.getDeclaredFields())
            .filter(field -> !java.lang.reflect.Modifier.isStatic(field.getModifiers()))
            .map(this::toSchemaFieldInfo)
            .toList();
        return new SchemaInfo(type.getSimpleName(), fields);
    }

    private SchemaFieldInfo toSchemaFieldInfo(RecordComponent component) {
        return new SchemaFieldInfo(
            component.getName(),
            component.getType().getSimpleName(),
            annotationNames(component.getAnnotations())
        );
    }

    private SchemaFieldInfo toSchemaFieldInfo(Field field) {
        return new SchemaFieldInfo(
            field.getName(),
            field.getType().getSimpleName(),
            annotationNames(field.getAnnotations())
        );
    }

    private List<String> annotationNames(Annotation[] annotations) {
        return Arrays.stream(annotations)
            .map(annotation -> "@" + annotation.annotationType().getSimpleName())
            .toList();
    }

    private DiagramStorageInfo buildDiagramStorageInfo() {
        Path root = Paths.get(storageRoot).toAbsolutePath().normalize();
        if (!Files.exists(root)) {
            return new DiagramStorageInfo(root.toString(), 0, List.of());
        }

        try (Stream<Path> stream = Files.walk(root, 8)) {
            List<Path> files = stream.filter(Files::isRegularFile).toList();
            List<DiagramFileInfo> recentFiles = new ArrayList<>();

            files.stream()
                .sorted((left, right) -> getLastModified(right).compareTo(getLastModified(left)))
                .limit(40)
                .forEach(path -> recentFiles.add(new DiagramFileInfo(
                    root.relativize(path).toString(),
                    fileSize(path),
                    getLastModified(path).toInstant()
                )));

            return new DiagramStorageInfo(root.toString(), files.size(), recentFiles);
        } catch (IOException exception) {
            return new DiagramStorageInfo(root + " (unreadable: " + exception.getMessage() + ")", 0, List.of());
        }
    }

    private long fileSize(Path path) {
        try {
            return Files.size(path);
        } catch (IOException exception) {
            return -1;
        }
    }

    private FileTime getLastModified(Path path) {
        try {
            return Files.getLastModifiedTime(path);
        } catch (IOException exception) {
            return FileTime.fromMillis(0L);
        }
    }

    private List<RequestTrace> snapshotRequests() {
        synchronized (recentRequests) {
            return List.copyOf(recentRequests);
        }
    }
}
