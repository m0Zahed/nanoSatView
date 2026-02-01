export const API_BASE_URL =
  (import.meta.env.VITE_AUTH_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  'http://localhost:5000';

export type User = {
  id: string;
  email: string;
  fullName: string;
  username: string | null;
  dateOfBirth: string | null;
  emailVerified: boolean;
  pictureUrl: string | null;
  isAdmin: boolean;
  profileComplete: boolean;
  hasPassword: boolean;
  googleLinked: boolean;
};

type JsonValue = Record<string, unknown> | null;

async function readJson(response: Response): Promise<JsonValue> {
  try {
    return (await response.json()) as JsonValue;
  } catch {
    return null;
  }
}

export async function getJson(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });
  const data = await readJson(response);
  return { status: response.status, data };
}

export async function postJson(path: string, body?: Record<string, unknown>) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await readJson(response);
  return { status: response.status, data };
}
