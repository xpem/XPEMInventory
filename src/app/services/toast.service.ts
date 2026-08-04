import { Injectable, signal } from '@angular/core';

export enum ToastType {
  Success = 'success',
  Error = 'danger',
  Info = 'info',
  Warning = 'warning',
}

interface Toast {
  message: string;
  type: ToastType;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  public toasts = signal<Toast[]>([]);

  showToast(message: string, type: ToastType, duration = 5000) {
    const toast: Toast = { message, type, duration };
    this.toasts.update((list) => [...list, toast]);
    setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t !== toast));
    }, duration);
  }

  showSuccess(message: string, duration = 5000) {
    this.showToast(message, ToastType.Success, duration);
  }

  showError(message: string, duration = 5000) {
    this.showToast(message, ToastType.Error, duration);
  }

  showWarning(message: string, duration = 5000) {
    this.showToast(message, ToastType.Warning, duration);
  }

  showInfo(message: string, duration = 5000) {
    this.showToast(message, ToastType.Info, duration);
  }
}
