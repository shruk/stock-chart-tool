import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'stock/:symbol', loadComponent: () => import('./pages/stock-detail/stock-detail').then(m => m.StockDetailComponent) },
  { path: '**', redirectTo: '' }
];
