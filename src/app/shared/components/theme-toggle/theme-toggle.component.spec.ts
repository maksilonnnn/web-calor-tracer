import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { ThemeService, Theme } from '../../../core/services/theme.service';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let theme: ReturnType<typeof signal<Theme>>;
  let setTheme: jasmine.Spy;

  beforeEach(() => {
    theme = signal<Theme>('light');
    setTheme = jasmine.createSpy('setTheme').and.callFake((value: Theme) => theme.set(value));
    const fakeService = { theme: theme.asReadonly(), setTheme, toggle: () => undefined };

    fixture = TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [{ provide: ThemeService, useValue: fakeService }],
    }).createComponent(ThemeToggleComponent);
    fixture.detectChanges();
  });

  function options(): HTMLButtonElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.theme-option'));
  }

  it('рендерит светлую и тёмную опции, активна текущая', () => {
    expect(options().length).toBe(2);
    expect(options()[0].classList.contains('active')).toBeTrue();
    expect(options()[1].classList.contains('active')).toBeFalse();
  });

  it('клик по тёмной опции вызывает setTheme(dark)', () => {
    options()[1].click();
    expect(setTheme).toHaveBeenCalledWith('dark');

    fixture.detectChanges();
    expect(options()[1].classList.contains('active')).toBeTrue();
  });
});
