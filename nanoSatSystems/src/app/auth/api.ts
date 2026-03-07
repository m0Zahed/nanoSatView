const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);
const REMOTE_LAN_ENABLED = TRUTHY_VALUES.has(
  String(import.meta.env.TESTING_REMOTE_LAN || '')
    .trim()
    .toLowerCase()
);
const IS_LOCALHOST_HOSTNAME =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEFAULT_AUTH_BASE_URL = REMOTE_LAN_ENABLED
  ? `http://${window.location.hostname}:5000`
  : IS_LOCALHOST_HOSTNAME
    ? 'http://localhost:5000'
    : '/api';

export const API_BASE_URL =
  (import.meta.env.VITE_AUTH_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
  DEFAULT_AUTH_BASE_URL;

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
