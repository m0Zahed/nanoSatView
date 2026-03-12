const PROJECTS_BASE_URL =
  import.meta.env.VITE_REQUIREMENTS_BASE_URL?.replace(/\/+$/, '') ||
  'http://localhost:5001';

type JsonValue = Record<string, unknown> | null;

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

async function request<T = JsonValue>(
  path: string,
  options: RequestInit = {}
): Promise<{ status: number; data: T | JsonValue }> {
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

export type OrganizationProjects = {
  organizationId: string;
  projects: Project[];
};

export async function fetchOrganizationsWithProjects(memberId: string) {
  return request<OrganizationProjects[]>(`/members/${memberId}/organizations/projects`, {
    method: 'GET',
  });
}
