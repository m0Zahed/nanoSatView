package com.example.demo.event;

import com.example.demo.kafka.KafkaUserCreatedEvent;
import com.example.demo.kafka.KafkaUserEventPublisher;
import java.time.Instant;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final ApplicationEventPublisher eventPublisher;
    private final ObjectProvider<KafkaUserEventPublisher> kafkaUserEventPublisher;

    public UserService(
        ApplicationEventPublisher eventPublisher,
        ObjectProvider<KafkaUserEventPublisher> kafkaUserEventPublisher
    ) {
        this.eventPublisher = eventPublisher;
        this.kafkaUserEventPublisher = kafkaUserEventPublisher;
    }

    public void createUser(String username) {
        Instant createdAt = Instant.now();
        UserCreatedEvent springEvent = new UserCreatedEvent(username, createdAt);
        KafkaUserCreatedEvent kafkaEvent = new KafkaUserCreatedEvent(username, createdAt);

        eventPublisher.publishEvent(springEvent);
        kafkaUserEventPublisher.ifAvailable(publisher -> publisher.publish(kafkaEvent));
    }
}
