import {
  Component,
  OnInit,
  inject,
  signal,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryApiService } from '../../../services/category-api';
import { SubCategoryApiService } from '../../../services/subcategory-api';
import { ToastService } from '../../../services/toast.service';
import { AppRouteReuseStrategy } from '../../../route-reuse-strategy';
import { CategoryDTO, SubCategoryDTO } from '../../../models/category.model';
import { OffcanvasCatHistoric } from './components/offcanvas-cat-historic/offcanvas-cat-historic';
import { OffcanvasSubHistoric } from './components/offcanvas-sub-historic/offcanvas-sub-historic';

// Paleta de cores pré-definida (mesma do Blazor)
export const COLOR_PALETTE = [
  '#2F9300', '#0C5532', '#0E0C55', '#BB0000',
  '#416986', '#864141', '#4700BB', '#B700BB',
  '#006CBB', '#864183',
];

// Bootstrap Icons disponíveis para subcategorias
export const BI_ICONS = [
  'tag', 'laptop', 'phone', 'tv', 'camera', 'headphones',
  'controller', 'bicycle', 'car-front', 'house', 'book',
  'music-note-beamed', 'brush', 'tools', 'lightning-charge',
  'star', 'heart', 'bag', 'box-seam', 'watch', 'gem',
  'printer', 'router', 'keyboard', 'mouse2', 'display',
  'speaker', 'battery-full', 'plug', 'cpu', 'hdd',
  'globe', 'trophy', 'airplane', 'wrench', 'scissors',
];

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [ReactiveFormsModule, OffcanvasCatHistoric, OffcanvasSubHistoric],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.css',
})
export class CategoryEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private categoryApi = inject(CategoryApiService);
  private subCategoryApi = inject(SubCategoryApiService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private reuseStrategy = inject(AppRouteReuseStrategy);

  readonly COLOR_PALETTE = COLOR_PALETTE;
  readonly BI_ICONS = BI_ICONS;

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  isLoading = signal(true);
  isSaving = signal(false);
  isInsert = signal(true);
  categoryId = signal<number | null>(null);
  isSystemDefault = signal(false);

  selectedColor = signal('#2F9300');
  colorPickerOpen = signal(false);

  subCategories = signal<SubCategoryDTO[]>([]);

  // Sub formulário inline
  subForm!: FormGroup;
  editingSubId = signal<number | null>(null);  // null = nova subcategoria
  subFormVisible = signal(false);
  selectedSubIcon = signal('tag');
  iconPickerOpen = signal(false);
  isSavingSub = signal(false);

  // Confirmação de exclusão
  deleteCategoryModalVisible = signal(false);
  deleteSubId = signal<number | null>(null);

  form!: FormGroup;

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
    });

    this.subForm = this.fb.group({
      subName: ['', [Validators.required, Validators.maxLength(100)]],
    });

    const id = this.route.snapshot.queryParamMap.get('x');
    if (id) {
      this.categoryId.set(Number(id));
      this.isInsert.set(false);
      this.loadCategory(Number(id));
    } else {
      this.isLoading.set(false);
    }
  }

  // -------------------------------------------------------
  // Carregamento
  // -------------------------------------------------------
  private loadCategory(id: number) {
    this.categoryApi.getWithSubCategories(id).subscribe({
      next: (data) => {
        const cat = data[0];
        if (!cat) {
          this.toastService.showError('Categoria não encontrada.');
          this.router.navigate(['/category/list']);
          return;
        }
        this.form.patchValue({ name: cat.name ?? '' });
        this.selectedColor.set(cat.color ?? '#2F9300');
        this.isSystemDefault.set(cat.systemDefault ?? false);
        this.subCategories.set(cat.subCategories ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao carregar categoria.');
        this.router.navigate(['/category/list']);
      },
    });
  }

  // -------------------------------------------------------
  // Color picker
  // -------------------------------------------------------
  openColorPicker() { this.colorPickerOpen.set(true); }

  selectColor(color: string) {
    this.selectedColor.set(color);
    this.colorPickerOpen.set(false);
  }

  // -------------------------------------------------------
  // Submit categoria
  // -------------------------------------------------------
  onSubmit() {
    if (this.form.invalid || this.isSaving()) return;
    this.isSaving.set(true);

    const payload = {
      name: this.form.value.name?.trim(),
      color: this.selectedColor(),
    };

    const id = this.categoryId();
    const obs$ = id
      ? this.categoryApi.update(id, payload)
      : this.categoryApi.insert(payload);

    obs$.subscribe({
      next: () => {
        this.toastService.showSuccess(id ? 'Categoria atualizada!' : 'Categoria adicionada!');
        this.reuseStrategy.invalidate('category/list');
        this.router.navigate(['/category/list']);
      },
      error: () => {
        this.toastService.showError('Erro ao salvar categoria.');
        this.isSaving.set(false);
      },
    });
  }

  // -------------------------------------------------------
  // Delete categoria
  // -------------------------------------------------------
  confirmDeleteCategory() {
    if (this.subCategories().length > 0) {
      this.toastService.showError(
        'Não é possível excluir uma categoria que tenha subcategorias.',
      );
      return;
    }
    this.deleteCategoryModalVisible.set(true);
  }

  deleteCategory() {
    const id = this.categoryId();
    if (!id) return;
    this.categoryApi.delete(id).subscribe({
      next: () => {
        this.toastService.showSuccess('Categoria excluída!');
        this.reuseStrategy.invalidate('category/list');
        this.router.navigate(['/category/list']);
      },
      error: () => this.toastService.showError('Erro ao excluir categoria.'),
    });
  }

  // -------------------------------------------------------
  // Sub categoria — formulário inline
  // -------------------------------------------------------
  openNewSubForm() {
    this.editingSubId.set(null);
    this.subForm.reset({ subName: '' });
    this.selectedSubIcon.set('tag');
    this.iconPickerOpen.set(false);
    this.subFormVisible.set(true);
  }

  openEditSubForm(sub: SubCategoryDTO) {
    this.editingSubId.set(sub.id ?? null);
    this.subForm.patchValue({ subName: sub.name ?? '' });
    this.selectedSubIcon.set(sub.iconName ?? 'tag');
    this.iconPickerOpen.set(false);
    this.subFormVisible.set(true);
  }

  cancelSubForm() {
    this.subFormVisible.set(false);
    this.editingSubId.set(null);
    this.iconPickerOpen.set(false);
  }

  selectSubIcon(icon: string) {
    this.selectedSubIcon.set(icon);
    this.iconPickerOpen.set(false);
  }

  saveSubCategory() {
    if (this.subForm.invalid || this.isSavingSub()) return;
    this.isSavingSub.set(true);

    const catId = this.categoryId();
    if (!catId) return;

    const payload = {
      name: this.subForm.value.subName?.trim(),
      iconName: this.selectedSubIcon(),
      categoryId: catId,
    };

    const editId = this.editingSubId();
    const obs$ = editId
      ? this.subCategoryApi.update(editId, payload)
      : this.subCategoryApi.insert(payload);

    obs$.subscribe({
      next: (saved) => {
        if (editId) {
          this.subCategories.update((list) =>
            list.map((s) => (s.id === editId ? { ...s, ...payload, id: editId } : s)),
          );
          this.toastService.showSuccess('Subcategoria atualizada!');
        } else {
          this.subCategories.update((list) => [...list, saved]);
          this.toastService.showSuccess('Subcategoria adicionada!');
        }
        this.subFormVisible.set(false);
        this.editingSubId.set(null);
        this.isSavingSub.set(false);
      },
      error: () => {
        this.toastService.showError('Erro ao salvar subcategoria.');
        this.isSavingSub.set(false);
      },
    });
  }

  // -------------------------------------------------------
  // Delete subcategoria
  // -------------------------------------------------------
  confirmDeleteSub(id: number | null | undefined) {
    if (id != null) this.deleteSubId.set(id);
  }

  deleteSub() {
    const id = this.deleteSubId();
    if (!id) return;
    this.subCategoryApi.delete(id).subscribe({
      next: () => {
        this.subCategories.update((list) => list.filter((s) => s.id !== id));
        this.deleteSubId.set(null);
        this.toastService.showSuccess('Subcategoria excluída!');
      },
      error: () => this.toastService.showError('Erro ao excluir subcategoria.'),
    });
  }

  // -------------------------------------------------------
  // Histórico
  // -------------------------------------------------------
  @ViewChild(OffcanvasCatHistoric) catHistoricRef?: OffcanvasCatHistoric;
  @ViewChild(OffcanvasSubHistoric) subHistoricRef?: OffcanvasSubHistoric;

  openCatHistoric() { this.catHistoricRef?.open(); }
  openSubHistoric(subId: number | null | undefined) {
    if (subId != null) this.subHistoricRef?.open(subId);
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  get f() { return this.form.controls; }
  get sf() { return this.subForm.controls; }

  goBack() { this.router.navigate(['/category/list']); }
}
