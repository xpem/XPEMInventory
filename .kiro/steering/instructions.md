# AI Agent Instructions for XPEMInventory

## Project Overview
This is an Angular 20.3 application with Server-Side Rendering (SSR) support.
It is a **personal inventory management system**, migrated from a Blazor WebAssembly project (`InventoryWeb`).

## Reference Projects

### XpemMercurioClient — Base de referência obrigatória
**Path:** `d:\Emanuel\Projetos\XpemMercurio\XpemMercurioClient`

**Toda implementação de ajuste, nova feature ou componente neste projeto deve primeiro consultar o XpemMercurioClient como base.**

Isso inclui:
- Padrões de componentes (estrutura de arquivos, nomes, decorators)
- Estilos e classes CSS (variáveis, cards, botões, layout)
- Padrões de serviços HTTP (interceptors, error handling)
- Configuração do `app.config.ts`
- Uso de signals, `@if`/`@for`, standalone components
- Qualquer padrão Angular que não esteja claro neste projeto

Se o XpemMercurioClient não tiver um padrão para o caso específico, usar as convenções já estabelecidas no XPEMInventory.

### InventoryWeb — Fonte das regras de negócio
**Path:** `d:\Emanuel\Projetos\XpemInventory\InventoryWeb\InventoryWeb`

- Framework: Blazor WebAssembly (.NET 9, C#)
- Consultar quando precisar entender regras de negócio, campos de formulário, fluxos de tela ou endpoints de API

---

## Architecture & Structure
- **SSR Architecture**: Angular Universal
  - Entry points: `src/main.ts` (browser), `src/main.server.ts` (server)
  - Server setup: `src/server.ts`
- **Key Directories**:
  - `src/app/pages/` — page components (home, item, category, user)
  - `src/app/components/` — shared components (sidebar, toasts)
  - `src/app/services/` — API services (item-api, category-api, subcategory-api, user-api, auth.service, toast.service)
  - `src/app/models/` — TypeScript interfaces (item.model, category.model, api.model)

## Stack
- Angular 20.3, zoneless change detection, standalone components
- Bootstrap 5 + Bootstrap Icons (sem Angular Material)
- `ngx-cookie-service` para persistência de token JWT
- `@angular/cdk`
- RxJS 7.8
- SSR com `@angular/ssr`

## Project Conventions

### Code Formatting
- Prettier com `printWidth: 100` e `singleQuote: true`

### SSR Safety
- **Todo `ngOnInit` que faz chamadas HTTP ou acessa `window`/`document` deve ser protegido com `isPlatformBrowser`**
- Guards (`authGuard`) retornam `of(true)` no servidor
- Exemplo:
  ```typescript
  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    // chamadas de API aqui
  }
  ```

### Angular 20.3 Modern Control Flow
Sempre usar a sintaxe nova — **nunca** `*ngIf`, `*ngFor`, `*ngSwitch`:

```html
@if (condition) { ... }
@for (item of items; track item.id) { ... }
@switch (value) { @case ('x') { ... } }
```

### Signals
Preferir signals para estado local dos componentes:
```typescript
items = signal<ItemDTO[]>([]);
isLoading = signal(true);
```

### HTTP Services
- Todos os serviços são `@Injectable({ providedIn: 'root' })` com `inject(HttpClient)`
- Base URL via proxy: `/api/...`
- O `tokenInterceptor` injeta `Authorization: Bearer <token>` automaticamente

### Standalone Components
- Todo componente é standalone (`standalone: true`)
- Sem NgModules

## API Endpoints (base: `/api/Inventory`)
| Recurso | Prefixo |
|---|---|
| Item | `/api/Inventory/item` |
| Categoria | `/api/Inventory/category` |
| Subcategoria | `/api/Inventory/subcategory` |
| Usuário | `/api/user` |

## Routes
```
/user/signin          — SignIn
/user/signup          — SignUp
/user/update-password — UpdatePassword
/home                 — Home (authGuard)
/item/edit            — ItemEdit (authGuard, ?x=id para edição)
/category/list        — CategoryList (authGuard)
/category/edit        — CategoryEdit (authGuard, ?x=id para edição)
```
