import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  otpForm!: FormGroup;
  showOTPInput = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showDemoCredentials = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.loginForm.value.email;

    this.authService.login(email).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success && response.requiresOTP) {
          this.showOTPInput = true;
          this.successMessage = response.message;
        } else if (!response.success) {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
      }
    });
  }

  onOTPSubmit(): void {
    if (this.otpForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const otp = this.otpForm.value.otp;

    this.authService.verifyOTP(otp).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.successMessage = response.message;
          // Navigate to home after successful login
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 500);
        } else {
          this.errorMessage = response.message;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred. Please try again.';
      }
    });
  }

  resetForm(): void {
    this.showOTPInput = false;
    this.loginForm.reset();
    this.otpForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  toggleDemoCredentials(): void {
    this.showDemoCredentials = !this.showDemoCredentials;
  }
}
