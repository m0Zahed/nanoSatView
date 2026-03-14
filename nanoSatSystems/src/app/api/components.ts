const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const REMOTE_LAN_ENABLED = TRUTHY_VALUES.has(
  String(import.meta.env.TESTING_REMOTE_LAN || '')
    .trim()
    .toLowerCase()
);
const DEFAULT_COMPONENTS_BASE_URL = REMOTE_LAN_ENABLED
  ? `http://${window.location.hostname}:5001`
  : 'http://localhost:5001';
const COMPONENTS_BASE_URL =
  import.meta.env.VITE_REQUIREMENTS_BASE_URL?.replace(/\/+$/, '') ||
  DEFAULT_COMPONENTS_BASE_URL;

const envCandidates = [
  import.meta.env.MODE,
  import.meta.env.VITE_ENV,
  import.meta.env.VITE_APP_ENV,
]
  .filter(Boolean)
  .map((value) => String(value).trim().toLowerCase());

const BYPASS_COMPONENTS_API = TRUTHY_VALUES.has(
  String(import.meta.env.VITE_BYPASS_REQUIREMENTS_API || '')
    .trim()
    .toLowerCase()
);
const IS_TESTING_ENV = envCandidates.includes('testing');
const USE_MOCK_COMPONENTS_API = IS_TESTING_ENV || BYPASS_COMPONENTS_API;
const SHOULD_FALLBACK_TO_MOCK_ON_LOCAL_FAILURE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
  COMPONENTS_BASE_URL
);

type JsonValue = Record<string, unknown> | null;

export type ComponentBuilderBlob = {
  id: string;
  type: 'text' | 'document' | 'diagram' | 'requirement';
  title: string;
  content: string;
  sourceId?: string | null;
};

export type ProjectComponent = {
  id: string;
  name: string;
  type: string;
  quantity: number;
  notes: string;
  projectId: string;
  requirementIds: string[];
  builderStack: ComponentBuilderBlob[];
  markdownDraft: string;
  lastEditedBy: string;
  lastEditedByName: string;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectComponentPayload = Omit<
  ProjectComponent,
  'id' | 'lastEditedBy' | 'lastEditedByName' | 'lastEditedAt' | 'createdAt' | 'updatedAt'
> & {
  editorId: string;
  editorName: string;
};

export type ProjectComponentEditorPayload = Omit<ProjectComponentPayload, 'projectId' | 'editorId' | 'editorName'>;

export type ComponentAuditEvent = {
  id: string;
  projectId: string;
  componentId: string;
  componentName: string;
  action: string;
  editorId: string;
  editorName: string;
  eventTime: string;
};

const mockComponentsByProject = new Map<string, ProjectComponent[]>();
const mockComponentEventsByProject = new Map<string, ComponentAuditEvent[]>();

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

function parseJsonBody(body: BodyInit | null | undefined): Record<string, unknown> {
  if (!body || typeof body !== 'string') {
    return {};
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry, index, items) => items.findIndex((candidate) => candidate.toLowerCase() === entry.toLowerCase()) === index);
}

function normalizeBuilderStack(value: unknown): ComponentBuilderBlob[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry, index) => ({
      id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : `blob-${index}`,
      type:
        entry.type === 'document' || entry.type === 'diagram' || entry.type === 'requirement' || entry.type === 'text'
          ? entry.type
          : 'text',
      title: typeof entry.title === 'string' ? entry.title : '',
      content: typeof entry.content === 'string' ? entry.content : '',
      sourceId: typeof entry.sourceId === 'string' && entry.sourceId.trim() ? entry.sourceId.trim() : null,
    }));
}

