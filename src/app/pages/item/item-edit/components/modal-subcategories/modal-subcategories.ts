import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CategoryDTO } from '../../../../../models/category.model';

@Component({
  selector: 'app-modal-subcategories',
  standalone: true,
  imports: [],
  templateUrl: './modal-subcategories.html',
})
export class ModalSubCategories {
  @Input() selectedCategory: CategoryDTO | null = null;
  @Output() selectSubCategory = new EventEmitter<number | null>();

  onSelect(id: number | null | undefined) {
    this.selectSubCategory.emit(id ?? null);
  }
}
