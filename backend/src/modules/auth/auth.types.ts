import type { SafeUser } from "../users/user.types.js";

export interface RegisterInput {
  organizationName: string;
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: SafeUser;
  token: string;
}

export interface AuthResponseData {
  user: SafeUser;
  token: string;
}
