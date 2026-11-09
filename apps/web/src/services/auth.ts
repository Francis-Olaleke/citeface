
const API_URL = "/api/auth";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
}

interface AuthResponse {
  message: string;
  user: AuthUser;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  username: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export class AuthServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthServiceError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  let data: Record<string, unknown> = {};

  try {
    const result: unknown = await response.json();

    if (typeof result === "object" && result !== null) {
      data = result as Record<string, unknown>;
    }
  } catch {
    // Handle empty or non-JSON responses.
  }

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : typeof data.error === "string"
          ? data.error
          : "Something went wrong. Please try again.";

    throw new AuthServiceError(message, response.status);
  }

  return data as T;
}

export async function registerUser(
  userData: RegisterData
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(userData),
  });

  return handleResponse<AuthResponse>(response);
}

export async function loginUser(
  credentials: LoginData
): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthResponse>(response);
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/me`, {
    method: "GET",
    credentials: "include",
  });

  const data = await handleResponse<AuthResponse>(response);

  return data.user;
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  await handleResponse<{ message: string }>(response);
}

// Request a password-reset email.
export async function requestPasswordReset(
  email: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  return handleResponse<{ message: string }>(response);
}

// Submit a new password using the reset token.
export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ token, password }),
  });

  return handleResponse<{ message: string }>(response);
}