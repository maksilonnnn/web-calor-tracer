import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import {
  GLOBAL_LOADER_MIN_VISIBLE_MS,
  GLOBAL_LOADER_SHOW_DELAY_MS,
  GlobalLoaderService,
} from './global-loader.service';

describe('GlobalLoaderService', () => {
  let service: GlobalLoaderService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = TestBed.inject(GlobalLoaderService);
  });

  it('изначально невидим', () => {
    expect(service.visible()).toBeFalse();
  });

  it('показывается только после задержки показа', fakeAsync(() => {
    service.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS - 1);
    expect(service.visible()).toBeFalse();

    tick(1);
    expect(service.visible()).toBeTrue();
  }));

  it('короткая операция (< задержки) не показывает оверлей и не мигает', fakeAsync(() => {
    service.show();
    tick(100);
    service.hide();

    expect(service.visible()).toBeFalse();
    tick(2000);
    expect(service.visible()).toBeFalse();
  }));

  it('держится минимум MIN_VISIBLE_MS после показа', fakeAsync(() => {
    service.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS);
    expect(service.visible()).toBeTrue();

    service.hide();
    tick(GLOBAL_LOADER_MIN_VISIBLE_MS - 1);
    expect(service.visible()).toBeTrue();

    tick(1);
    expect(service.visible()).toBeFalse();
  }));

  it('вложенные show/hide: скрывается только после последнего hide', fakeAsync(() => {
    service.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS);
    expect(service.visible()).toBeTrue();

    service.show();
    service.hide();
    expect(service.visible()).toBeTrue();

    service.hide();
    tick(GLOBAL_LOADER_MIN_VISIBLE_MS);
    expect(service.visible()).toBeFalse();
  }));

  it('hide во время минимального показа не прячет оверлей сразу', fakeAsync(() => {
    service.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS);
    expect(service.visible()).toBeTrue();

    service.hide();
    tick(100);
    expect(service.visible()).toBeTrue();

    // Минимальный показ отсчитывается от момента появления оверлея.
    tick(GLOBAL_LOADER_MIN_VISIBLE_MS - 100);
    expect(service.visible()).toBeFalse();
  }));
});