import { Component, Input, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { CategoryApiService } from '../../../../../services/category-api';
import { CategoryHistoric } from '../../../../../models/historic.model';

@Component({
  selector: 'app-offcanvas-cat-historic',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './offcanvas-cat-historic.html',
  styleUrl: './offcanvas-cat-historic.css',
})
export class OffcanvasCatHistoric {
  @Input() categoryId!: number;

  private categoryApi = inject(CategoryApiService);
  private platformId = inject(PLATFORM_ID);

  historic = signal<CategoryHistoric[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  open() {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById('offcanvasCatHistoric');
    if (!el) return;
    (window as any).bootstrap.Offcanvas.getOrCreateInstance(el).show();
    this.load();
  }

  private load() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.categoryApi.getHistoric(this.categoryId).subscribe({
      next: (data) => {
        this.historic.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  entryIcon(typeId: number): string {
    return typeId === 1 ? 'bi-plus-lg' : 'bi-pencil';
  }

  entryTitle(entry: CategoryHistoric): string {
    if (entry.typeName) return entry.typeName;
    return entry.typeId === 1 ? 'Categoria criada' : 'Atualização';
  }

  entryDescription(entry: CategoryHistoric): string {
    if (!entry.fields?.length) return 'Cadastro inicial da categoria no inventário.';
    return entry.fields
      .map(f => `${f.fieldName}: "${f.updatedFrom}" → "${f.updatedTo}"`)
      .join(' · ');
  }
}
