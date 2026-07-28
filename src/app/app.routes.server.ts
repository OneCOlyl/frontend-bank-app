import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Стратегия рендеринга per-route — ключевое требование задания (CSR/SSR/SSG/ISR).
 *
 *  - Prerender (SSG): статические страницы собираются на билде.
 *  - Server (SSR):    HTML собирается на каждый запрос из свежих данных (SEO, TTFB).
 *  - Server + Cache-Control s-maxage/stale-while-revalidate (ISR): серверный рендер
 *    кешируется на CDN на N секунд и переотдаётся из кеша с фоновой регенерацией.
 *  - Client (CSR):    интерактивные/приватные страницы рендерятся только в браузере.
 */
export const serverRoutes: ServerRoute[] = [
  // SSG — маркетинговая главная, максимально быстрая отдача статики.
  { path: '', renderMode: RenderMode.Prerender },

  // SSR — каталог и новости: контент индексируется и виден до гидрации.
  { path: 'products', renderMode: RenderMode.Server },
  { path: 'news', renderMode: RenderMode.Server },
  { path: 'news/:slug', renderMode: RenderMode.Server },

  // ISR (эмуляция через заголовки кеширования поверх SSR).
  {
    path: 'rates',
    renderMode: RenderMode.Server,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  },

  // CSR — вход и заявка: приватные интерактивные страницы, серверный рендер не нужен.
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'application', renderMode: RenderMode.Client },

  // Прочее — серверный рендер как безопасный дефолт.
  { path: '**', renderMode: RenderMode.Server },
];
