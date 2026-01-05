export interface User {
  userId?: string;
  userName: string;
  emailId: string;
  roleId: string;
  userCode: string;
  employeeType: string;
  roleName?: string;
}

export interface CreateUserRequest {
  userName: string;
  emailId: string;
  roleId: string;
  userCode: string;
  employeeType: string;
}

export interface UpdateUserRequest {
  userId: string;
  userName: string;
  emailId: string;
  roleId: string;
  userCode: string;
  employeeType: string;
  roleName: string;
}

export interface UserRole {
  roleId: string;
  roleName: string;
  isActive?: string; // 'Y' or 'N'
}

export interface UserApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
