export interface HistoricField {
  id: number;
  fieldId: number;
  fieldName: string | null;
  updatedFrom: string;
  updatedTo: string;
}

export interface HistoricEntry {
  id: number;
  createdAt: string;
  typeId: number;
  typeName: string | null;
  fields: HistoricField[];
}

export interface ItemHistoric extends HistoricEntry {
  itemId: number;
}

export interface CategoryHistoric extends HistoricEntry {
  categoryId: number;
}

export interface SubCategoryHistoric extends HistoricEntry {
  subCategoryId: number;
}
