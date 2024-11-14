import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit, OnDestroy {
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: string = 'user';
  loading: boolean = false;
  isAdmin: boolean = false;

  private userDetailsSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.userDetailsSubscription = this.authService.userDetails$.subscribe(
      (details) => {
        if (details && details.userRole) {
          this.isAdmin = details.userRole === 'admin';
        } else {
          this.isAdmin = false;
        }
      }
    );
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  register(form: NgForm) {
    if (form.invalid) {
      this.snackbar('Please fill in all fields correctly.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackbar('Passwords do not match.');
      return;
    }

    this.loading = true;

    this.authService
      .register(this.email, this.username, this.password, this.role)
      .subscribe(
        (response) => {
          this.snackbar('Registration successful! Please log in.');
          form.reset();
          this.router.navigate(['/login']);
        },
        (error) => {
          this.snackbar('Registration failed. Please try again.');
        },
        () => {
          this.loading = false;
        }
      );
  }

  convertToLowercase(): void {
    this.username = this.username.toLowerCase();
  }

  snackbar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'star-snackbar',
    });
  }

  ngOnDestroy() {
    this.userDetailsSubscription.unsubscribe();
  }
}
