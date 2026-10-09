/**
 * Хелпер submitting: обёртка выполнения действия с флагом загрузки и
 * защитой от повторной отправки (двойной клик по «Сохранить» — один запрос).
 *
 * Использование в компоненте:
 *   private readonly saveState = submitting();
 *   await this.saveState.run(async () => { … });
 *
 * В шаблоне флаг подключается и к индикатору, и к блокировке кнопки.
 */
import { Signal, signal } from '@angular/core';

/** Контроллер выполнения действия с индикацией загрузки. */
export interface SubmittingController {
  /** true, пока действие выполняется: индикатор загрузки + disabled. */
  readonly busy: Signal<boolean>;

  /**
   * Выполняет действие не параллельно самому себе: вызовы в состоянии
   * busy игнорируются. Ошибка действия пробрасывается вызывающему коду.
   */
  run(action: () => Promise<void>): Promise<void>;
}

export function submitting(): SubmittingController {
  const busy = signal(false);
  return {
    busy: busy.asReadonly(),
    run: async (action: () => Promise<void>): Promise<void> => {
      if (busy()) {
        return;
      }
      busy.set(true);
      try {
        await action();
      } finally {
        busy.set(false);
      }
    },
  };
}
