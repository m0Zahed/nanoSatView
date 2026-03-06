const DOCUMENT_PROCESSOR_BASE_URL =
  import.meta.env.VITE_DOCUMENT_PROCESSOR_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:8080';

type JsonValue = Record<string, unknown> | null;

export type KafkaFlowInfo = {
  topic: string;
  produced: number;
  consumed: number;
  lastEventAt?: string | null;
};

export type DiagramFileInfo = {
  relativePath: string;
  sizeBytes: number;
  lastModifiedAt?: string | null;
};

export type DiagramStorageInfo = {
  rootPath: string;
  totalFiles: number;
  recentFiles: DiagramFileInfo[];
};

export type RequestTrace = {
  timestamp: string;
  method: string;
  path: string;
  query?: string | null;
  status: number;
  durationMs: number;
  origin?: string | null;
  referer?: string | null;
  remoteAddr?: string | null;
  userAgent?: string | null;
  source?: string | null;
  bodyPreview?: string | null;
};

export type MonitoringSnapshot = {
  generatedAt: string;
  uptimeSeconds: number;
  kafkaEnabled: boolean;
  kafkaFlows: KafkaFlowInfo[];
  endpoints: unknown[];
  schemas: unknown[];
  diagramStorage: DiagramStorageInfo;
  recentRequests: RequestTrace[];
};

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

export async function fetchMonitoringSnapshot() {
  const response = await fetch(`${DOCUMENT_PROCESSOR_BASE_URL}/api/monitoring/snapshot`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
  const data = (await readJson(response)) as MonitoringSnapshot | null;
  return { status: response.status, data };
}

