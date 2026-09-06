import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ItemDTO,
  ItemTotals,
  ItemConfigsApiResp,
  ItemSituation,
  ItemSearchParams,
} from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItemApiService {
  private http = inject(HttpClient);
  private readonly base = '/api/Inventory/item';

  // -------------------------------------------------------
  // Configs
  // -------------------------------------------------------

  /** GET /Inventory/item/configs — categorias, situações, tipos de aquisição e últimas lojas */
  getConfigs(): Observable<ItemConfigsApiResp> {
    return this.http.get<ItemConfigsApiResp>(`${this.base}/configs`);
  }

  // -------------------------------------------------------
  // Listagem paginada
  // -------------------------------------------------------

  /** GET /Inventory/item/totals — total de páginas sem filtro */
  getTotalPages(): Observable<ItemTotals> {
    return this.http.get<ItemTotals>(`${this.base}/totals`);
  }

  /** POST /Inventory/item/totals/search — total de páginas com filtro */
  getTotalPagesSearch(params: ItemSearchParams): Observable<ItemTotals> {
    return this.http.post<ItemTotals>(`${this.base}/totals/search`, params);
  }

  /** GET /Inventory/item?page=N — lista paginada sem filtro */
  getPaginated(page: number): Observable<ItemDTO[]> {
    return this.http.get<ItemDTO[]>(`${this.base}`, {
      params: new HttpParams().set('page', page),
    });
  }

  /** POST /Inventory/item/search?page=N — lista paginada com filtro */
  getPaginatedSearch(page: number, params: ItemSearchParams): Observable<ItemDTO[]> {
    return this.http.post<ItemDTO[]>(`${this.base}/search`, params, {
      params: new HttpParams().set('page', page),
    });
  }

  // -------------------------------------------------------
  // Situações agrupadas (para os filtros da Home)
  // -------------------------------------------------------

  /** GET /Inventory/item/GetItemsSituationsGroupingWithQuantities */
  getSituationsWithQuantities(): Observable<ItemSituation[]> {
    return this.http.get<ItemSituation[]>(
      `${this.base}/GetItemsSituationsGroupingWithQuantities`,
    );
  }

  // -------------------------------------------------------
  // CRUD
  // -------------------------------------------------------

  /** GET /Inventory/item/:id */
  getById(id: number): Observable<ItemDTO> {
    return this.http.get<ItemDTO>(`${this.base}/${id}`);
  }

  /** POST /Inventory/item */
  insert(item: Partial<ItemDTO>): Observable<ItemDTO> {
    return this.http.post<ItemDTO>(this.base, this.buildPayload(item));
  }

  /** PUT /Inventory/item/:id */
  update(item: Partial<ItemDTO> & { id: number }): Observable<ItemDTO> {
    return this.http.put<ItemDTO>(`${this.base}/${item.id}`, this.buildPayload(item));
  }

  /** DELETE /Inventory/item/:id */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // -------------------------------------------------------
  // Imagens
  // -------------------------------------------------------

  /** GET /Inventory/item/:id/image/:fileName — retorna blob */
  getImage(itemId: number, fileName: string): Observable<Blob> {
    return this.http.get(`${this.base}/${itemId}/image/${fileName}`, {
      responseType: 'blob',
    });
  }

  /** PUT /Inventory/item/:id/image — upload de imagem como multipart/form-data (file1) */
  uploadImage(itemId: number, imageBase64: string, mimeType: string): Observable<unknown> {
    const byteString = atob(imageBase64);
    const buffer = new ArrayBuffer(byteString.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < byteString.length; i++) bytes[i] = byteString.charCodeAt(i);

    const ext = mimeType === 'image/png' ? '.png' : '.jpg';
    const file = new File([new Blob([buffer], { type: mimeType })], `image${ext}`, { type: mimeType });

    const form = new FormData();
    form.append('file1', file);

    return this.http.put(`${this.base}/${itemId}/image`, form);
  }

  /** DELETE /Inventory/item/:id/image/:fileName */
  deleteImage(itemId: number, fileName: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${itemId}/image/${fileName}`);
  }

  // -------------------------------------------------------
  // Helper
  // -------------------------------------------------------

  /** Constrói o payload JSON conforme esperado pela API */
  private buildPayload(item: Partial<ItemDTO>) {
    return {
      name: item.name,
      technicalDescription: item.technicalDescription,
      acquisitionDate: item.acquisitionDate
        ? item.acquisitionDate.substring(0, 10) // YYYY-MM-DD
        : undefined,
      purchaseValue: item.purchaseValue,
      purchaseStore: item.purchaseStore,
      resaleValue: item.resaleValue,
      situationId: item.situation?.id,
      comment: item.comment,
      acquisitionType: item.acquisitionType?.id,
      category: item.category
        ? {
            categoryId: item.category.id,
            subCategoryId: item.category.subCategory?.id ?? null,
          }
        : undefined,
      withdrawalDate: item.withdrawalDate
        ? item.withdrawalDate.substring(0, 10)
        : null,
    };
  }
}
