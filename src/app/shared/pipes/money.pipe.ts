import { Pipe, PipeTransform } from '@angular/core';

/**
 * Форматирует сумму в рублях по локали ru-RU. Вынесено в pipe, чтобы не дублировать
 * форматирование по шаблонам (DRY). Intl.NumberFormat — кроссбраузерно.
 */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  private static readonly fmt = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });

  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return MoneyPipe.fmt.format(value);
  }
}
