import type { ApiErrorResponse } from "@/types/api";
import { getStoredToken } from "@/lib/auth/token-storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function buildHeaders(includeAuth: boolean): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (includeAuth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiErrorResponse;

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new ApiError(message, response.status);
  }

  return data as T;
}

async function request<T>(
  path: string,
  options: RequestInit,
  includeAuth = false,
): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...buildHeaders(includeAuth),
      ...(options.headers ?? {}),
    },
  });

  return parseResponse<T>(response);
}

export const apiClient = {
  async get<T>(path: string, includeAuth = false): Promise<T> {
    return request<T>(path, { method: "GET" }, includeAuth);
  },

  async post<T>(path: string, body: unknown, includeAuth = false): Promise<T> {
    return request<T>(
      path,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      includeAuth,
    );
  },

  async patch<T>(path: string, body: unknown, includeAuth = false): Promise<T> {
    return request<T>(
      path,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      includeAuth,
    );
  },

  async delete<T>(path: string, includeAuth = false): Promise<T> {
    return request<T>(path, { method: "DELETE" }, includeAuth);
  },

  async postForm<T>(
    path: string,
    formData: FormData,
    includeAuth = false,
    onProgress?: (percent: number) => void,
  ): Promise<T> {
    if (!API_BASE_URL) {
      throw new ApiError("NEXT_PUBLIC_API_URL is not configured");
    }

    if (!onProgress) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method: "POST",
        headers: buildHeaders(includeAuth),
        body: formData,
      });
      return parseResponse<T>(response);
    }

    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}${path}`);

      const headers = buildHeaders(includeAuth) as Record<string, string>;
      if (headers.Authorization) {
        xhr.setRequestHeader("Authorization", headers.Authorization);
      }
      xhr.setRequestHeader("Accept", "application/json");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
        });
        void parseResponse<T>(response).then(resolve).catch(reject);
      };

      xhr.onerror = () => reject(new ApiError("Upload failed"));
      xhr.send(formData);
    });
  },
};

export { ApiError };
