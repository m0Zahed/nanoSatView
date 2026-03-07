const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const REMOTE_LAN_ENABLED = TRUTHY_VALUES.has(
  String(import.meta.env.TESTING_REMOTE_LAN || '')
    .trim()
    .toLowerCase()
);
const DOCUMENT_PROCESSOR_BASE_URL =
  REMOTE_LAN_ENABLED
    ? ''
    : import.meta.env.VITE_DOCUMENT_PROCESSOR_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:8080';

type JsonValue = Record<string, unknown> | null;

export type DiagramSaveRequest = {
  projectId: string;
  memberId: string;
  diagramName: string;
  diagramDescription: string;
  xmlContent: string;
  jsonContent?: string;
};

export type DiagramSaveResponse = {
  success?: boolean;
  message?: string;
  diagramId?: string;
  time?: string;
  filePath?: string;
};

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

export async function saveDiagramEvent(payload: DiagramSaveRequest) {
  const response = await fetch(`${DOCUMENT_PROCESSOR_BASE_URL}/api/diagrams/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = (await readJson(response)) as DiagramSaveResponse | null;
  return { status: response.status, data };
}
