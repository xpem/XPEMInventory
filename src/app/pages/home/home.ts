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
import { ItemDTO, UIItemSituation, ItemSearchParams, ResultOrderBy } from '../../models/item.model';

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

  items = signal<ItemDTO[]>([]);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  currentPage = signal(1);
  totalPages = signal(0);

  situationList = signal<UIItemSituation[]>([]);
  selectedSituationId = signal<number | null>(null);
  selectedOrderBy = signal<ResultOrderBy | null>(null);
  showFilters = signal(false);
  searchText = '';

  readonly orderByOptions: { label: string; value: ResultOrderBy }[] = [
    { label: 'Data de cadastro', value: ResultOrderBy.CreatedAt },
    { label: 'Nome', value: ResultOrderBy.Name },
    { label: 'Data de aquisição', value: ResultOrderBy.AcquisitionDate },
    { label: 'Última atualização', value: ResultOrderBy.UpdatedAt },
  ];

  private readonly SEARCH_STATE_KEY = 'home_search_state';

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.restoreSearchState();
    this.loadSituations();
    window.addEventListener('scroll', this.onScroll);
  }

  private restoreSearchState() {
    try {
      const saved = sessionStorage.getItem(this.SEARCH_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        this.searchText = state.searchText ?? '';
        this.selectedSituationId.set(state.selectedSituationId ?? null);
        this.selectedOrderBy.set(state.selectedOrderBy ?? null);
        this.showFilters.set(state.showFilters ?? false);
      }
    } catch {}

    if (this.hasActiveSearch()) {
      this.search();
    } else {
      this.loadItems();
    }
  }

  private saveSearchState() {
    try {
      sessionStorage.setItem(this.SEARCH_STATE_KEY, JSON.stringify({
        searchText: this.searchText,
        selectedSituationId: this.selectedSituationId(),
        selectedOrderBy: this.selectedOrderBy(),
        showFilters: this.showFilters(),
      }));
    } catch {}
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

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

  private loadSituations() {
    if (this.situationList().length > 0) return;
    this.itemApi.getSituationsWithQuantities().subscribe({
      next: (situations) => {
        this.situationList.set(
          situations.map((s) => ({
            id: s.id,
            name: s.name ?? '',
            backgoundColor: '#c4714a',
            quantity: s.quantity ?? 0,
          })),
        );
      },
    });
  }

  toggleFilters() {
    this.showFilters.update((v) => !v);
  }

  selectSituation(id: number | null) {
    this.selectedSituationId.set(id);
    this.search();
  }

  search() {
    this.isLoading.set(true);
    this.currentPage.set(1);

    if (!this.hasActiveSearch()) {
      this.loadItems();
      return;
    }

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

  goToNewItem() {
    this.router.navigate(['/item/edit']);
  }

  goToItem(id: number | null | undefined) {
    if (id != null) {
      this.saveSearchState();
      this.router.navigate(['/item/edit'], { queryParams: { x: id } });
    }
  }

  selectOrderBy(value: ResultOrderBy) {
    const current = this.selectedOrderBy();
    this.selectedOrderBy.set(current === value ? null : value);
  }

  hasActiveSearch(): boolean {
    return (
      this.searchText.trim().length > 0 ||
      this.selectedSituationId() !== null ||
      this.selectedOrderBy() !== null
    );
  }

  private buildSearchParams(): ItemSearchParams {
    return {
      name: this.searchText.trim() || null,
      situations: this.selectedSituationId() !== null ? [this.selectedSituationId()!] : null,
      orderBy: this.selectedOrderBy(),
    };
  }

  private enrichItems(items: ItemDTO[]): ItemDTO[] {
    return items.map((item) => {
      const category = item.category?.name ?? '';
      const subCategory = item.category?.subCategory?.name;
      item.categoryAndSubCategory = subCategory ? `${category}/${subCategory}` : category;
      const iconName = item.category?.subCategory?.iconName ?? 'tag';
      item.subCategoryIcon = iconName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      return item;
    });
  }

  formatDate(iso: string | undefined | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR');
  }

  formatCurrency(value: number | null | undefined): string {
    if (value == null) return '';
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
