import { apiBaseUrl } from "@/lib/api/config";
import { type AuthResponse } from "@/lib/api/types";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Unable to log in");
  }

  return response.json() as Promise<AuthResponse>;
}

export async function register(displayName: string, email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ displayName, email, password })
  });

  if (!response.ok) {
    throw new Error(response.status === 409 ? "Email already registered" : "Unable to create profile");
  }

  return response.json() as Promise<AuthResponse>;
}
