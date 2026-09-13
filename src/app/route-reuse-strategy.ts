import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

const REUSABLE_ROUTES = ['home', 'category/list'];

@Injectable({ providedIn: 'root' })
export class AppRouteReuseStrategy implements RouteReuseStrategy {
  private cache = new Map<string, DetachedRouteHandle>();

  private key(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path ?? '';
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return REUSABLE_ROUTES.includes(this.key(route));
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (handle) this.cache.set(this.key(route), handle);
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return this.cache.has(this.key(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return this.cache.get(this.key(route)) ?? null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  /** Invalida o cache de uma rota para forçar reload após mutações */
  invalidate(path: string): void {
    this.cache.delete(path);
  }

  /** Limpa todo o cache de rotas reutilizáveis (ex.: troca de usuário) */
  clear(): void {
    this.cache.clear();
  }
}
