import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CategoryDTO } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private http = inject(HttpClient);
  private readonly base = '/api/Inventory/category';

  // -------------------------------------------------------
  // Leitura
  // -------------------------------------------------------

  /** GET /Inventory/category — lista simples (sem subcategorias) */
  getAll(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(this.base);
  }

  /** GET /Inventory/category/subcategory — lista com todas as subcategorias */
  getAllWithSubCategories(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.base}/subcategory`);
  }

  /** GET /Inventory/category/:id/subcategory — uma categoria com suas subcategorias */
  getWithSubCategories(id: number): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.base}/${id}/subcategory`);
  }

  /** GET /Inventory/category/:id */
  getById(id: number): Observable<CategoryDTO> {
    return this.http.get<CategoryDTO>(`${this.base}/${id}`);
  }

  // -------------------------------------------------------
  // CRUD
  // -------------------------------------------------------

  /** POST /Inventory/category */
  insert(category: Pick<CategoryDTO, 'name' | 'color'>): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(this.base, {
      name: category.name,
      color: category.color,
    });
  }

  /** PUT /Inventory/category/:id */
  update(
    id: number,
    category: Pick<CategoryDTO, 'name' | 'color'>,
  ): Observable<CategoryDTO> {
    return this.http.put<CategoryDTO>(`${this.base}/${id}`, {
      name: category.name,
      color: category.color,
    });
  }

  /** DELETE /Inventory/category/:id */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
