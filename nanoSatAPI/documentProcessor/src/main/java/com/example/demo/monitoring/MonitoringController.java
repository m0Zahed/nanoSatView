package com.example.demo.monitoring;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/monitoring")
public class MonitoringController {

    private final MonitoringStateService monitoringStateService;

    public MonitoringController(MonitoringStateService monitoringStateService) {
        this.monitoringStateService = monitoringStateService;
    }

    @GetMapping("/snapshot")
    public MonitoringSnapshot snapshot() {
        return monitoringStateService.snapshot();
    }
}
