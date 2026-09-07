import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, NgZone, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { UserApiService } from '../../../services/user-api';
import { ToastService } from '../../../services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class SignIn implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private userApi = inject(UserApiService);
  private toastService = inject(ToastService);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('googleBtnContainer') googleBtnRef!: ElementRef;

  form!: FormGroup;
  submitted = false;
  isLoading = signal(false);
  isGoogleLoading = signal(false);
  showPassword = false;

  readonly hasGoogleAuth = !!environment.googleClientId;

  ngOnInit() {
    // Redireciona se já estiver autenticado (apenas sinal local — sem chamada à API)
    if (this.authService.getToken()) {
      this.router.navigate(['/home']);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rememberMe: [false],
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId) || !this.hasGoogleAuth) return;
    this.initGoogle();
  }

  private initGoogle() {
    const g = (window as any).google;
    if (!g) { setTimeout(() => this.initGoogle(), 150); return; }

    g.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (resp: { credential: string }) =>
        this.zone.run(() => this.onGoogleCredential(resp.credential)),
    });

    g.accounts.id.renderButton(this.googleBtnRef.nativeElement, {
      theme: 'outline',
      size: 'large',
      width: this.googleBtnRef.nativeElement.offsetWidth || 376,
      text: 'signin_with',
      locale: 'pt-BR',
    });
  }

  private onGoogleCredential(idToken: string) {
    this.isGoogleLoading.set(true);
    this.userApi.googleSignIn(idToken).subscribe({
      next: (response) => {
        this.authService.saveTokens(response);
        this.router.navigate(['/home']);
      },
      error: () => {
        this.toastService.showError('Erro ao entrar com Google. Tente novamente.');
        this.isGoogleLoading.set(false);
      },
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
        this.authService.saveTokens(response, this.form.value.rememberMe);
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
