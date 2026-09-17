import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private readonly THEME_KEY = 'xpem_inv_theme';

  isDarkMode = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      this.isDarkMode.set(localStorage.getItem(this.THEME_KEY) === 'dark');
    } catch {}
  }

  toggleTheme(): void {
    const isDark = !this.isDarkMode();
    this.isDarkMode.set(isDark);

    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    } catch {}
  }
}
