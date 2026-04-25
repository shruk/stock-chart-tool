import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'stock/:symbol', canActivate: [authGuard], loadComponent: () => import('./pages/stock-detail/stock-detail').then(m => m.StockDetailComponent) },
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/symbol-manager/symbol-manager').then(m => m.SymbolManagerComponent) },
  { path: '**', redirectTo: '' }
];
