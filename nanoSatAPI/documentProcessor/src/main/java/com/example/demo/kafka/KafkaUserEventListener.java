package com.example.demo.kafka;

import com.example.demo.monitoring.MonitoringStateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaUserEventListener {

    private static final Logger logger = LoggerFactory.getLogger(KafkaUserEventListener.class);
    private final MonitoringStateService monitoringStateService;
    private final String userCreatedTopic;
    private final String diagramSavedTopic;
    private final String componentEditedTopic;

    public KafkaUserEventListener(
        MonitoringStateService monitoringStateService,
        @Value("${app.kafka.topic.user-created}") String userCreatedTopic,
        @Value("${app.kafka.topic.diagram-saved}") String diagramSavedTopic,
        @Value("${app.kafka.topic.component-edited}") String componentEditedTopic
    ) {
        this.monitoringStateService = monitoringStateService;
        this.userCreatedTopic = userCreatedTopic;
        this.diagramSavedTopic = diagramSavedTopic;
        this.componentEditedTopic = componentEditedTopic;
    }

    @KafkaListener(topics = "${app.kafka.topic.user-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onUserCreated(KafkaUserCreatedEvent event) {
        logger.info(
            "Kafka listener received user-created event for {} at {}",
            event.username(),
            event.createdAt()
        );
        monitoringStateService.recordKafkaConsumed(userCreatedTopic);
    }

    @KafkaListener(topics = "${app.kafka.topic.diagram-saved}", groupId = "${spring.kafka.consumer.group-id}")
    public void onDiagramSaved(DiagramSavedKafkaEvent event) {
        logger.info(
            "Kafka listener received diagram-saved event for project {} with diagram {}",
            event.projectId(),
            event.diagramId()
        );
        monitoringStateService.recordKafkaConsumed(diagramSavedTopic);
    }

    @KafkaListener(topics = "${app.kafka.topic.component-edited}", groupId = "${spring.kafka.consumer.group-id}")
    public void onComponentEdited(ComponentEditedKafkaEvent event) {
        logger.info(
            "Kafka listener received component-edited event for component {} in project {}",
            event.componentName(),
            event.projectId()
        );
        monitoringStateService.recordKafkaConsumed(componentEditedTopic);
    }
}
