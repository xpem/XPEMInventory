import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { SubCategoryApiService } from '../../../../../services/subcategory-api';
import { SubCategoryHistoric } from '../../../../../models/historic.model';

@Component({
  selector: 'app-offcanvas-sub-historic',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './offcanvas-sub-historic.html',
  styleUrl: './offcanvas-sub-historic.css',
})
export class OffcanvasSubHistoric {
  private subCategoryApi = inject(SubCategoryApiService);
  private platformId = inject(PLATFORM_ID);

  historic = signal<SubCategoryHistoric[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  open(subCategoryId: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById('offcanvasSubHistoric');
    if (!el) return;
    (window as any).bootstrap.Offcanvas.getOrCreateInstance(el).show();
    this.load(subCategoryId);
  }

  private load(subCategoryId: number) {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.subCategoryApi.getHistoric(subCategoryId).subscribe({
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

  entryTitle(entry: SubCategoryHistoric): string {
    if (entry.typeName) return entry.typeName;
    return entry.typeId === 1 ? 'Subcategoria criada' : 'Atualização';
  }

  entryDescription(entry: SubCategoryHistoric): string {
    if (!entry.fields?.length) return 'Cadastro inicial da subcategoria no inventário.';
    return entry.fields
      .map(f => `${f.fieldName}: "${f.updatedFrom}" → "${f.updatedTo}"`)
      .join(' · ');
  }
}
