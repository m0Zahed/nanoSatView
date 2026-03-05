package com.example.demo.monitoring;

import java.util.List;

public record DiagramStorageInfo(
    String rootPath,
    long totalFiles,
    List<DiagramFileInfo> recentFiles
) {
}
