import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);
  private router = inject(Router);

  userName = this.authService.userName;
  userEmail = this.authService.userEmail;

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/user/signin']);
  }
}
