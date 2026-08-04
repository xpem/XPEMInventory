# Plano de Migração: InventoryWeb → XPEMInventory

Este documento detalha as tarefas da migração em ordem de execução.  
Para contexto completo dos projetos, veja [CONTEXTO.md](./CONTEXTO.md).

---

## Fase 1 — Setup e Infraestrutura

### 1.1 Instalar dependências
```bash
npm install bootstrap bootstrap-icons @popperjs/core ngx-cookie-service @angular/cdk
npm install -D @types/bootstrap
```

### 1.2 Configurar `angular.json`
- Adicionar Bootstrap CSS e JS nos `styles` e `scripts` (igual ao MercurioClient)

### 1.3 Copiar tema global
- Copiar `src/styles.css` do XpemMercurioClient para o XPEMInventory
- Remover variáveis relacionadas a marketplace (mercado-livre-color, shopee-color)
- Manter todas as variáveis de status de itens e o tema dark

### 1.4 Atualizar `app.config.ts`
- Adicionar `provideHttpClient(withFetch(), withInterceptors([tokenInterceptor]))`
- Adicionar `provideRouter(routes, withPreloading(PreloadAllModules))`
- Registrar locale `pt-BR`
- Adicionar `CookieService` como provider

### 1.5 Configurar estrutura de pastas
Criar a estrutura base:
```
src/app/
├── components/
├── models/
├── pages/
└── services/
```

---

## Fase 2 — Infraestrutura de Autenticação

> Referência: copiar e adaptar do XpemMercurioClient

### 2.1 `auth.service.ts`
- Gerenciar token JWT via `ngx-cookie-service` (igual ao MercurioClient)
- Métodos: `getToken()`, `saveToken()`, `clearToken()`, `isAuthenticated()`

### 2.2 `token-interceptor.ts`
- Injetar Bearer token em todas as requisições HTTP
- Copiar do MercurioClient

### 2.3 `auth-guard.ts`
- Guard funcional protegendo rotas autenticadas
- Redirecionar para `/user/signin` se não autenticado
- Copiar do MercurioClient e ajustar rota de redirecionamento

### 2.4 Serviço de API de usuário (`user-api.ts`)
- `signIn(email, password)` → `POST /api/user/signin`
- `signUp(data)` → `POST /api/user/signup`
- `updatePassword(data)` → `PUT /api/user/password`

---

## Fase 3 — Layout Base

### 3.1 Sidebar (`components/sidebar/`)
- Adaptar sidebar do MercurioClient para o Inventory
- Links de navegação:
  - Principal → `/home`
  - Categorias → `/category/list`
  - Sair (logout)
- Exibir nome e email do usuário no header da sidebar
- Versão no rodapé

### 3.2 Componente raiz `app.ts`
- Adicionar `RouterOutlet`
- Incluir `<app-sidebar>` e `<app-toasts>` no layout

### 3.3 Toasts (`components/toasts/`)
- Copiar componente de toasts do MercurioClient
- `toast.service.ts` com `showToast(message, style)`

---

## Fase 4 — Autenticação (Páginas)

### 4.1 SignIn (`pages/user/sign-in/`)
- Formulário: email + senha
- Chamar `user-api.signIn()`
- Salvar token via `auth.service.saveToken()`
- Redirecionar para `/home` após sucesso
- Redirecionar para `/home` se já autenticado

### 4.2 SignUp (`pages/user/sign-up/`)
- Formulário: nome, email, senha, confirmação de senha
- Chamar `user-api.signUp()`

### 4.3 UpdatePassword (`pages/user/update-password/`)
- Formulário: senha atual + nova senha + confirmação

---

## Fase 5 — Modelos de Dados (TypeScript)

Criar interfaces em `models/` replicando os DTOs do InventoryWeb:

```typescript
// models/item.model.ts
export interface ItemDTO { ... }
export interface ItemSituation { id: number; name: string; sequence?: number; quantity?: number; }
export interface AcquisitionType { id: number; name: string; }
export interface ItemConfigsApiResp { 
  categories: CategoryDTO[];
  itemSituations: ItemSituation[];
  acquisitionTypes: AcquisitionType[];
  lastPurchaseStores: string[];
}

// models/category.model.ts
export interface CategoryDTO { id?: number; name: string; color: string; systemDefault?: boolean; subCategories?: SubCategoryDTO[]; subCategory?: SubCategoryDTO; }
export interface SubCategoryDTO { id?: number; name: string; iconName?: string; }

// models/api.model.ts
export interface ApiResponse<T> { success: boolean; content?: T; errorMessage?: string; }
export interface PaginatedResponse<T> { items: T[]; totalPages: number; }
```

---

## Fase 6 — Serviços de API

### 6.1 `item-api.ts`
- `getItemConfigs(token)` → categorias + situações + tipos de aquisição
- `getItemsTotalPages(params?)` → total de páginas
- `getItemsPaginated(page, params?)` → lista paginada
- `getItemById(id)` → item por ID
- `insertItem(item)` → criar item
- `updateItem(item)` → atualizar item
- `getItemImages(itemId, fileName)` → imagem base64
- `addItemImage(itemId, imageBytes)` → upload de imagem
- `deleteItemImage(itemId, fileName)` → remover imagem

### 6.2 `category-api.ts`
- `getCategories()` → lista de categorias
- `getCategoryById(id)` → categoria por ID
- `insertCategory(category)` → criar categoria
- `updateCategory(category)` → atualizar categoria
- `deleteCategory(id)` → excluir categoria

