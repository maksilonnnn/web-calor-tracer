import { TestBed } from '@angular/core/testing';

import { STORAGE_KEYS } from '../../shared/models';
import { ThemeService } from './theme.service';

function stubMatchMedia(matches: boolean): void {
  spyOn(window, 'matchMedia').and.returnValue({ matches } as MediaQueryList);
}

describe('ThemeService — централизованная система тем', () => {
  afterEach(() => {
    localStorage.clear();
    document.body.classList.remove('dark-theme');
  });

  it('без сохранённого выбора — светлая тема при светлой системной', () => {
    stubMatchMedia(false);
    const service = TestBed.configureTestingModule({}).inject(ThemeService);
    expect(service.theme()).toBe('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });

  it('системная тёмная тема — тёмная по умолчанию', () => {
    stubMatchMedia(true);
    const service = TestBed.configureTestingModule({}).inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
  });

  it('сохранённый выбор перекрывает системную тему', () => {
    stubMatchMedia(true);
    localStorage.setItem(STORAGE_KEYS.theme, 'light');
    const service = TestBed.configureTestingModule({}).inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('мусор в сохранённом значении игнорируется', () => {
    stubMatchMedia(false);
    localStorage.setItem(STORAGE_KEYS.theme, 'blue');
    const service = TestBed.configureTestingModule({}).inject(ThemeService);
    expect(service.theme()).toBe('light');
  });

  it('setTheme сохраняет выбор и переключает класс body', () => {
    stubMatchMedia(false);
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    service.setTheme('dark');
    expect(service.theme()).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
  });

  it('toggle переключает тему туда и обратно', () => {
    stubMatchMedia(false);
    const service = TestBed.configureTestingModule({}).inject(ThemeService);

    service.toggle();
    expect(service.theme()).toBe('dark');
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.body.classList.contains('dark-theme')).toBeFalse();
  });
});
