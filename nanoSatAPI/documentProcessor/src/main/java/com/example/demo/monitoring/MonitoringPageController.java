package com.example.demo.monitoring;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class MonitoringPageController {

    @GetMapping("/monitor")
    public String monitorPage() {
        return "redirect:/monitor.html";
    }
}
