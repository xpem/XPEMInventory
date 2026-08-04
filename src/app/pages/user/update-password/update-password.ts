import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserApiService } from '../../../services/user-api';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-update-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './update-password.html',
  styleUrl: './update-password.css',
})
export class UpdatePassword implements OnInit {
  private fb = inject(FormBuilder);
  private userApi = inject(UserApiService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  submitted = false;
  isLoading = signal(false);
  emailSent = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage.set('');
    if (this.form.invalid) return;

    this.isLoading.set(true);

    this.userApi.sendPasswordResetEmail(this.form.value.email).subscribe({
      next: () => {
        this.emailSent.set(true);
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao enviar email:', error);
        this.errorMessage.set('Não foi possível enviar o email. Tente novamente.');
        this.isLoading.set(false);
      },
    });
  }
}
