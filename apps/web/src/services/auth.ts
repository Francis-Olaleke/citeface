
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

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Something went wrong."
    );
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
