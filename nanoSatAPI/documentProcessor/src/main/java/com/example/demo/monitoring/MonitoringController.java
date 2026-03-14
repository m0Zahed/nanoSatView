package com.example.demo.monitoring;

import com.example.demo.kafka.ComponentEditedKafkaEvent;
import com.example.demo.kafka.ComponentEditedKafkaEventPublisher;
import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringStateService monitoringStateService;
    private final ObjectProvider<ComponentEditedKafkaEventPublisher> componentEditedKafkaEventPublisher;

    public MonitoringController(
        MonitoringStateService monitoringStateService,
        ObjectProvider<ComponentEditedKafkaEventPublisher> componentEditedKafkaEventPublisher
    ) {
        this.monitoringStateService = monitoringStateService;
        this.componentEditedKafkaEventPublisher = componentEditedKafkaEventPublisher;
    }

    @GetMapping("/snapshot")
    public MonitoringSnapshot snapshot() {
        return monitoringStateService.snapshot();
    }

    @PostMapping("/component-events")
    public Map<String, Object> publishComponentEvent(@RequestBody ComponentEditedKafkaEvent event) {
        monitoringStateService.recordComponentEvent(event);
        componentEditedKafkaEventPublisher.ifAvailable(publisher -> publisher.publish(event));
        return Map.of("accepted", true);
    }
}
