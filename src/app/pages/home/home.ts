import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ItemApiService } from '../../services/item-api';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { ItemDTO, UIItemSituation, ItemSearchParams } from '../../models/item.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private itemApi = inject(ItemApiService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  items = signal<ItemDTO[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  currentPage = signal(1);
  totalPages = signal(0);

  searchPanelVisible = signal(false);
  situationList = signal<UIItemSituation[]>([]);
  selectedSituationIds = signal<number[]>([]);
  searchText = '';

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return; // SSR: não faz chamadas de API
    this.loadItems();
    window.addEventListener('scroll', this.onScroll);
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  // -------------------------------------------------------
  // Scroll infinito
  // -------------------------------------------------------
  private onScroll = () => {
    const scrolled = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 200;
    if (scrolled >= threshold) {
      this.loadMore();
    }
  };

  loadMore() {
    if (
      this.isLoading() ||
      this.isLoadingMore() ||
      this.currentPage() >= this.totalPages()
    ) return;

    this.isLoadingMore.set(true);
    const nextPage = this.currentPage() + 1;

    const obs = this.hasActiveSearch()
      ? this.itemApi.getPaginatedSearch(nextPage, this.buildSearchParams())
      : this.itemApi.getPaginated(nextPage);

    obs.subscribe({
      next: (newItems) => {
        this.items.update((prev) => [...prev, ...this.enrichItems(newItems)]);
        this.currentPage.set(nextPage);
        this.isLoadingMore.set(false);
      },
      error: () => this.isLoadingMore.set(false),
    });
  }

  // -------------------------------------------------------
  // Carregamento principal
  // -------------------------------------------------------
  loadItems() {
    this.isLoading.set(true);
    this.currentPage.set(1);

    this.itemApi.getTotalPages().subscribe({
      next: (totals) => {
        this.totalPages.set(totals.totalPages);
        if (totals.totalPages > 0) {
          this.fetchPage(1);
        } else {
          this.items.set([]);
          this.isLoading.set(false);
        }
      },
      error: (err) => {
        console.error('Erro ao obter totais:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/user/signin']);
        }
        this.isLoading.set(false);
      },
    });
  }

  private fetchPage(page: number) {
    this.itemApi.getPaginated(page).subscribe({
      next: (data) => {
        this.items.set(this.enrichItems(data));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // -------------------------------------------------------
  // Painel de filtros
  // -------------------------------------------------------
  toggleSearchPanel() {
    if (this.searchPanelVisible()) {
      // Fechar painel e resetar filtros
      this.searchPanelVisible.set(false);
      this.searchText = '';
      this.selectedSituationIds.set([]);
      this.loadItems();
    } else {
      // Abrir painel e carregar situações
      this.searchPanelVisible.set(true);
      this.loadSituations();
    }
  }

  private loadSituations() {
    if (this.situationList().length > 0) return; // já carregou
    this.itemApi.getSituationsWithQuantities().subscribe({
      next: (situations) => {
        this.situationList.set(
          situations.map((s) => ({
            id: s.id,
            name: s.name ?? '',
            backgoundColor: '#919191',
            quantity: s.quantity ?? 0,
          })),
        );
      },
    });
  }

  toggleSituation(id: number) {
    const current = this.selectedSituationIds();
    if (current.includes(id)) {
      this.selectedSituationIds.set(current.filter((s) => s !== id));
      this.situationList.update((list) =>
        list.map((s) => (s.id === id ? { ...s, backgoundColor: '#919191' } : s)),
      );
    } else {
      this.selectedSituationIds.set([...current, id]);
      this.situationList.update((list) =>
        list.map((s) => (s.id === id ? { ...s, backgoundColor: '#29a0b1' } : s)),
      );
    }
  }

  isSituationSelected(id: number | null | undefined): boolean {
    return id != null && this.selectedSituationIds().includes(id);
  }

  search() {
    this.isLoading.set(true);
    this.currentPage.set(1);

    const params = this.buildSearchParams();

    this.itemApi.getTotalPagesSearch(params).subscribe({
      next: (totals) => {
        this.totalPages.set(totals.totalPages);
        if (totals.totalPages > 0) {
          this.itemApi.getPaginatedSearch(1, params).subscribe({
            next: (data) => {
              this.items.set(this.enrichItems(data));
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
          });
        } else {
          this.items.set([]);
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false),
    });
  }

  // -------------------------------------------------------
  // Navegação
  // -------------------------------------------------------
  goToNewItem() {
    this.router.navigate(['/item/edit']);
  }

  goToItem(id: number | null | undefined) {
    if (id != null) this.router.navigate(['/item/edit'], { queryParams: { x: id } });
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  private hasActiveSearch(): boolean {
    return (
      this.searchText.trim().length > 0 || this.selectedSituationIds().length > 0
    );
  }

  private buildSearchParams(): ItemSearchParams {
    return {
      name: this.searchText.trim() || null,
      situations: this.selectedSituationIds().length > 0 ? this.selectedSituationIds() : null,
    };
  }

  /** Preenche campos calculados para a listagem */
  private enrichItems(items: ItemDTO[]): ItemDTO[] {
    return items.map((item) => {
      const category = item.category?.name ?? '';
      const subCategory = item.category?.subCategory?.name;
      item.categoryAndSubCategory = subCategory ? `${category}/${subCategory}` : category;
      item.subCategoryIcon = item.category?.subCategory?.iconName ?? 'tag';
      return item;
    });
  }

  /** Formata data ISO para dd/MM/yyyy */
  formatDate(iso: string | undefined | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  }

  /** Formata valor decimal para R$ */
  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
