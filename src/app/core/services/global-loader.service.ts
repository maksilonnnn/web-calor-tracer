/**
 * Глобальный индикатор загрузки (оверлей): счётчик активных длительных
 * операций — навигационные guards (loadMe) и выход из аккаунта. Локальные
 * индикаторы страниц (app-spinner в блоке загрузки) живут отдельно.
 *
 * Правила, чтобы оверлей не «мигал»:
 *  1. показ откладывается на SHOW_DELAY_MS (покажется только если операция
 *     реально длится дольше ~250 мс);
 *  2. после показа оверлей держится минимум MIN_VISIBLE_MS.
 * Операции вкладываются: видимость снимается только после последнего hide.
 */
import { Injectable, computed, signal } from '@angular/core';

/** Задержка показа оверлея: короткие операции оверлей не показывают. */
export const GLOBAL_LOADER_SHOW_DELAY_MS = 250;

/** Минимальное время показа, чтобы оверлей не успел «мигнуть». */
export const GLOBAL_LOADER_MIN_VISIBLE_MS = 400;

@Injectable({ providedIn: 'root' })
export class GlobalLoaderService {
  private readonly activeCount = signal(0);
  private readonly visibleState = signal(false);

  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private minTimer: ReturnType<typeof setTimeout> | null = null;
  private minElapsed = false;
  private hidePending = false;

  /** true, когда оверлей загрузки должен быть виден. */
  readonly visible = computed(() => this.visibleState());

  /** Начало длительной операции. */
  show(): void {
    if (this.activeCount() === 0) {
      if (this.hidePending) {
        // Очередное действие началось до окончания минимального показа.
        this.hidePending = false;
      }

      if (!this.visibleState()) {
        this.scheduleShow();
      }
    }

    this.activeCount.update(value => value + 1);
  }

  /** Завершение длительной операции. */
  hide(): void {
    if (this.activeCount() <= 0) {
      return;
    }

    this.activeCount.update(value => value - 1);
    if (this.activeCount() > 0) {
      return;
    }

    this.cancelShow();
    if (!this.visibleState()) {
      return;
    }

    if (this.minElapsed) {
      this.visibleState.set(false);
      return;
    }

    this.hidePending = true;
  }

  private scheduleShow(): void {
    this.showTimer = setTimeout(() => {
      this.showTimer = null;

      if (this.activeCount() > 0) {
        this.visibleState.set(true);
        this.minElapsed = false;
        this.minTimer = setTimeout(() => {
          this.minTimer = null;
          this.minElapsed = true;
          if (this.hidePending) {
            this.hidePending = false;
            this.visibleState.set(false);
          }
        }, GLOBAL_LOADER_MIN_VISIBLE_MS);
      }
    }, GLOBAL_LOADER_SHOW_DELAY_MS);
  }

  private cancelShow(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }
}