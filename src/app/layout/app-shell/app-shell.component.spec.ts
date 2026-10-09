import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent — авторизованная оболочка', () => {
  beforeEach(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
  });

  it('рендерит сайдбар и область контента с router-outlet', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])],
    }).createComponent(AppShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-container')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-sidebar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.main-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.main-container')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
