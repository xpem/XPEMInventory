import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SubCategoryDTO } from '../models/category.model';

@Injectable({ providedIn: 'root' })
export class SubCategoryApiService {
  private http = inject(HttpClient);
  private readonly base = '/api/Inventory/subcategory';

  // -------------------------------------------------------
  // Leitura
  // -------------------------------------------------------

  /** GET /Inventory/subcategory/:id */
  getById(id: number): Observable<SubCategoryDTO> {
    return this.http.get<SubCategoryDTO>(`${this.base}/${id}`);
  }

  /** GET /Inventory/subcategory/category/:categoryId — subcategorias de uma categoria */
  getByCategoryId(categoryId: number): Observable<SubCategoryDTO[]> {
    return this.http.get<SubCategoryDTO[]>(`${this.base}/category/${categoryId}`);
  }

  // -------------------------------------------------------
  // CRUD
  // -------------------------------------------------------

  /** POST /Inventory/subcategory */
  insert(
    subcategory: Pick<SubCategoryDTO, 'name' | 'iconName' | 'categoryId'>,
  ): Observable<SubCategoryDTO> {
    return this.http.post<SubCategoryDTO>(this.base, {
      name: subcategory.name,
      iconName: subcategory.iconName,
      categoryId: subcategory.categoryId,
    });
  }

  /** PUT /Inventory/subcategory/:id */
  update(
    id: number,
    subcategory: Pick<SubCategoryDTO, 'name' | 'iconName' | 'categoryId'>,
  ): Observable<SubCategoryDTO> {
    return this.http.put<SubCategoryDTO>(`${this.base}/${id}`, {
      name: subcategory.name,
      iconName: subcategory.iconName,
      categoryId: subcategory.categoryId,
    });
  }

  /** DELETE /Inventory/subCategory/:id */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`/api/Inventory/subCategory/${id}`);
  }
}
