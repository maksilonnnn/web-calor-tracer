import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import {
  GLOBAL_LOADER_MIN_VISIBLE_MS,
  GLOBAL_LOADER_SHOW_DELAY_MS,
  GlobalLoaderService,
} from '../../../core/services/global-loader.service';
import { GlobalLoaderComponent } from './global-loader.component';

describe('GlobalLoaderComponent', () => {
  let fixture: ComponentFixture<GlobalLoaderComponent>;
  let loader: GlobalLoaderService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    loader = TestBed.inject(GlobalLoaderService);
    fixture = TestBed.createComponent(GlobalLoaderComponent);
    fixture.detectChanges();
  });

  function overlay(): HTMLElement | null {
    return fixture.nativeElement.querySelector(
      '[data-test="global-loader"]',
    ) as HTMLElement | null;
  }

  it('скрыт, пока нет активных операций', () => {
    expect(overlay()).toBeNull();
  });

  it('показывает оверлей со спиннером только после задержки показа', fakeAsync(() => {
    loader.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS - 1);
    fixture.detectChanges();
    expect(overlay()).toBeNull();

    tick(1);
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();
    expect(overlay()?.querySelector('app-spinner')).not.toBeNull();
  }));

  it('прячет оверлей после завершения операции (с минимальным временем показа)', fakeAsync(() => {
    loader.show();
    tick(GLOBAL_LOADER_SHOW_DELAY_MS);
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();

    loader.hide();
    tick(GLOBAL_LOADER_MIN_VISIBLE_MS);
    fixture.detectChanges();
    expect(overlay()).toBeNull();
  }));
});