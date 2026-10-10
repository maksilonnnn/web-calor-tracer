import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  function create(size?: 'sm' | 'md' | 'lg', label?: string): void {
    fixture = TestBed.createComponent(SpinnerComponent);
    if (size) {
      fixture.componentRef.setInput('size', size);
    }
    if (label) {
      fixture.componentRef.setInput('label', label);
    }
    fixture.detectChanges();
  }

  function ring(): HTMLElement {
    return fixture.nativeElement.querySelector('.spinner') as HTMLElement;
  }

  it('рендерит кольцо с role=status и aria-live=polite', () => {
    create();
    const element = ring();
    expect(element).not.toBeNull();
    expect(element.getAttribute('role')).toBe('status');
    expect(element.getAttribute('aria-live')).toBe('polite');
  });

  it('размер по умолчанию — md', () => {
    create();
    expect(ring().classList.contains('md')).toBeTrue();
  });

  it('поддерживает размеры sm, md, lg', () => {
    create('sm');
    expect(ring().classList.contains('sm')).toBeTrue();

    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    expect(ring().classList.contains('lg')).toBeTrue();
    expect(ring().classList.contains('sm')).toBeFalse();
  });

  it('по умолчанию label «Загрузка» в aria-label и скрытом тексте', () => {
    create();
    expect(ring().getAttribute('aria-label')).toBe('Загрузка');
    const hidden = ring().querySelector('.sr-only') as HTMLElement;
    expect(hidden?.textContent?.trim()).toBe('Загрузка');
  });

  it('позволяет задать свой label', () => {
    create('md', 'Сохранение…');
    expect(ring().getAttribute('aria-label')).toBe('Сохранение…');
    const hidden = ring().querySelector('.sr-only') as HTMLElement;
    expect(hidden?.textContent?.trim()).toBe('Сохранение…');
  });
});