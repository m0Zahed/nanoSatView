package com.example.demo.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaUserEventListener {

    private static final Logger logger = LoggerFactory.getLogger(KafkaUserEventListener.class);

    @KafkaListener(topics = "${app.kafka.topic.user-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void onUserCreated(KafkaUserCreatedEvent event) {
        logger.info(
            "Kafka listener received user-created event for {} at {}",
            event.username(),
            event.createdAt()
        );
    }
}
