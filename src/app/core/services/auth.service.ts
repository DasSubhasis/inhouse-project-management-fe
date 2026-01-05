import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError, tap } from 'rxjs/operators';
import { User, AuthState, LoginResponse, OTPVerificationResponse } from '../models/auth.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false
  });

  public authState$ = this.authState.asObservable();
  private pendingEmail: string | null = null;
  private pendingLoginCode: string | null = null;

  constructor(private apiService: ApiService) {
    // Check for existing token on init
    this.loadAuthState();
  }

  private loadAuthState(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userJson = localStorage.getItem('current_user');
      
      console.log('Loading auth state - Token:', token ? 'exists' : 'null', 'User:', userJson ? 'exists' : 'null');
      
      if (token && userJson && userJson !== 'undefined' && userJson !== 'null') {
        const user = JSON.parse(userJson);
        this.authState.next({
          user,
          token,
          isAuthenticated: true
        });
        console.log('Auth state loaded successfully:', user);
      } else {
        console.log('No valid auth data found in localStorage');
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      // Clear invalid data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    }
  }

  login(email: string): Observable<LoginResponse> {
    return this.apiService.requestOTP(email).pipe(
      map((response: any) => {
        console.log('Request OTP Response:', response);
        
        const isSuccess = response?.status === 1 || response?.statusCode === 200 || response?.success === true;
        
        if (isSuccess) {
          this.pendingEmail = email;
          // Store loginCode from response if provided
          if (response.loginCode) {
            this.pendingLoginCode = response.loginCode;
          }
          return {
            success: true,
            message: response.message || 'OTP sent to your email.',
            requiresOTP: true
          };
        } else {
          return {
            success: false,
            message: response.message || 'Failed to send OTP.'
          };
        }
      }),
      catchError((error) => {
        console.error('Request OTP Error:', error);
        return of({
          success: false,
          message: error.error?.message || 'An error occurred. Please try again.'
        });
      })
    );
  }

  verifyOTP(otp: string): Observable<OTPVerificationResponse> {
    if (!this.pendingEmail) {
      return of({
        success: false,
        message: 'Please login first to receive OTP.'
      });
    }

    // Use loginCode from response or generate a default one
    const loginCode = this.pendingLoginCode || '00000000-0000-0000-0000-000000000000';

    return this.apiService.verifyOTP(this.pendingEmail, loginCode, otp).pipe(
      map((response: any) => {
        console.log('Verify OTP Response:', response);
        
        const isSuccess = response?.status === 1 || response?.statusCode === 200 || response?.success === true;
        
        if (isSuccess) {
          // Map response to user object - response has userId, name, email, role, token directly
          const userData = {
            id: response.userId,
            name: response.name,
            email: response.email,
            role: response.role,
            roleid: response.roleid || response.roleId // Handle both roleid and roleId
          };
          
          const token = response.token || response.accessToken || this.generateMockToken(userData);
          
          // Save to localStorage
          localStorage.setItem('auth_token', token);
          localStorage.setItem('current_user', JSON.stringify(userData));
          
          // Update state
          this.authState.next({
            user: userData as User,
            token,
            isAuthenticated: true
          });
          
          this.pendingEmail = null;
          this.pendingLoginCode = null;
          
          return {
            success: true,
            message: response.message || 'Login successful!',
            token,
            user: userData as User
          };
        } else {
          return {
            success: false,
            message: response.message || 'Invalid OTP. Please try again.'
          };
        }
      }),
      catchError((error) => {
        console.error('Verify OTP Error:', error);
        return of({
          success: false,
          message: error.error?.message || 'An error occurred. Please try again.'
        });
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.authState.next({
      user: null,
      token: null,
      isAuthenticated: false
    });
    this.pendingEmail = null;
    this.pendingLoginCode = null;
  }

  isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  getCurrentUser(): User | null {
    return this.authState.value.user;
  }

  getToken(): string | null {
    return this.authState.value.token;
  }

  private generateMockToken(user: User): string {
    // Generate a mock JWT-like token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }));
    const signature = btoa('mock-signature-' + user.email);
    return `${header}.${payload}.${signature}`;
  }
}
