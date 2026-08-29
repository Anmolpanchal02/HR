export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message?: string;
  data?: T;
  timestamp?: string;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export function successResponse<T>(
  message: string,
  data?: T,
  includeTimestamp = false,
): ApiSuccessResponse<T> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (includeTimestamp) {
    response.timestamp = new Date().toISOString();
  }

  return response;
}

export function successDataResponse<T>(data: T): ApiDataResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(message: string): ApiErrorResponse {
  return {
    success: false,
    message,
  };
}
