package com.example.demo.web;

import com.example.demo.diagram.DiagramSaveRequest;
import com.example.demo.diagram.DiagramSaveResponse;
import com.example.demo.diagram.DiagramSaveService;
import com.example.demo.diagram.DiagramSummaryResponse;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagrams")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class DiagramController {

    private final DiagramSaveService diagramSaveService;

    public DiagramController(DiagramSaveService diagramSaveService) {
        this.diagramSaveService = diagramSaveService;
    }

    @PostMapping("/save")
    public ResponseEntity<DiagramSaveResponse> saveDiagram(@Valid @RequestBody DiagramSaveRequest request) {
        try {
            DiagramSaveResponse response = diagramSaveService.save(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException ex) {
            DiagramSaveResponse failure = new DiagramSaveResponse(
                false,
                "Failed to save diagram: " + ex.getMessage(),
                null,
                null,
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(failure);
        } catch (RuntimeException ex) {
            DiagramSaveResponse failure = new DiagramSaveResponse(
                false,
                "Failed to persist diagram event: " + ex.getMessage(),
                null,
                null,
                null
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(failure);
        }
    }

    @GetMapping("/project/{projectId}")
    public List<DiagramSummaryResponse> getByProject(@PathVariable String projectId) {
        return diagramSaveService.findByProjectId(projectId);
    }

    @GetMapping("/{diagramId}")
    public ResponseEntity<DiagramSummaryResponse> getById(@PathVariable String diagramId) {
        DiagramSummaryResponse response = diagramSaveService.findById(diagramId);
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }
}
