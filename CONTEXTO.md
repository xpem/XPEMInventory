# Contexto da Migração: XPEMInventory

Este documento descreve os três projetos envolvidos na migração e o papel de cada um.

---

## Os Três Projetos

### 1. `XpemMercurioClient` — Base de referência (Angular)

**Localização:** `d:\Emanuel\Projetos\XpemMercurio\XpemMercurioClient`  
**Tecnologia:** Angular 20.3, SSR, zoneless, standalone components

Este é o projeto Angular mais maduro, que serve como **modelo de estilos, padrões de código e arquitetura** para o XPEMInventory. Não haverá migração de funcionalidades de negócio dele — apenas reutilização de infraestrutura.

**O que reutilizamos deste projeto:**
- Tema dark completo (`src/styles.css`) — variáveis CSS, cards, botões, layout
- Estrutura de pastas: `pages/`, `components/`, `services/`, `models/`
- Infraestrutura de autenticação: `auth-guard.ts`, `token-interceptor.ts`, `auth.service.ts`
- Configuração do `app.config.ts`: `provideHttpClient`, `withInterceptors`, locale `pt-BR`, `CookieService`
- Componentes compartilhados: `sidebar`, `toasts`
- Padrões de código: signals, `@if`/`@for`, standalone components, zoneless change detection

**Stack:**
- Bootstrap 5 + Bootstrap Icons (sem Angular Material)
- `ngx-cookie-service` para persistência de token JWT
- `@angular/cdk` para utilitários
- RxJS 7.8

**Estrutura `src/app`:**
```
app/
├── components/
│   ├── sidebar/          ← layout principal (offcanvas Bootstrap)
│   ├── toasts/           ← sistema de notificações toast
│   └── notifications-list/
├── models/               ← interfaces e tipos TypeScript
├── pages/
│   ├── home/
│   ├── user/             ← sign-in, sign-up, update-password, password-send-email
│   ├── bond/
│   ├── product/
│   ├── order-detail/
│   ├── shipment/
│   ├── company/
│   ├── marketplace/
│   └── notification-history/
├── services/             ← serviços de API (auth, product, order, etc.)
├── app.ts                ← componente raiz
├── app.routes.ts         ← rotas
├── auth-guard.ts         ← guard de autenticação
└── token-interceptor.ts  ← interceptor HTTP com JWT
```

---

### 2. `InventoryWeb` — Projeto legado (Blazor)

**Localização:** `d:\Emanuel\Projetos\XpemInventory\InventoryWeb\InventoryWeb`  
**Tecnologia:** Blazor WebAssembly (.NET 9, C#/Razor)

Este é o sistema de inventário pessoal existente. É a **fonte das funcionalidades de negócio** que serão migradas para Angular. O código é em C#/Razor e não pode ser copiado diretamente — precisa ser reescrito em TypeScript/Angular.

**Funcionalidades a migrar:**
| Módulo | Página Razor | Descrição |
|--------|-------------|-----------|
| Autenticação | `SignIn.razor`, `SignUp.razor`, `UpdatePassword.razor` | Login/cadastro com JWT |
| Home (Lista de Itens) | `Home.razor` | Lista paginada, scroll infinito, filtro por situação, busca por nome |
| Edição de Item | `Item/ItemEdit.razor` | Formulário completo: nome, categoria, situação, aquisição, revenda, foto |
| Lista de Categorias | `Category/CategoryList.razor` | CRUD de categorias com cor |
| Edição de Categoria | `Category/CategoryEdit.razor` | Formulário de categoria |
| Subcategorias | `Category/SubCategory/*.razor` | CRUD de subcategorias |
| Layout | `Layout/NavMenu.razor` | Sidebar retrátil com overlay |

**Modelos de dados relevantes (a recriar em TypeScript):**
- `ItemDTO` — id, name, category, situation, acquisitionType, acquisitionDate, purchaseValue, purchaseStore, technicalDescription, comment, resaleValue, withdrawalDate, image1
- `CategoryDTO` — id, name, color, systemDefault, subCategories[]
- `SubCategoryDTO` — id, name, iconName
- `ItemSituation` — id, name, sequence, quantity (para agrupamento)
- `AcquisitionType` — id, name
- `ItemConfigsApiResp` — agrega categorias, situações e tipos de aquisição num único endpoint

**Autenticação (Blazor):**
- Token JWT armazenado no LocalStorage (`Blazored.LocalStorage`)
- `CustomAuthStateProvider` + `CustomAuthorizationMessageHandler`

---

### 3. `XPEMInventory` — Projeto de destino (Angular — este projeto)

**Localização:** `d:\Emanuel\Projetos\XpemInventory\XPEMInventory`  
**Tecnologia:** Angular 20.3, SSR, zoneless, standalone components

Este é o projeto **em construção**. Está no estado inicial gerado pelo Angular CLI, praticamente vazio. Receberá a migração completa das funcionalidades do InventoryWeb, usando o XpemMercurioClient como base visual e arquitetural.

**Estado atual:**
- `app.ts` — apenas `RouterOutlet` e title signal
- `app.routes.ts` — sem rotas
- `app.config.ts` — configuração mínima (sem HTTP client, sem locale)
- `styles.css` — vazio
- Sem dependências de Bootstrap, Bootstrap Icons, ngx-cookie-service

**Pacotes a instalar:**
```bash
npm install bootstrap bootstrap-icons @popperjs/core ngx-cookie-service @angular/cdk
npm install -D @types/bootstrap
```

---

## Visão Geral da Migração

```
InventoryWeb (Blazor)          XpemMercurioClient (Angular)
       |                                  |
       | funcionalidades de negócio       | estilos, infra, padrões
       |                                  |
       +---------->  XPEMInventory  <-----+
                    (Angular 20.3)
```

**Princípio geral:**
- O **o quê fazer** vem do InventoryWeb (regras de negócio, fluxos, campos)
- O **como fazer** vem do XpemMercurioClient (padrões Angular, componentes, tema)