function createMockId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function mockRequest<T = JsonValue>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | JsonValue }> {
  const method = String(options.method || 'GET').toUpperCase();
  const body = parseJsonBody(options.body);
  const now = new Date().toISOString();

  const projectComponentsMatch = path.match(/^\/projects\/([^/]+)\/components$/);
  if (projectComponentsMatch && method === 'GET') {
    return {
      status: 200,
      data: [...(mockComponentsByProject.get(projectComponentsMatch[1]) || [])] as T,
    };
  }

  const projectEventsMatch = path.match(/^\/projects\/([^/]+)\/component-events(?:\?.*)?$/);
  if (projectEventsMatch && method === 'GET') {
    return {
      status: 200,
      data: [...(mockComponentEventsByProject.get(projectEventsMatch[1]) || [])] as T,
    };
  }

  if (path === '/components' && method === 'POST') {
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const type = typeof body.type === 'string' ? body.type.trim() : '';
    const editorId = typeof body.editorId === 'string' ? body.editorId.trim() : '';
    const editorName = typeof body.editorName === 'string' ? body.editorName.trim() : '';

    if (!projectId || !name || !type || !editorId || !editorName) {
      return {
        status: 400,
        data: { error: { code: 'INVALID_COMPONENT', message: 'Missing required component fields.' } },
      };
    }

    const component: ProjectComponent = {
      id: createMockId('component'),
      name,
      type,
      quantity: typeof body.quantity === 'number' && body.quantity > 0 ? body.quantity : 1,
      notes: typeof body.notes === 'string' ? body.notes : '',
      projectId,
      requirementIds: normalizeStringArray(body.requirementIds),
      builderStack: normalizeBuilderStack(body.builderStack),
      markdownDraft: typeof body.markdownDraft === 'string' ? body.markdownDraft : '',
      lastEditedBy: editorId,
      lastEditedByName: editorName,
      lastEditedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const existing = mockComponentsByProject.get(projectId) || [];
    mockComponentsByProject.set(projectId, [component, ...existing]);

    const event: ComponentAuditEvent = {
      id: createMockId('component-event'),
      projectId,
      componentId: component.id,
      componentName: component.name,
      action: 'created',
      editorId,
      editorName,
      eventTime: now,
    };
    const existingEvents = mockComponentEventsByProject.get(projectId) || [];
    mockComponentEventsByProject.set(projectId, [event, ...existingEvents]);

    return { status: 201, data: component as T };
  }

  const componentMatch = path.match(/^\/components\/([^/?]+)(?:\?.*)?$/);
  if (componentMatch && method === 'PUT') {
    const componentId = componentMatch[1];
    const editorId = typeof body.editorId === 'string' ? body.editorId.trim() : '';
    const editorName = typeof body.editorName === 'string' ? body.editorName.trim() : '';

    for (const [projectId, components] of mockComponentsByProject.entries()) {
      const index = components.findIndex((component) => component.id === componentId);
      if (index < 0) {
        continue;
      }

      const updated: ProjectComponent = {
        ...components[index],
        name: typeof body.name === 'string' ? body.name.trim() : components[index].name,
        type: typeof body.type === 'string' ? body.type.trim() : components[index].type,
        quantity: typeof body.quantity === 'number' && body.quantity > 0 ? body.quantity : components[index].quantity,
        notes: typeof body.notes === 'string' ? body.notes : components[index].notes,
        projectId,
        requirementIds: normalizeStringArray(body.requirementIds),
        builderStack: normalizeBuilderStack(body.builderStack),
        markdownDraft: typeof body.markdownDraft === 'string' ? body.markdownDraft : components[index].markdownDraft,
        lastEditedBy: editorId || components[index].lastEditedBy,
        lastEditedByName: editorName || components[index].lastEditedByName,
        lastEditedAt: now,
        updatedAt: now,
      };

      const nextComponents = [...components];
      nextComponents[index] = updated;
      mockComponentsByProject.set(projectId, nextComponents);

      const event: ComponentAuditEvent = {
        id: createMockId('component-event'),
        projectId,
        componentId: updated.id,
        componentName: updated.name,
        action: 'updated',
        editorId: updated.lastEditedBy,
        editorName: updated.lastEditedByName,
        eventTime: now,
      };
      const existingEvents = mockComponentEventsByProject.get(projectId) || [];
      mockComponentEventsByProject.set(projectId, [event, ...existingEvents]);

      return { status: 200, data: updated as T };
    }

    return {
      status: 404,
      data: { error: { code: 'COMPONENT_NOT_FOUND', message: 'Component not found.' } },
    };
  }

  if (componentMatch && method === 'DELETE') {
    const componentId = componentMatch[1];
    const url = new URL(`http://mock.local${path}`);
    const editorId = url.searchParams.get('editorId')?.trim() || '';
    const editorName = url.searchParams.get('editorName')?.trim() || '';

    for (const [projectId, components] of mockComponentsByProject.entries()) {
      const component = components.find((candidate) => candidate.id === componentId);
      if (!component) {
        continue;
      }

      mockComponentsByProject.set(
        projectId,
        components.filter((candidate) => candidate.id !== componentId)
      );

      const event: ComponentAuditEvent = {
        id: createMockId('component-event'),
        projectId,
        componentId: component.id,
        componentName: component.name,
        action: 'deleted',
        editorId: editorId || component.lastEditedBy,
        editorName: editorName || component.lastEditedByName,
        eventTime: now,
      };
      const existingEvents = mockComponentEventsByProject.get(projectId) || [];
      mockComponentEventsByProject.set(projectId, [event, ...existingEvents]);

      return { status: 204, data: null };
    }

    return {
      status: 404,
      data: { error: { code: 'COMPONENT_NOT_FOUND', message: 'Component not found.' } },
    };
  }

  return {
    status: 404,
    data: {
      error: {
        code: 'NOT_IMPLEMENTED_IN_MOCK',
        message: `No mock handler for ${method} ${path}`,
      },
    },
  };
}

async function request<T = JsonValue>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | JsonValue }> {
  if (USE_MOCK_COMPONENTS_API) {
    return mockRequest<T>(path, options);
  }

  try {
    const response = await fetch(`${COMPONENTS_BASE_URL}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await readJson(response);
    return { status: response.status, data: data as T };
  } catch (error) {
    if (SHOULD_FALLBACK_TO_MOCK_ON_LOCAL_FAILURE) {
      console.warn('[components api] backend unreachable; falling back to mock API');
      return mockRequest<T>(path, options);
    }
    return {
      status: 0,
      data: {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reach components API.',
        },
      },
    };
  }
}

export async function fetchProjectComponents(projectId: string) {
  return request<ProjectComponent[]>(`/projects/${projectId}/components`, {
    method: 'GET',
  });
}

export async function fetchProjectComponentEvents(projectId: string, take = 25) {
  return request<ComponentAuditEvent[]>(`/projects/${projectId}/component-events?take=${take}`, {
    method: 'GET',
  });
}

export async function createComponent(payload: ProjectComponentPayload) {
  return request<ProjectComponent>('/components', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateComponent(id: string, payload: ProjectComponentPayload) {
  return request<ProjectComponent>(`/components/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteComponent(id: string, editorId: string, editorName: string) {
  const params = new URLSearchParams({
    editorId,
    editorName,
  });
  return request<null>(`/components/${id}?${params.toString()}`, {
    method: 'DELETE',
  });
}
