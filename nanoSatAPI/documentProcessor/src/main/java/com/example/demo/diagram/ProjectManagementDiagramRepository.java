package com.example.demo.diagram;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectManagementDiagramRepository extends JpaRepository<ProjectManagementDiagramEntity, String> {

    List<ProjectManagementDiagramEntity> findByProjectIdOrderByEventTimeDesc(String projectId);
}
