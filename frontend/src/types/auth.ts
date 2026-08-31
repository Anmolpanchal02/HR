export type UserRole = "ADMIN" | "HR" | "ENGINEER" | "EMPLOYEE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  employeeId?: string;
  hasDirectReports?: boolean;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface RegisterPayload {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
