import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputComponent } from './input.component';

describe('InputComponent — ControlValueAccessor', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [InputComponent] }).createComponent(
      InputComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  it('пишет значение контрола (writeValue) и пустую строку для null', () => {
    component.writeValue('привет');
    fixture.detectChanges();
    expect(input().value).toBe('привет');

    component.writeValue(null);
    fixture.detectChanges();
    expect(input().value).toBe('');
  });

  it('ввод вызывает onChange с текстом поля', () => {
    const onChange = jasmine.createSpy('onChange');
    component.registerOnChange(onChange);

    input().value = 'текст';
    input().dispatchEvent(new Event('input'));

    expect(onChange).toHaveBeenCalledWith('текст');
  });

  it('blur вызывает onTouched', () => {
    const onTouched = jasmine.createSpy('onTouched');
    component.registerOnTouched(onTouched);

    input().dispatchEvent(new Event('blur'));

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('setDisabledState и input disabled блокируют поле', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();

    component.setDisabledState(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(input().disabled).toBeTrue();
  });

  it('рендерит label, placeholder, тип, единицу и текст ошибки', () => {
    fixture.componentRef.setInput('label', 'Email');
    fixture.componentRef.setInput('type', 'email');
    fixture.componentRef.setInput('placeholder', 'example@mail.com');
    fixture.componentRef.setInput('unit', 'г');
    fixture.componentRef.setInput('error', 'Заполните поле');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.input-label')?.textContent).toBe('Email');
    expect(input().type).toBe('email');
    expect(input().placeholder).toBe('example@mail.com');
    expect(fixture.nativeElement.querySelector('.field-unit')?.textContent).toBe('г');
    expect(fixture.nativeElement.querySelector('.input-error')?.textContent).toBe('Заполните поле');
    expect(input().classList.contains('has-error')).toBeTrue();
  });
});
