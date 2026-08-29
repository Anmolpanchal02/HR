import { apiClient } from "@/lib/api/client";
import { clearStoredToken, setStoredToken } from "@/lib/auth/token-storage";
import type {
  ApiDataResponse,
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types/auth";

export async function register(
  payload: RegisterPayload,
): Promise<ApiDataResponse<AuthResponseData>> {
  const response = await apiClient.post<ApiDataResponse<AuthResponseData>>(
    "/auth/register",
    payload,
  );
  setStoredToken(response.data.token);
  return response;
}

export async function login(
  payload: LoginPayload,
): Promise<ApiDataResponse<AuthResponseData>> {
  const response = await apiClient.post<ApiDataResponse<AuthResponseData>>(
    "/auth/login",
    payload,
  );
  setStoredToken(response.data.token);
  return response;
}

export async function getCurrentUser(): Promise<ApiDataResponse<User>> {
  return apiClient.get<ApiDataResponse<User>>("/auth/me", true);
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post<ApiDataResponse<{ message: string }>>(
      "/auth/logout",
      {},
      true,
    );
  } finally {
    clearStoredToken();
  }
}
