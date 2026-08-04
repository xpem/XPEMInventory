import { CategoryDTO } from './category.model';

// Re-export para conveniência — quem importar item.model tem acesso a CategoryDTO
export type { CategoryDTO } from './category.model';

// -------------------------------------------------------
// Enums
// -------------------------------------------------------

export enum ResultOrderBy {
  CreatedAt = 0,
  Name = 1,
  AcquisitionDate = 2,
  UpdatedAt = 3,
}

/** IDs de situações que representam saída do inventário */
export const OUT_SITUATION_IDS = [4, 5, 3, 7];
export const RESALE_STATUS_ID = 5;

// -------------------------------------------------------
// Tipos base
// -------------------------------------------------------

export interface AcquisitionType {
  id?: number | null;
  name?: string | null;
  sequence?: number;
}

export interface ItemSituation {
  id?: number | null;
  name?: string | null;
  sequence?: number;
  /** Quantidade de itens nessa situação — usado no agrupamento da Home */
  quantity?: number;
}

// -------------------------------------------------------
// DTOs principais
// -------------------------------------------------------

/** DTO retornado pela API nas listagens e no detalhe do item */
export interface ItemDTO {
  id?: number | null;
  name?: string | null;
  technicalDescription?: string | null;
  /** ISO 8601 string — ex: "2024-03-15T00:00:00" */
  acquisitionDate: string;
  acquisitionType?: AcquisitionType | null;
  purchaseValue?: number | null;
  purchaseStore?: string | null;
  resaleValue?: number | null;
  situation?: ItemSituation | null;
  comment?: string | null;
  category?: CategoryDTO | null;
  createdAt?: string;
  updatedAt?: string;
  /** ISO 8601 string ou null */
  withdrawalDate?: string | null;
  image1?: string | null;
  image2?: string | null;

  // Campos calculados para listagem no front
  image1Base64?: string | null;
  isImage1Base64?: boolean;
  categoryAndSubCategory?: string | null;
  subCategoryIcon?: string | null;
}

/** Parâmetros de busca para a listagem paginada */
export interface ItemSearchParams {
  name?: string | null;
  situations?: number[] | null;
  orderBy?: ResultOrderBy | null;
}

/** Resposta da API com totais de paginação */
export interface ItemTotals {
  totalItems: number;
  totalPages: number;
}

/** Agrupamento de configs retornado por GET /Inventory/item/configs */
export interface ItemConfigsApiResp {
  acquisitionTypes: AcquisitionType[];
  itemSituations: ItemSituation[];
  categories: CategoryDTO[];
  lastPurchaseStores: string[];
}

// -------------------------------------------------------
// Modelos de UI (formulários)
// -------------------------------------------------------

/** Modelo de formulário para criar/editar item */
export interface UIItem {
  id?: number | null;
  name: string;
  technicalDescription?: string | null;
  /** "YYYY-MM-DD" */
  acquisitionDate: string;
  acquisitionType?: AcquisitionType | null;
  /** String formatada em pt-BR — ex: "1.234,56" */
  purchaseValue?: string | null;
  purchaseStore?: string | null;
  /** String formatada em pt-BR */
  resaleValue?: string | null;
  situation?: ItemSituation | null;
  comment?: string | null;
  category?: CategoryDTO | null;
  /** "YYYY-MM-DD" */
  withdrawalDate?: string | null;
  image1Base64?: string | null;
  isImage1Base64?: boolean;
}

/** Situação com cor de fundo para os botões de filtro da Home */
export interface UIItemSituation {
  id?: number | null;
  name: string;
  /** Typo mantido para compatibilidade com a API original */
  backgoundColor: string;
  quantity: number;
}