### 6.3 `subcategory-api.ts`
- `getSubCategories(categoryId)` → subcategorias de uma categoria
- `insertSubCategory(subcategory)` → criar subcategoria
- `updateSubCategory(subcategory)` → atualizar subcategoria
- `deleteSubCategory(id)` → excluir subcategoria

---

## Fase 7 — Home (Lista de Itens)

**Referência:** `InventoryWeb/Pages/Home.razor`

### Funcionalidades
- Lista de itens em cards (grid responsivo: 1 col mobile, 2 md, 3 lg)
- Card exibe: nome, categoria+subcategoria, situação, data de aquisição, valor
- Scroll infinito (carregar mais ao rolar)
- Painel de filtros (toggle):
  - Filtro por situação (botões coloridos com contagem)
  - Busca por nome (input + botão)
- Botão "Adicionar Item" → `/item/edit`
- Click no card → `/item/edit?x={id}`
- Loading spinner durante carregamento

### Componente: `pages/home/home.ts`
```
Signals: items, totalPages, currentPage, isLoading, searchPanelVisible, searchText, selectedSituations
```

---

## Fase 8 — CRUD de Itens

**Referência:** `InventoryWeb/Pages/Item/ItemEdit.razor`

### ItemEdit (`pages/item/item-edit/`)

**Campos do formulário:**
- Nome (obrigatório)
- Categoria (modal de seleção) + subcategoria (modal secundário)
- Situação (select)
- Tipo de aquisição (select)
- Data de aquisição (date picker)
- Valor de compra (input com formatação R$ em tempo real)
- Loja (input com datalist/autocomplete das últimas lojas)
- Descrição técnica (textarea)
- Comentários (textarea)

**Campos condicionais (quando situação = "Revendido"):**
- Valor de revenda
- Data de retirada

**Foto:**
- Upload via câmera (modal com acesso à câmera do dispositivo)
- Upload via arquivo
- Preview da imagem atual
- Botão excluir foto

**Comportamentos:**
- Modo inserção vs. edição (parâmetro `x` na query string)
- Validação antes de submeter
- Toast de sucesso/erro após salvar
- Redirecionar para `/home` após salvar
- Formatação de moeda brasileira (R$ 1.234,56)

### Modais auxiliares
- `modal-categories/` — exibe grid de categorias para seleção
- `modal-subcategories/` — exibe subcategorias da categoria selecionada
- `modal-camera/` — acesso à câmera do dispositivo
- `modal-select-file/` — upload de arquivo de imagem

---

## Fase 9 — CRUD de Categorias

**Referência:** `InventoryWeb/Pages/Category/`

### CategoryList (`pages/category/category-list/`)
- Lista todas as categorias
- Cada categoria exibe: círculo colorido, nome, quantidade de subcategorias
- Click → editar categoria
- Botão "Nova Categoria"

### CategoryEdit (`pages/category/category-edit/`)
- Campos: nome, cor (color picker)
- Modo inserção vs. edição
- Gerenciamento de subcategorias inline (lista + adicionar/editar/excluir)

---

## Fase 10 — Rotas Finais

```typescript
export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'user/signin', component: SignIn },
  { path: 'user/signup', component: SignUp },
  { path: 'user/update-password', component: UpdatePassword, canActivate: [authGuard] },
  { path: 'item/edit', component: ItemEdit, canActivate: [authGuard] },
  { path: 'category/list', component: CategoryList, canActivate: [authGuard] },
  { path: 'category/edit', component: CategoryEdit, canActivate: [authGuard] },
];
```

---

## Checklist de Progresso

### Fase 1 — Setup
- [x] Instalar dependências (Bootstrap, Bootstrap Icons, ngx-cookie-service, CDK)
- [x] Configurar `angular.json` (styles/scripts do Bootstrap)
- [x] Copiar e adaptar `styles.css`
- [x] Atualizar `app.config.ts`
- [x] Criar estrutura de pastas

### Fase 2 — Auth Infraestrutura
- [x] `auth.service.ts`
- [x] `token-interceptor.ts`
- [x] `auth-guard.ts`
- [x] `user-api.ts`

### Fase 3 — Layout
- [x] Sidebar
- [x] `app.ts` (layout raiz)
- [x] Toast component + service

### Fase 4 — Páginas de Autenticação
- [x] SignIn
- [x] SignUp
- [x] UpdatePassword

### Fase 5 — Modelos
- [x] `item.model.ts`
- [x] `category.model.ts`
- [x] `api.model.ts`

### Fase 6 — Serviços de API
- [x] `item-api.ts`
- [x] `category-api.ts`
- [x] `subcategory-api.ts`

### Fase 7 — Home
- [x] Lista de itens com scroll infinito
- [x] Filtro por situação
- [x] Busca por nome

### Fase 8 — CRUD de Itens
- [x] Formulário ItemEdit (inserção/edição)
- [x] Modal de categorias
- [x] Modal de subcategorias
- [x] Modal de câmera
- [x] Modal de arquivo
- [x] Formatação de moeda

### Fase 9 — CRUD de Categorias
- [x] CategoryList
- [x] CategoryEdit + subcategorias

### Fase 10 — Rotas
- [x] Configurar todas as rotas
- [x] Validar navegação e guards
