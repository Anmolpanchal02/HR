const AUTH_TOKEN_KEY = "auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}
