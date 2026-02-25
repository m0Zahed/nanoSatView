package com.example.demo.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaUserEventPublisher {

    private final KafkaTemplate<String, KafkaUserCreatedEvent> kafkaTemplate;
    private final String userCreatedTopic;

    public KafkaUserEventPublisher(
        KafkaTemplate<String, KafkaUserCreatedEvent> kafkaTemplate,
        @Value("${app.kafka.topic.user-created}") String userCreatedTopic
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.userCreatedTopic = userCreatedTopic;
    }

    public void publish(KafkaUserCreatedEvent event) {
        kafkaTemplate.send(userCreatedTopic, event.username(), event);
    }
}
