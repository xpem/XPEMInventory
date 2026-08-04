// -------------------------------------------------------
// API response wrappers
// -------------------------------------------------------

export enum ApiErrorType {
  TokenExpired = 0,
  Unknown = 1,
  ServerUnavailable = 2,
  WrongEmailOrPassword = 3,
  Unauthorized = 4,
  BodyContentNull = 5,
}

/** Resposta genérica das chamadas HTTP para a API */
export interface ApiResponse<T = unknown> {
  success: boolean;
  content?: T | null;
  error?: ApiErrorType | null;
  /** Indica se o cliente deve tentar renovar o token e repetir */
  tryRefreshToken?: boolean;
}

/** Resposta paginada genérica */
export interface PaginatedResponse<T> {
  items: T[];
  totalPages: number;
  totalItems: number;
}

// -------------------------------------------------------
// User models
// -------------------------------------------------------

export interface UserModel {
  id: number;
  name?: string | null;
  email?: string | null;
  token?: string | null;
  lastUpdate?: string;
}
