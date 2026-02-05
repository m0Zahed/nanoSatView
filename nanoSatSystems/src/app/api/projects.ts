const PROJECTS_BASE_URL =
  import.meta.env.VITE_REQUIREMENTS_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:5001';
const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

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

type JsonValue = Record<string, unknown> | null;

export type Project = {
  id: string;
  name: string;
  description: string;
  owner: string;
  isPublic: boolean;
  personalProject?: boolean;
  organizationId: string;
  documentIds: string[];
  memberIds: string[];
  pendingRequests?: string[];
  requirementsListId: string;
  componentsListId: string;
  timelineId: string;
  integrationsId: string;
  createdAt: string;
  updatedAt: string;
};

export type InviteResponse = {
  token: string;
  expiresAt: string;
  link?: string | null;
};

export type OrganizationProjects = {
  organizationId: string;
  projects: Project[];
};

type MockInvite = {
  projectId: string;
  expiresAt: string;
};

const mockInvites = new Map<string, MockInvite>();
let mockProjects: Project[] = [
  {
    id: 'mock-project-1',
    name: 'UI Testing Project',
    description: 'Local dummy project for dashboard testing.',
    owner: 'mock-user',
    isPublic: false,
    personalProject: true,
    organizationId: 'personal',
    documentIds: [],
    memberIds: ['mock-user'],
    pendingRequests: [],
    requirementsListId: 'REQ-MOCK-001',
    componentsListId: 'CMP-MOCK-001',
    timelineId: 'TML-MOCK-001',
    integrationsId: 'INT-MOCK-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

if (USE_MOCK_REQUIREMENTS_API) {
  // Keep this visible in console to avoid confusion when backend calls are bypassed.
  console.info('[projects api] using mock requirements API');
}

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

function createMockId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function groupProjectsByOrganization(projects: Project[]): OrganizationProjects[] {
  const byOrg = new Map<string, Project[]>();
  for (const project of projects) {
    const organizationId = project.organizationId || 'personal';
    const existing = byOrg.get(organizationId) || [];
    existing.push(project);
    byOrg.set(organizationId, existing);
  }
  return Array.from(byOrg.entries()).map(([organizationId, orgProjects]) => ({
    organizationId,
    projects: orgProjects,
  }));
}

async function mockRequest<T = JsonValue>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | JsonValue }> {
  const method = String(options.method || 'GET').toUpperCase();
  const body = parseJsonBody(options.body);
  const now = new Date();

  if (path === '/projects' && method === 'GET') {
    return { status: 200, data: [...mockProjects] as T };
  }

  if (path === '/projects' && method === 'POST') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return {
        status: 400,
        data: { error: { code: 'INVALID_PROJECT', message: 'Project name is required.' } },
      };
    }

    const organizationId =
      typeof body.organizationId === 'string' && body.organizationId
        ? body.organizationId
        : 'personal';

    const project: Project = {
      id: createMockId('mock-project'),
      name,
      description: typeof body.description === 'string' ? body.description : '',
      owner: typeof body.owner === 'string' ? body.owner : 'mock-user',
      isPublic: Boolean(body.isPublic),
      personalProject:
        typeof body.personalProject === 'boolean'
          ? body.personalProject
          : organizationId === 'personal',
      organizationId,
      documentIds: Array.isArray(body.documentIds) ? (body.documentIds as string[]) : [],
      memberIds: Array.isArray(body.memberIds) ? (body.memberIds as string[]) : [],
      pendingRequests: Array.isArray(body.pendingRequests) ? (body.pendingRequests as string[]) : [],
      requirementsListId:
        typeof body.requirementsListId === 'string' ? body.requirementsListId : '',
      componentsListId: typeof body.componentsListId === 'string' ? body.componentsListId : '',
      timelineId: typeof body.timelineId === 'string' ? body.timelineId : '',
      integrationsId: typeof body.integrationsId === 'string' ? body.integrationsId : '',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    mockProjects = [...mockProjects, project];
    return { status: 201, data: project as T };
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch && method === 'PUT') {
    const projectId = projectMatch[1];
    const index = mockProjects.findIndex((project) => project.id === projectId);
    if (index < 0) {
      return {
        status: 404,
        data: { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } },
      };
    }

    const updated: Project = {
      ...mockProjects[index],
      ...body,
      id: mockProjects[index].id,
      updatedAt: now.toISOString(),
    } as Project;

    mockProjects = mockProjects.map((project, i) => (i === index ? updated : project));
    return { status: 200, data: updated as T };
  }

  if (projectMatch && method === 'DELETE') {
    const projectId = projectMatch[1];
    mockProjects = mockProjects.filter((project) => project.id !== projectId);
    return { status: 204, data: null };
  }

  const inviteMatch = path.match(/^\/projects\/([^/]+)\/invites$/);
  if (inviteMatch && method === 'POST') {
    const projectId = inviteMatch[1];
    const project = mockProjects.find((p) => p.id === projectId);
    if (!project) {
      return {
        status: 404,
        data: { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } },
      };
    }

    const token = createMockId('invite');
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    mockInvites.set(token, { projectId, expiresAt });
    return {
      status: 200,
      data: {
        token,
        expiresAt,
        link: token,
      } as T,
    };
  }

  if (path === '/projects/join' && method === 'POST') {
    const token = typeof body.token === 'string' ? body.token : '';
    const memberId = typeof body.memberId === 'string' ? body.memberId : '';
    const invite = token ? mockInvites.get(token) : null;
    if (!invite || new Date(invite.expiresAt).getTime() < now.getTime()) {
      return {
        status: 400,
        data: { error: { code: 'INVALID_INVITE', message: 'Invalid or expired invite token.' } },
      };
    }

    const index = mockProjects.findIndex((project) => project.id === invite.projectId);
    if (index < 0) {
      return {
        status: 404,
        data: { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found.' } },
      };
    }

    const current = mockProjects[index];
    const memberIds =
      current.memberIds.includes(memberId) || !memberId
        ? current.memberIds
        : [...current.memberIds, memberId];

    const updated: Project = {
      ...current,
      memberIds,
      updatedAt: now.toISOString(),
    };

    mockProjects = mockProjects.map((project, i) => (i === index ? updated : project));
    return { status: 200, data: updated as T };
  }

  const memberProjectsMatch = path.match(/^\/members\/([^/]+)\/organizations\/projects$/);
  if (memberProjectsMatch && method === 'GET') {
    return {
      status: 200,
      data: groupProjectsByOrganization(mockProjects) as T,
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

  const response = await fetch(`${PROJECTS_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await readJson(response);
  return { status: response.status, data: data as T };
}

export async function fetchProjects() {
  return request<Project[]>('/projects', { method: 'GET' });
}

export async function createProject(payload: Partial<Project>) {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(id: string, payload: Partial<Project>) {
  return request<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(id: string) {
  return request<null>(`/projects/${id}`, { method: 'DELETE' });
}

export async function createInvite(projectId: string) {
  return request<InviteResponse>(`/projects/${projectId}/invites`, {
    method: 'POST',
  });
}

export async function joinProject(token: string, memberId: string) {
  return request<Project>('/projects/join', {
    method: 'POST',
    body: JSON.stringify({ token, memberId }),
  });
}

export async function fetchOrganizationsWithProjects(memberId: string) {
  return request<OrganizationProjects[]>(`/members/${memberId}/organizations/projects`, {
    method: 'GET',
  });
}
