export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  roleid?: string;
  otp?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  requiresOTP?: boolean;
}

export interface OTPVerificationResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}
