import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UserApiService } from '../../../services/user-api';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignUp implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userApi = inject(UserApiService);
  private toastService = inject(ToastService);

  form!: FormGroup;
  submitted = false;
  errorMessage = signal('');
  showPassword = false;
  showConfirmPassword = false;

  ngOnInit() {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(4)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(4)]],
      },
      { validators: this.mustMatchValidator('password', 'confirmPassword') },
    );
  }

  private mustMatchValidator(control: string, matchControl: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const a = group.get(control);
      const b = group.get(matchControl);
      if (b?.errors && !b.errors['mustMatch']) return null;
      if (a?.value !== b?.value) {
        b?.setErrors({ mustMatch: true });
        return { mustMatch: true };
      }
      b?.setErrors(null);
      return null;
    };
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.errorMessage.set('');
    if (this.form.invalid) return;

    const { name, email, password } = this.form.value;

    this.userApi.signUp({ name, email, password }).subscribe({
      next: () => {
        this.toastService.showSuccess('Usuário criado com sucesso!');
        this.router.navigate(['/user/signin']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.error?.errorCode === 3) {
          this.errorMessage.set('Este email já está cadastrado.');
        } else {
          this.errorMessage.set('Não foi possível criar o usuário. Tente novamente.');
        }
      },
    });
  }
}
