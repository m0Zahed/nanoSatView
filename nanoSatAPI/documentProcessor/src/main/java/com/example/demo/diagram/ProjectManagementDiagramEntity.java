package com.example.demo.diagram;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "project_management_diagrams")
public class ProjectManagementDiagramEntity {

    @Id
    @Column(name = "diagram_id", nullable = false, length = 64)
    private String diagramId;

    @Column(name = "event_time", nullable = false)
    private Instant eventTime;

    @Column(name = "id_of_last_member_who_edited", nullable = false, length = 200)
    private String idOfLastMemberWhoEdited;

    @Column(name = "project_id", nullable = false, length = 200)
    private String projectId;

    @Column(name = "diagram_name", nullable = false, length = 400)
    private String diagramName;

    @Column(name = "diagram_description", length = 4000)
    private String diagramDescription;

    @Column(name = "filepath_local", nullable = false, length = 1000)
    private String filepathLocal;

    public String getDiagramId() {
        return diagramId;
    }

    public void setDiagramId(String diagramId) {
        this.diagramId = diagramId;
    }

    public Instant getEventTime() {
        return eventTime;
    }

    public void setEventTime(Instant eventTime) {
        this.eventTime = eventTime;
    }

    public String getIdOfLastMemberWhoEdited() {
        return idOfLastMemberWhoEdited;
    }

    public void setIdOfLastMemberWhoEdited(String idOfLastMemberWhoEdited) {
        this.idOfLastMemberWhoEdited = idOfLastMemberWhoEdited;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getDiagramName() {
        return diagramName;
    }

    public void setDiagramName(String diagramName) {
        this.diagramName = diagramName;
    }

    public String getDiagramDescription() {
        return diagramDescription;
    }

    public void setDiagramDescription(String diagramDescription) {
        this.diagramDescription = diagramDescription;
    }

    public String getFilepathLocal() {
        return filepathLocal;
    }

    public void setFilepathLocal(String filepathLocal) {
        this.filepathLocal = filepathLocal;
    }
}
