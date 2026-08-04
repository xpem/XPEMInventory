import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { UserApiService } from '../../../services/user-api';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class SignIn implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userApi = inject(UserApiService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  submitted = false;
  isLoading = signal(false);

  ngOnInit() {
    // Redireciona se já estiver autenticado (apenas sinal local — sem chamada à API)
    if (this.authService.getToken()) {
      this.router.navigate(['/home']);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) return;

    this.isLoading.set(true);

    this.userApi.signIn(this.form.value).subscribe({
      next: (response) => {
        this.authService.saveToken(response.token);
        this.router.navigate(['/home']);
      },
      error: (error: HttpErrorResponse) => {
        const code = error.error?.errorCode;
        if (code === 5) {
          this.toastService.showError('Email ou senha inválidos.');
        } else {
          this.toastService.showError('Erro ao realizar login. Tente novamente.');
        }
        this.isLoading.set(false);
      },
    });
  }
}
