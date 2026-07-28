# frontend-bank-app

Тестовое фронтенд-приложение. Работает поверх
тестового бэкенда [`backend-bank-app`](../backend-bank-app).

**Стек:** Angular 21 (standalone, signals), TypeScript 5, SSR через `@angular/ssr`,
Express, `@grpc/grpc-js`.

Демонстрирует ключевые требования вакансии:

| Требование | Как реализовано |
|------------|-----------------|
| Angular 16+ | Angular 21, standalone-компоненты, signals, `@defer`, `@if/@for` |
| Три транспорта | **REST** (HttpClient), **GraphQL** (тонкий клиент), **gRPC** (BFF на Node) |
| Real-time | **SSE** (live-курсы) + **WebSocket** (уведомления о заявках) |
| CSR / SSR / SSG / ISR | Режим задаётся per-route в `app.routes.server.ts` |
| Адаптивная кроссбраузерная вёрстка | CSS Grid/Flex, `clamp()`, логические свойства, бургер-меню, `prefers-reduced-motion` |
| SOLID / KISS / DRY / YAGNI | Слои core/features/shared, DIP через InjectionToken, единые доменные модели |
| Авторизация | JWT, функциональные interceptor + guard, SSR-safe хранилище токена |

## Запуск

Нужен запущенный бэкенд (REST :3000, gRPC :50051):

```bash
cd ../backend-bank-app && npm install && npm run dev
```

Затем фронтенд:

```bash
npm install
npm start                 # dev-сервер с SSR: http://localhost:4200
# или прод-сборка + Node SSR-сервер:
npm run build
PORT=4000 node dist/bankweb/server/server.mjs   # http://localhost:4000
```

Демо-доступ: `demo@psbank.ru` / `demo1234`.

Проверить искусственные лоадеры/скелетоны: запустить бэкенд с `LATENCY_MS=800`.

## Режимы рендеринга

Задаются в `src/app/app.routes.server.ts` (see `RenderMode`):

| Роут | Режим | Зачем |
|------|-------|-------|
| `/` | **SSG** (Prerender) | Статичный маркетинг — собирается на билде, мгновенная отдача. Данные («Выгодные продукты») в `@defer` грузятся в браузере, поэтому prerender не зависит от бэкенда. |
| `/products`, `/news`, `/news/:slug` | **SSR** | Контент рендерится на сервере из свежих данных — SEO + видно до гидрации. |
| `/rates` | **ISR** | SSR + `Cache-Control: s-maxage=60, stale-while-revalidate=300` — кеш на CDN с фоновой регенерацией. |
| `/login`, `/application` | **CSR** | Приватные интерактивные страницы — серверный рендер не нужен. |

Каждая страница показывает бейдж с режимом и местом рендера (сервер/браузер) —
компонент `RenderBadgeComponent`.

## Транспорты

- **REST** — `HttpClient` напрямую в backend `:3000/api/v1` (курсы, новости, auth, заявки).
- **GraphQL** — тонкий клиент `GraphqlClient` поверх `HttpClient` (POST `/graphql`),
  продукты запрашивают ровно нужные поля. Без Apollo (KISS); заменяется на
  `apollo-angular` без изменения вызывающих сервисов.
- **gRPC** — браузер не умеет «сырой» gRPC (HTTP/2 + protobuf), поэтому Node-сервер
  Angular работает как **BFF**: `браузер → /bff/grpc/rates → (grpc-js) → backend :50051`.
  Это стандартный прод-паттерн, а не обход Envoy. См. `src/bff/grpc-bank.ts`.

Страница `/rates` переключает REST ↔ gRPC в рантайме: один домен, разные транспорты
за общим интерфейсом `RatesGateway` (Dependency Inversion / Liskov).

## Real-time

Поверх бэкенд-шины событий — два браузерных транспорта:

- **SSE** (`RealtimeRatesService`) — нативный `EventSource` на `/sse/rates`, без библиотек.
  Страница `/rates` первично грузится выбранным транспортом (участвует в SSR), а затем
  переключается на живой поток `rate:update`: таблица обновляется каждые ~3с, рост/падение
  подсвечивается, показывается индикатор `LIVE · SSE`.
- **WebSocket** (`RealtimeSocketService`) — общий сокет на `/ws` с авто-переподключением.
  `NotificationsComponent` в layout слушает канал `application:new` и показывает тост,
  когда заявку создают в любой вкладке/сессии — глобальный real-time эффект.

Оба сервиса browser-only (на сервере `EventSource`/`WebSocket` нет): при SSR поток
пустой, подключение происходит после гидрации. Тикер бэкенда включается переменной
`RATE_TICK_MS` (например `RATE_TICK_MS=3000 npm run dev`).

## Архитектура

```
src/app/
  core/                 доменное ядро (не зависит от UI)
    config/             APP_CONFIG (InjectionToken с адресами) — DIP
    models/             доменные модели + русские подписи (единый источник — DRY)
    auth/               AuthService (signals), interceptor, guard, TokenStorage (SSR-safe)
    data/               транспорты: RatesGateway (REST/gRPC), NewsService, ProductsService (GraphQL),
                        ApplicationsService, GraphqlClient, RealtimeRatesService (SSE), RealtimeSocketService (WS)
  features/             страницы (lazy loadComponent — code splitting)
    home/ products/ rates/ news/ auth/ application/
  layout/               header (адаптивная навигация) + footer + notifications (WS-тосты)
  shared/               MoneyPipe, SpinnerComponent, RenderBadgeComponent, toAsyncState()
  app.routes.ts         маршруты (lazy)
  app.routes.server.ts  режимы рендеринга per-route
  app.config.ts         провайдеры (HttpClient+interceptor, роутер, гидрация, gateways)
src/bff/grpc-bank.ts    gRPC-клиент для BFF-слоя Node-сервера
src/server.ts           Express: BFF-роут /bff/grpc/* + Angular SSR
proto/bank.proto        контракт gRPC (копия из бэкенда)
```

Принципы:
- **SOLID** — слои разделены (SRP); UI зависит от абстракций `RatesGateway`/`APP_CONFIG`,
  а не от конкретики (DIP); реализации транспортов взаимозаменяемы (LSP).
- **DRY** — доменные модели, форматирование (`MoneyPipe`), состояние загрузки
  (`toAsyncState`) не дублируются.
- **KISS/YAGNI** — GraphQL без Apollo, ISR через заголовки, без лишней инфраструктуры.

## Заметки по production

- Адреса бэкенда — в `DEFAULT_APP_CONFIG` (`src/app/core/config/app-config.ts`);
  в проде выносятся в environments/переменные окружения.
- Разрешённые хосты SSR (защита от SSRF, Angular 20+) — `NG_ALLOWED_HOSTS`
  (по умолчанию `localhost`), см. `src/server.ts`.
- Адрес gRPC-бэкенда для BFF — `GRPC_TARGET` (по умолчанию `localhost:50051`).
