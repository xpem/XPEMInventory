// -------------------------------------------------------
// Category models
// -------------------------------------------------------

export interface SubCategoryDTO {
  id?: number | null;
  name?: string | null;
  /** Nome do ícone (Font Awesome / Bootstrap Icons) */
  iconName?: string | null;
  systemDefault?: boolean;
  categoryId?: number;
  // DTOBase fields
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
  inactive?: boolean;
}

export interface CategoryDTO {
  id?: number | null;
  name?: string | null;
  color?: string | null;
  systemDefault?: boolean | null;
  /** Lista de subcategorias — presente em endpoints de detalhe */
  subCategories?: SubCategoryDTO[] | null;
  /** Subcategoria selecionada do item — presente no GET de um item */
  subCategory?: SubCategoryDTO | null;
}

// -------------------------------------------------------
// UI models (formulários)
// -------------------------------------------------------

export interface UICategory {
  id?: number;
  name: string;
  /** Typo mantido para compatibilidade com a API original */
  backgoundColor?: string;
  color?: string;
  haveSubcategories?: boolean;
  systemDefault?: boolean;
  subCategories?: SubCategoryDTO[];
}

export interface UISubCategory {
  id?: number | null;
  name?: string | null;
  icon?: string | null;
  systemDefault?: boolean;
}
