import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './button-host.component.html',
})
class HostComponent {}

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [ButtonComponent] }).createComponent(
      ButtonComponent,
    );
    fixture.detectChanges();
  });

  function button(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  }

  it('по умолчанию: type=button, классы btn primary md', () => {
    expect(button().type).toBe('button');
    expect(button().classList.contains('btn')).toBeTrue();
    expect(button().classList.contains('primary')).toBeTrue();
    expect(button().classList.contains('md')).toBeTrue();
  });

  it('variant, size и type пробрасываются во внутреннюю кнопку', () => {
    fixture.componentRef.setInput('variant', 'secondary');
    fixture.componentRef.setInput('size', 'sm');
    fixture.componentRef.setInput('type', 'submit');
    fixture.detectChanges();

    expect(button().classList.contains('secondary')).toBeTrue();
    expect(button().classList.contains('sm')).toBeTrue();
    expect(button().type).toBe('submit');
  });

  it('fullWidth добавляет класс, disabled блокирует кнопку', () => {
    fixture.componentRef.setInput('fullWidth', true);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(button().classList.contains('full-width')).toBeTrue();
    expect(button().disabled).toBeTrue();
  });

  it('проецирует содержимое и пробрасывает атрибуты хоста', () => {
    TestBed.resetTestingModule();
    const hostFixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent,
    );
    hostFixture.detectChanges();

    const inner = hostFixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(inner.textContent?.trim()).toBe('Текст');
    expect(inner.type).toBe('submit');
    expect(inner.classList.contains('danger')).toBeTrue();
    expect(inner.classList.contains('full-width')).toBeTrue();
    expect(inner.disabled).toBeTrue();
  });

  it('loading=false: спиннер отсутствует, aria-busy не задан', () => {
    expect(button().querySelector('app-spinner')).toBeNull();
    expect(button().getAttribute('aria-busy')).toBeNull();
    expect(button().disabled).toBeFalse();
  });

  it('loading=true: спиннер перед текстом, aria-busy=true, кнопка заблокирована', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(button().querySelector('app-spinner')).not.toBeNull();
    expect(button().getAttribute('aria-busy')).toBe('true');
    expect(button().disabled).toBeTrue();
  });

  it('loading=true блокирует клики (кнопка disabled)', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    // Клик по disabled-кнопке браузером не инициируется.
    expect(button().disabled).toBeTrue();
  });
});
