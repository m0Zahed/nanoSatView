package com.example.demo.monitoring;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class MonitoringPageController {

    private static final List<String> MONITOR_FILE_CANDIDATES = List.of(
        "tools/monitor/index.html",
        "../tools/monitor/index.html",
        "../../tools/monitor/index.html"
    );

    @GetMapping(
        value = {"/monitor", "/monitor.html", "/tools/monitor", "/tools/monitor/", "/tools/monitor/index.html"},
        produces = MediaType.TEXT_HTML_VALUE
    )
    @ResponseBody
    public ResponseEntity<Resource> monitorPage() throws IOException {
        for (String candidate : MONITOR_FILE_CANDIDATES) {
            Path path = Paths.get(candidate).toAbsolutePath().normalize();
            if (Files.isRegularFile(path)) {
                return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(new ByteArrayResource(Files.readAllBytes(path)));
            }
        }

        return ResponseEntity.notFound().build();
    }
}
