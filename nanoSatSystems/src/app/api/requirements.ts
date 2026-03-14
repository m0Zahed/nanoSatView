const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const REMOTE_LAN_ENABLED = TRUTHY_VALUES.has(
  String(import.meta.env.TESTING_REMOTE_LAN || '')
    .trim()
    .toLowerCase()
);
const DEFAULT_REQUIREMENTS_BASE_URL = REMOTE_LAN_ENABLED
  ? `http://${window.location.hostname}:5001`
  : 'http://localhost:5001';
const REQUIREMENTS_BASE_URL =
  import.meta.env.VITE_REQUIREMENTS_BASE_URL?.replace(/\/+$/, '') ||
  DEFAULT_REQUIREMENTS_BASE_URL;

const envCandidates = [
  import.meta.env.MODE,
  import.meta.env.VITE_ENV,
  import.meta.env.VITE_APP_ENV,
]
  .filter(Boolean)
  .map((value) => String(value).trim().toLowerCase());

const BYPASS_REQUIREMENTS_API = TRUTHY_VALUES.has(
  String(import.meta.env.VITE_BYPASS_REQUIREMENTS_API || '')
    .trim()
    .toLowerCase()
);
const IS_TESTING_ENV = envCandidates.includes('testing');
const USE_MOCK_REQUIREMENTS_API = IS_TESTING_ENV || BYPASS_REQUIREMENTS_API;
const SHOULD_FALLBACK_TO_MOCK_ON_LOCAL_FAILURE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(
  REQUIREMENTS_BASE_URL
);

type JsonValue = Record<string, unknown> | null;

export type ProjectRequirement = {
  id: string;
  reqId: string;
  description: string;
  subsystem: string;
  tags: string[];
  assignedComponents: string[];
  projectId: string;
};

export type RequirementPayload = Omit<ProjectRequirement, 'id'>;

const mockRequirementsByProject = new Map<string, ProjectRequirement[]>();

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

async function mockRequest<T = JsonValue>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | JsonValue }> {
  const method = String(options.method || 'GET').toUpperCase();
  const body = parseJsonBody(options.body);

  const projectRequirementsMatch = path.match(/^\/projects\/([^/]+)\/requirements$/);
  if (projectRequirementsMatch && method === 'GET') {
    const projectId = projectRequirementsMatch[1];
    return {
      status: 200,
      data: [...(mockRequirementsByProject.get(projectId) || [])] as T,
    };
  }

  if (path === '/requirements' && method === 'POST') {
    const reqId = typeof body.reqId === 'string' ? body.reqId.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const subsystem = typeof body.subsystem === 'string' ? body.subsystem.trim() : '';
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';

    if (!reqId || !description || !subsystem || !projectId) {
      return {
        status: 400,
        data: { error: { code: 'INVALID_REQUIREMENT', message: 'Missing required requirement fields.' } },
      };
    }

    const requirement: ProjectRequirement = {
      id:
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      reqId,
      description,
      subsystem,
      tags: normalizeStringArray(body.tags),
      assignedComponents: normalizeStringArray(body.assignedComponents),
      projectId,
    };

    const existing = mockRequirementsByProject.get(projectId) || [];
    mockRequirementsByProject.set(projectId, [...existing, requirement]);
    return { status: 201, data: requirement as T };
  }

  const requirementMatch = path.match(/^\/requirements\/([^/]+)$/);
  if (requirementMatch && method === 'DELETE') {
    const requirementId = requirementMatch[1];
    for (const [projectId, requirements] of mockRequirementsByProject.entries()) {
      const nextRequirements = requirements.filter((requirement) => requirement.id !== requirementId);
      if (nextRequirements.length !== requirements.length) {
        mockRequirementsByProject.set(projectId, nextRequirements);
        return { status: 204, data: null };
      }
    }

    return {
      status: 404,
      data: { error: { code: 'REQUIREMENT_NOT_FOUND', message: 'Requirement not found.' } },
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
  if (USE_MOCK_REQUIREMENTS_API) {
    return mockRequest<T>(path, options);
  }

  try {
    const response = await fetch(`${REQUIREMENTS_BASE_URL}${path}`, {
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
      console.warn('[requirements api] backend unreachable; falling back to mock API');
      return mockRequest<T>(path, options);
    }
    return {
      status: 0,
      data: {
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to reach requirements API.',
        },
      },
    };
  }
}

export async function fetchProjectRequirements(projectId: string) {
  return request<ProjectRequirement[]>(`/projects/${projectId}/requirements`, {
    method: 'GET',
  });
}

export async function createRequirement(payload: RequirementPayload) {
  return request<ProjectRequirement>('/requirements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteRequirement(id: string) {
  return request<null>(`/requirements/${id}`, {
    method: 'DELETE',
  });
}
