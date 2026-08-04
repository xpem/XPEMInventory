import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [],
  templateUrl: './toasts.html',
  styleUrl: './toasts.css',
})
export class Toasts {
  public toastService = inject(ToastService);
}
