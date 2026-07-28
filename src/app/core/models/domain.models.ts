/**
 * Доменные модели фронтенда. Зеркалят контракт бэкенда (backend-bank-app/src/types.ts)
 * и являются единым источником правды для всех транспортов (REST/GraphQL/gRPC) — DRY.
 */

export interface CurrencyRate {
  code: string;
  nominal: number;
  buy: number;
  sell: number;
  updatedAt: string;
}

export type ProductCategory = 'deposit' | 'credit' | 'card' | 'mortgage';

export interface Product {
  id: string;
  category: ProductCategory;
  title: string;
  rate: number;
  minAmount: number;
  maxAmount: number;
  termMonths: number;
  featured: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string;
  tags: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type ApplicationStatus = 'new' | 'processing' | 'approved' | 'rejected';

export interface LoanApplication {
  id: string;
  productId: string;
  fullName: string;
  phone: string;
  amount: number;
  termMonths: number;
  createdAt: string;
  status: ApplicationStatus;
}

export interface LoanApplicationInput {
  productId: string;
  fullName: string;
  phone: string;
  amount: number;
  termMonths: number;
}

export interface AuthPayload {
  token: string;
  user: User;
}

/** Русские подписи категорий продуктов — переиспользуются в UI (DRY). */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  deposit: 'Вклады',
  credit: 'Кредиты',
  card: 'Карты',
  mortgage: 'Ипотека',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'Новая',
  processing: 'В обработке',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};
