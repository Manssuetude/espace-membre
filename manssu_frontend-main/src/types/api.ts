// Common API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserListStats {
  totalMembers?: number;
  activeMembers?: number;
  administrators?: number;
  pending?: number;
}

export interface PaginatedUsersResponse<T> extends PaginatedResponse<T> {
  stats: UserListStats;
}

export interface ApiError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

// Auth types
export interface LoginRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface SendOTPResponse {
  message: string;
  expiresIn: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string | null;
  user: import("./auth").User;
}
