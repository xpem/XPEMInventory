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
import { ItemApiService } from '../../../services/item-api';
import { ToastService } from '../../../services/toast.service';
import {
  AcquisitionType,
  ItemSituation,
  ItemConfigsApiResp,
  RESALE_STATUS_ID,
} from '../../../models/item.model';
import { CategoryDTO } from '../../../models/category.model';
import { ModalCategories } from './components/modal-categories/modal-categories';
import { ModalSubCategories } from './components/modal-subcategories/modal-subcategories';
import { ModalCamera } from './components/modal-camera/modal-camera';
import { ModalSelectFile } from './components/modal-select-file/modal-select-file';

@Component({
  selector: 'app-item-edit',
  standalone: true,
  imports: [ReactiveFormsModule, ModalCategories, ModalSubCategories, ModalCamera, ModalSelectFile],
  templateUrl: './item-edit.html',
  styleUrl: './item-edit.css',
})
export class ItemEdit implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private itemApi = inject(ItemApiService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  readonly RESALE_STATUS_ID = RESALE_STATUS_ID;

  // -------------------------------------------------------
  // State
  // -------------------------------------------------------
  isLoading = signal(true);
  isSaving = signal(false);
  isDeleting = signal(false);
  isInsert = signal(true);
  itemId = signal<number | null>(null);

  // Configs
  categories = signal<CategoryDTO[]>([]);
  situations = signal<ItemSituation[]>([]);
  acquisitionTypes = signal<AcquisitionType[]>([]);
  lastPurchaseStores = signal<string[]>([]);

  // Seleção de categoria/subcategoria
  selectedCategory = signal<CategoryDTO | null>(null);
  selectedSubCategoryId = signal<number | null>(null);
  categoryBtnLabel = signal('Selecionar Categoria');
  categoryError = signal('');
  situationError = signal('');
  acquisitionTypeError = signal('');

  // Imagem
  imageDataUrl = signal<string | null>(null);
  originalImageName = signal<string | null>(null); // nome do arquivo já salvo na API

  form!: FormGroup;

  // -------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(249)]],
      technicalDescription: ['', Validators.maxLength(349)],
      acquisitionDate: [this.todayStr(), Validators.required],
      situationId: [null, Validators.required],
      acquisitionTypeId: [null, Validators.required],
      purchaseValue: [''],
      purchaseStore: ['', Validators.maxLength(99)],
      comment: ['', Validators.maxLength(349)],
      // campos condicionais de revenda
      resaleValue: [''],
      withdrawalDate: [this.todayStr()],
      // quantidade (só usada no insert)
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(99)]],
    });

    const id = this.route.snapshot.queryParamMap.get('x');
    if (id) {
      this.isInsert.set(false);
      this.itemId.set(Number(id));
      this.loadConfigs().then(() => this.loadItem(Number(id)));
    } else {
      this.loadConfigs().then(() => {
        const prefill = (history as any).state?.prefill;
        if (prefill) this.applyPrefill(prefill);
        this.isLoading.set(false);
      });
    }
  }

  // -------------------------------------------------------
  // Carregamento
  // -------------------------------------------------------
  private async loadConfigs(): Promise<void> {
    return new Promise((resolve) => {
      this.itemApi.getConfigs().subscribe({
        next: (configs: ItemConfigsApiResp) => {
          const noCategory: CategoryDTO = { id: -1, name: '[Sem Categoria]', color: '#2F9300' };
          this.categories.set([noCategory, ...configs.categories]);
          this.selectedCategory.set(noCategory);
          this.categoryBtnLabel.set(noCategory.name!);

          const noSituation: ItemSituation = { id: -1, name: 'Selecione' };
          this.situations.set([noSituation, ...configs.itemSituations]);

          const noAcqType: AcquisitionType = { id: -1, name: 'Selecione' };
          this.acquisitionTypes.set([noAcqType, ...configs.acquisitionTypes]);

          this.lastPurchaseStores.set(configs.lastPurchaseStores ?? []);
          resolve();
        },
        error: () => resolve(),
      });
    });
  }

  private loadItem(id: number) {
    this.itemApi.getById(id).subscribe({
      next: (item) => {
        this.form.patchValue({
          name: item.name ?? '',
          technicalDescription: item.technicalDescription ?? '',
          acquisitionDate: item.acquisitionDate?.substring(0, 10) ?? this.todayStr(),
          situationId: item.situation?.id ?? null,
          acquisitionTypeId: item.acquisitionType?.id ?? null,
          purchaseValue: item.purchaseValue != null
            ? this.formatCurrencyInput(item.purchaseValue)
            : '',
          purchaseStore: item.purchaseStore ?? '',
          comment: item.comment ?? '',
          resaleValue: item.resaleValue != null
            ? this.formatCurrencyInput(item.resaleValue)
            : '',
          withdrawalDate: item.withdrawalDate
            ? item.withdrawalDate.substring(0, 10)
            : this.todayStr(),
        });

        // Categoria
        if (item.category?.id != null) {
          const cat = this.categories().find((c) => c.id === item.category!.id) ?? null;
          if (cat) {
            this.selectedCategory.set(cat);
            if (item.category.subCategory?.id != null) {
              this.selectedSubCategoryId.set(item.category.subCategory.id);
              this.categoryBtnLabel.set(
                `${cat.name}/${item.category.subCategory.name}`,
              );
            } else {
              this.categoryBtnLabel.set(cat.name ?? '');
            }
          }
        }

        // Imagem
        if (item.image1) {
          this.originalImageName.set(item.image1);
          this.itemApi.getImage(id, item.image1).subscribe({
            next: (blob) => {
              const reader = new FileReader();
              reader.onload = () => this.imageDataUrl.set(reader.result as string);
              reader.readAsDataURL(blob);
            },
          });
        }

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // -------------------------------------------------------
  // Categoria / Subcategoria
  // -------------------------------------------------------
  onSelectCategory(categoryId: number) {
    const cat = this.categories().find((c) => c.id === categoryId) ?? null;
    this.selectedCategory.set(cat);
    this.selectedSubCategoryId.set(null);
    this.categoryBtnLabel.set(cat?.name ?? '');
    this.categoryError.set('');
  }

  onShowSubCategory(categoryId: number) {
    const cat = this.categories().find((c) => c.id === categoryId) ?? null;
    this.selectedCategory.set(cat);
  }

  onSelectSubCategory(subCategoryId: number | null) {
    this.selectedSubCategoryId.set(subCategoryId);
    const cat = this.selectedCategory();
    if (subCategoryId != null) {
      const sub = cat?.subCategories?.find((s) => s.id === subCategoryId);
      this.categoryBtnLabel.set(`${cat?.name}/${sub?.name}`);
    } else {
      this.categoryBtnLabel.set(cat?.name ?? '');
    }
    this.categoryError.set('');
  }

  // -------------------------------------------------------
  // Imagem
  // -------------------------------------------------------
  onImageSelected(dataUrl: string) {
    this.imageDataUrl.set(dataUrl);
  }

  deleteImage() {
    this.imageDataUrl.set(null);
    this.originalImageName.set(null);
  }

  openCamera() {
    if (!isPlatformBrowser(this.platformId)) return;
    const modalEl = document.getElementById('modalCamera');
    if (!modalEl) return;
    // Abre o modal e inicia a câmera via referência ao componente filho
    const modal = (window as any).bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    // Dispara o evento de início de câmera após o modal abrir
    modalEl.addEventListener(
      'shown.bs.modal',
      () => {
        this.cameraRef?.startCamera();
      },
      { once: true },
    );
  }

  @ViewChild(ModalCamera) cameraRef?: ModalCamera;

  // -------------------------------------------------------
  // Validação
  // -------------------------------------------------------
  private validate(): boolean {
    this.situationError.set('');
    this.categoryError.set('');
    this.acquisitionTypeError.set('');
    let valid = true;

    const { situationId, acquisitionTypeId } = this.form.value;

    if (!situationId || situationId === -1) {
      this.situationError.set('Selecione uma situação válida.');
      valid = false;
    }
    if (!this.selectedCategory() || this.selectedCategory()!.id === -1) {
      this.categoryError.set('Selecione uma categoria válida.');
      valid = false;
    }
    if (!acquisitionTypeId || acquisitionTypeId === -1) {
      this.acquisitionTypeError.set('Selecione um tipo de aquisição válido.');
      valid = false;
    }
    if (this.form.invalid) valid = false;

    return valid;
  }

  // -------------------------------------------------------
  // Submit
  // -------------------------------------------------------
  async onSubmit() {
    if (!this.validate() || this.isSaving()) return;
    this.isSaving.set(true);

    const v = this.form.value;
    const isResale = Number(v.situationId) === RESALE_STATUS_ID;
    const quantity = Number(v.quantity) || 1;

    const payload: any = {
      name: v.name?.trim(),
      technicalDescription: v.technicalDescription?.trim() || null,
      acquisitionDate: v.acquisitionDate,
      situation: { id: Number(v.situationId) },
      acquisitionType: { id: Number(v.acquisitionTypeId) },
      purchaseValue: this.parseCurrency(v.purchaseValue),
      purchaseStore: v.purchaseStore?.trim() || null,
      comment: v.comment?.trim() || null,
      category: {
        id: this.selectedCategory()!.id,
        subCategory: this.selectedSubCategoryId() != null
          ? { id: this.selectedSubCategoryId() }
          : null,
      },
      resaleValue: isResale ? this.parseCurrency(v.resaleValue) : null,
      withdrawalDate: isResale ? v.withdrawalDate : null,
    };

    const id = this.itemId();

    // Bulk insert: quantity > 1 e modo insert
    if (!id && quantity > 1) {
      this.itemApi.insertBulk(payload, quantity).subscribe({
        next: (result) => {
          this.toastService.showSuccess(`${result.count} itens cadastrados!`);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('Erro ao cadastrar itens:', err);
          this.toastService.showError('Erro ao cadastrar itens. Tente novamente.');
          this.isSaving.set(false);
        },
      });
      return;
    }

    const obs$ = id
      ? this.itemApi.update({ ...payload, id })
      : this.itemApi.insert(payload);

    obs$.subscribe({
      next: async (result: any) => {
        const savedId = id ?? result?.id;

        // Gerenciar imagem
        if (savedId) {
          await this.handleImageUpload(savedId);
        }

        this.toastService.showSuccess(id ? 'Item atualizado!' : 'Item adicionado!');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Erro ao salvar item:', err);
        this.toastService.showError('Erro ao salvar item. Tente novamente.');
        this.isSaving.set(false);
      },
    });
  }

  private async handleImageUpload(itemId: number): Promise<void> {
    const currentImage = this.imageDataUrl();
    const originalName = this.originalImageName();

    // Deletar imagem existente se foi removida
    if (!currentImage && originalName) {
      await this.itemApi.deleteImage(itemId, originalName).toPromise().catch(() => {});
      return;
    }

    // Fazer upload se há nova imagem (base64 começa com "data:")
    if (currentImage?.startsWith('data:')) {
      const [meta, base64] = currentImage.split(',');
      const mimeType = meta.split(':')[1].split(';')[0];
      await this.itemApi.uploadImage(itemId, base64, mimeType).toPromise().catch(() => {});
    }
  }

  duplicate() {
    const v = this.form.value;
    this.router.navigate(['/item-edit'], {
      state: {
        prefill: {
          name: v.name,
          technicalDescription: v.technicalDescription,
          situationId: v.situationId,
          acquisitionTypeId: v.acquisitionTypeId,
          purchaseValue: v.purchaseValue,
          purchaseStore: v.purchaseStore,
          comment: v.comment,
          resaleValue: v.resaleValue,
          withdrawalDate: v.withdrawalDate,
          categoryId: this.selectedCategory()?.id,
          subCategoryId: this.selectedSubCategoryId(),
          categoryLabel: this.categoryBtnLabel(),
        },
      },
    });
  }

  private applyPrefill(prefill: any) {
    this.form.patchValue({
      name: prefill.name ?? '',
      technicalDescription: prefill.technicalDescription ?? '',
      acquisitionDate: this.todayStr(),
      situationId: prefill.situationId,
      acquisitionTypeId: prefill.acquisitionTypeId,
      purchaseValue: prefill.purchaseValue ?? '',
      purchaseStore: prefill.purchaseStore ?? '',
      comment: prefill.comment ?? '',
      resaleValue: prefill.resaleValue ?? '',
      withdrawalDate: prefill.withdrawalDate ?? this.todayStr(),
    });

    if (prefill.categoryId != null) {
      const cat = this.categories().find((c) => c.id === prefill.categoryId) ?? null;
      if (cat) {
        this.selectedCategory.set(cat);
        this.selectedSubCategoryId.set(prefill.subCategoryId ?? null);
        this.categoryBtnLabel.set(prefill.categoryLabel ?? cat.name ?? '');
        this.categoryError.set('');
      }
    }
  }

  deleteItem() {
    if (this.isDeleting() || !this.itemId()) return;
    const modalEl = document.getElementById('modalConfirmDelete');
    if (!modalEl) return;
    (window as any).bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  confirmDelete() {
    if (this.isDeleting() || !this.itemId()) return;
    this.isDeleting.set(true);

    const modalEl = document.getElementById('modalConfirmDelete');
    if (modalEl) (window as any).bootstrap.Modal.getOrCreateInstance(modalEl).hide();

    this.itemApi.delete(this.itemId()!).subscribe({
      next: () => {
        this.toastService.showSuccess('Item excluído!');
        this.router.navigate(['/home']);
      },
      error: () => {
        this.toastService.showError('Erro ao excluir item. Tente novamente.');
        this.isDeleting.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // -------------------------------------------------------
  // Helpers
  // -------------------------------------------------------
  get f() { return this.form.controls; }

  get isResale(): boolean {
    return Number(this.form.value.situationId) === RESALE_STATUS_ID;
  }

  private todayStr(): string {
    return new Date().toISOString().substring(0, 10);
  }

  /** Formata number → "1.234,56" (input pt-BR) */
  private formatCurrencyInput(value: number): string {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Converte "1.234,56" → 1234.56 */
  parseCurrency(input: string | null | undefined): number | null {
    if (!input?.trim()) return null;
    const clean = input.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  onQuantityInput(event: Event) {
    const el = event.target as HTMLInputElement;
    let val = parseInt(el.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 99) val = 99;
    el.value = String(val);
    this.form.get('quantity')?.setValue(val, { emitEvent: false });
  }

  /** Formata enquanto digita: apenas dígitos → centavos à esquerda */
  onCurrencyInput(event: Event) {
    const el = event.target as HTMLInputElement;
    const controlName = el.getAttribute('formControlName')!;
    let digits = el.value.replace(/\D/g, '');
    if (!digits) { this.form.get(controlName)?.setValue(''); return; }
    while (digits.length < 3) digits = '0' + digits;
    const dec = digits.slice(-2);
    let whole = parseInt(digits.slice(0, -2), 10).toString();
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const formatted = `${whole},${dec}`;
    this.form.get(controlName)?.setValue(formatted, { emitEvent: false });
    el.value = formatted;
  }
}
