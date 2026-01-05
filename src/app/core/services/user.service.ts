import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, CreateUserRequest, UpdateUserRequest, UserApiResponse, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private apiService: ApiService) {}

  /**
   * Get all users
   */
  getAllUsers(): Observable<UserApiResponse<User[]>> {
    return this.apiService.getAllUserMaster();
  }

  /**
   * Create a new user
   */
  createUser(user: CreateUserRequest): Observable<UserApiResponse<User>> {
    return this.apiService.createUser(user);
  }

  /**
   * Update an existing user
   */
  updateUser(user: UpdateUserRequest): Observable<UserApiResponse<User>> {
    return this.apiService.updateUser(user);
  }

  /**
   * Delete a user by ID
   */
  deleteUser(id: string): Observable<UserApiResponse<void>> {
    return this.apiService.deleteUser(id);
  }

  /**
   * Get all user roles
   */
  getAllRoles(): Observable<UserApiResponse<UserRole[]>> {
    return this.apiService.getAllUserRoles();
  }

  /**
   * Create a new user role
   */
  createRole(roleName: string): Observable<UserApiResponse<UserRole>> {
    return this.apiService.createUserRole(roleName);
  }

  /**
   * Update an existing user role
   */
  updateRole(role: { roleId: string; roleName: string; isActive: string }): Observable<UserApiResponse<UserRole>> {
    return this.apiService.updateUserRole(role);
  }

  /**
   * Delete a user role by ID
   */
  deleteRole(id: string): Observable<UserApiResponse<void>> {
    return this.apiService.deleteUserRole(id);
  }
}
