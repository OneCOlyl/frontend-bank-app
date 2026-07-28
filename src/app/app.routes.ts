import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Маршруты приложения. Компоненты грузятся лениво (loadComponent) — code splitting,
 * меньше стартовый бандл. Режим рендеринга каждого роута задаётся в app.routes.server.ts.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'ПСБ — Банк для жизни и бизнеса',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    title: 'Продукты и тарифы — ПСБ',
    loadComponent: () =>
      import('./features/products/products.component').then((m) => m.ProductsComponent),
  },
  {
    path: 'rates',
    title: 'Курсы валют — ПСБ',
    loadComponent: () =>
      import('./features/rates/rates.component').then((m) => m.RatesComponent),
  },
  {
    path: 'news',
    title: 'Новости — ПСБ',
    loadComponent: () =>
      import('./features/news/news-list.component').then((m) => m.NewsListComponent),
  },
  {
    path: 'news/:slug',
    title: 'Новость — ПСБ',
    loadComponent: () =>
      import('./features/news/news-detail.component').then((m) => m.NewsDetailComponent),
  },
  {
    path: 'login',
    title: 'Вход — ПСБ',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'application',
    title: 'Заявка на продукт — ПСБ',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/application/application.component').then(
        (m) => m.ApplicationComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];
