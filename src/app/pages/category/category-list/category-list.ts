import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CategoryApiService } from '../../../services/category-api';
import { ToastService } from '../../../services/toast.service';
import { CategoryDTO } from '../../../models/category.model';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList implements OnInit {
  private categoryApi = inject(CategoryApiService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  categories = signal<CategoryDTO[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  private load() {
    this.isLoading.set(true);
    this.categoryApi.getAllWithSubCategories().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar categorias.');
        this.isLoading.set(false);
      },
    });
  }

  goToNew() {
    this.router.navigate(['/category/edit']);
  }

  goToEdit(id: number | null | undefined) {
    if (id != null) this.router.navigate(['/category/edit'], { queryParams: { x: id } });
  }
}
