export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  ownerName: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: number;
  organizationId: string;
  organizationName: string;
  expiresAt: string;
}

export interface WrappedAuthResponse {
  success: boolean;
  data: AuthResponse;
  message?: string;
  errors?: string[] | null;
}

export type LoginResponse = AuthResponse | WrappedAuthResponse;

export interface User {
  userId: string;
  email: string;
  role: number;
  organizationId: string;
  organizationName: string;
}

export interface TokenInfo {
  token: string;
  expiresAt: Date;
}

export interface GoogleAuthRequest {
  idToken: string;
  mode: 'signup' | 'login' | 'link';
  email: string;
  name: string;
  providerId: string;
}

export interface SocialAuthResponse extends AuthResponse {
  isNewUser: boolean;
  needsProfileCompletion?: boolean;
}

export interface FacebookAuthRequest {
  accessToken: string;
  mode: 'signup' | 'login' | 'link';
  email: string;
  name: string;
  providerId: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}