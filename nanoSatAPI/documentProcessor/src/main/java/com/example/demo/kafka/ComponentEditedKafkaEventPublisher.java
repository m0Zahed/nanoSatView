package com.example.demo.kafka;

import com.example.demo.monitoring.MonitoringStateService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class ComponentEditedKafkaEventPublisher {

    private final KafkaTemplate<String, ComponentEditedKafkaEvent> kafkaTemplate;
    private final String topicName;
    private final MonitoringStateService monitoringStateService;

    public ComponentEditedKafkaEventPublisher(
        KafkaTemplate<String, ComponentEditedKafkaEvent> kafkaTemplate,
        @Value("${app.kafka.topic.component-edited}") String topicName,
        MonitoringStateService monitoringStateService
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicName = topicName;
        this.monitoringStateService = monitoringStateService;
    }

    public void publish(ComponentEditedKafkaEvent event) {
        kafkaTemplate.send(topicName, event.projectId(), event);
        monitoringStateService.recordKafkaProduced(topicName);
    }
}
