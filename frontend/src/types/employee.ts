export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";

export interface EmployeeProfile {
  id: string;
  organizationId: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  dateOfJoining: string;
  managerId?: string;
  managerName?: string;
  location?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeListItem {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  jobTitle: string;
  status: EmployeeStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiDataResponse<T> {
  success: true;
  data: T;
}

export interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: EmployeeStatus;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  dateOfJoining: string;
  employmentType: EmploymentType;
  managerId?: string;
  location?: string;
}

export function canManageEmployees(role: string): boolean {
  return role === "ADMIN" || role === "HR";
}
