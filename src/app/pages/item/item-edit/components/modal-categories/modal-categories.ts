import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CategoryDTO } from '../../../../../models/category.model';

@Component({
  selector: 'app-modal-categories',
  standalone: true,
  imports: [],
  templateUrl: './modal-categories.html',
})
export class ModalCategories {
  @Input() categories: CategoryDTO[] = [];
  @Output() selectCategory = new EventEmitter<number>();
  @Output() showSubCategory = new EventEmitter<number>();

  onSelect(id: number | null | undefined) {
    if (id != null) this.selectCategory.emit(id);
  }

  onShowSub(id: number | null | undefined) {
    if (id != null) this.showSubCategory.emit(id);
  }
}
