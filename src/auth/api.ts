export type Role = "candidate" | "recruiter" | "coordinator";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthResponse = {
  user: AuthUser;
  csrf_token: string;
};

let csrfToken = "";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (csrfToken && init.method && init.method !== "GET") {
    headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? ""}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail =
      body && typeof body === "object" && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function rememberSession<T extends AuthResponse>(result: T): T {
  csrfToken = result.csrf_token;
  return result;
}

export async function getSession(): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/session");
  return rememberSession(result);
}

export async function login(email: string, password: string, role?: Role): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
  return rememberSession(result);
}

export async function registerCandidate(name: string, email: string, password: string): Promise<void> {
  await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function registerInvitation(
  name: string,
  email: string,
  password: string,
  invitationToken: string,
): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/register/invitation", {
    method: "POST",
    body: JSON.stringify({ name, email, password, invitation_token: invitationToken }),
  });
  return rememberSession(result);
}

export async function verifyEmail(token: string): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return rememberSession(result);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await request("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function createInvitation(email: string, role: Exclude<Role, "candidate">): Promise<void> {
  await request("/api/auth/invitations", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
  csrfToken = "";
}

export function googleSignIn(role: Role): void {
  const base = import.meta.env.VITE_API_BASE_URL ?? "";
  window.location.assign(`${base}/api/auth/google/start?role=${role}`);
}
