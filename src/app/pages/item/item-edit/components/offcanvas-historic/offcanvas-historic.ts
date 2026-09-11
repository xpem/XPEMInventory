import { Component, Input, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { ItemApiService } from '../../../../../services/item-api';
import { ItemHistoric } from '../../../../../models/historic.model';

@Component({
  selector: 'app-offcanvas-historic',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './offcanvas-historic.html',
  styleUrl: './offcanvas-historic.css',
})
export class OffcanvasHistoric {
  @Input() itemId!: number;

  private itemApi = inject(ItemApiService);
  private platformId = inject(PLATFORM_ID);

  historic = signal<ItemHistoric[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  open() {
    if (!isPlatformBrowser(this.platformId)) return;
    const el = document.getElementById('offcanvasHistoric');
    if (!el) return;
    (window as any).bootstrap.Offcanvas.getOrCreateInstance(el).show();
    this.load();
  }

  private load() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.itemApi.getHistoric(this.itemId).subscribe({
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

  entryTitle(entry: ItemHistoric): string {
    if (entry.typeName) return entry.typeName;
    return entry.typeId === 1 ? 'Item criado' : 'Atualização';
  }

  entryDescription(entry: ItemHistoric): string {
    if (!entry.fields?.length) return 'Cadastro inicial do item no inventário.';
    return entry.fields
      .map(f => `${f.fieldName}: "${f.updatedFrom}" → "${f.updatedTo}"`)
      .join(' · ');
  }
}
