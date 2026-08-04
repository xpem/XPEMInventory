import { Routes } from '@angular/router';
import { authGuard } from './auth-guard';
import { SignIn } from './pages/user/sign-in/signin';
import { SignUp } from './pages/user/sign-up/signup';
import { UpdatePassword } from './pages/user/update-password/update-password';
import { Home } from './pages/home/home';
import { ItemEdit } from './pages/item/item-edit/item-edit';
import { CategoryList } from './pages/category/category-list/category-list';
import { CategoryEdit } from './pages/category/category-edit/category-edit';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Autenticação
  { path: 'user/signin', component: SignIn, data: { title: 'Entrar' } },
  { path: 'user/signup', component: SignUp, data: { title: 'Criar Conta' } },
  { path: 'user/update-password', component: UpdatePassword, data: { title: 'Recuperar Senha' } },

  // Protegidas
  { path: 'home', component: Home, canActivate: [authGuard], data: { title: '<i class="bi bi-house"></i> Principal' } },
  { path: 'item/edit', component: ItemEdit, canActivate: [authGuard], data: { title: 'Item' } },
  { path: 'category/list', component: CategoryList, canActivate: [authGuard], data: { title: '<i class="bi bi-tags"></i> Categorias' } },
  { path: 'category/edit', component: CategoryEdit, canActivate: [authGuard], data: { title: 'Categoria' } },
];
