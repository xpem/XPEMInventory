import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Sidebar } from './components/sidebar/sidebar';
import { Toasts } from './components/toasts/toasts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Toasts],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  protected pageTitle = signal('XPEM Inventário');

  ngOnInit() {
    // Só valida sessão no browser — no SSR não há cookie nem API disponível
    if (isPlatformBrowser(this.platformId)) {
      this.authService.checkSessionStatus().subscribe();
    }

    // Atualiza o título a cada navegação
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const title = this.getRouteTitle();
        this.pageTitle.set(title ?? 'XPEM Inventário');
      });
  }

  private getRouteTitle(): string | undefined {
    let route = this.router.routerState.root;
    while (route.firstChild) route = route.firstChild;
    return route.snapshot.data['title'];
  }
}
