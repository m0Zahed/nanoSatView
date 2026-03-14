package com.example.demo.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@EnableKafka
@ConditionalOnProperty(name = "app.kafka.enabled", havingValue = "true")
public class KafkaConfig {

    @Bean
    public NewTopic userCreatedTopic(@Value("${app.kafka.topic.user-created}") String topicName) {
        return TopicBuilder.name(topicName)
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic diagramSavedTopic(@Value("${app.kafka.topic.diagram-saved}") String topicName) {
        return TopicBuilder.name(topicName)
            .partitions(1)
            .replicas(1)
            .build();
    }

    @Bean
    public NewTopic componentEditedTopic(@Value("${app.kafka.topic.component-edited}") String topicName) {
        return TopicBuilder.name(topicName)
            .partitions(1)
            .replicas(1)
            .build();
    }
}
