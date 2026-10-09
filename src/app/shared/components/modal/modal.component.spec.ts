import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;
  let component: ModalComponent;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [ModalComponent] }).createComponent(
      ModalComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function overlay(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.modal-overlay') as HTMLElement | null;
  }

  it('закрытая модалка ничего не рендерит', () => {
    expect(overlay()).toBeNull();
  });

  it('открытая модалка рендерит заголовок и подзаголовок', () => {
    fixture.componentRef.setInput('title', 'Добавить еду');
    fixture.componentRef.setInput('subtitle', 'Подзаголовок');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    expect(overlay()).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.modal-title')?.textContent).toBe('Добавить еду');
    expect(fixture.nativeElement.querySelector('.modal-subtitle')?.textContent).toBe('Подзаголовок');
  });

  it('крестик и клик по оверлею испускают close', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeSpy = jasmine.createSpy('close');
    component.close.subscribe(closeSpy);

    (fixture.nativeElement.querySelector('.close-btn') as HTMLButtonElement).click();
    expect(closeSpy).toHaveBeenCalledTimes(1);

    const event = new MouseEvent('click', { bubbles: true });
    overlay()?.dispatchEvent(event);
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it('клик по диалогу не закрывает модалку', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    const closeSpy = jasmine.createSpy('close');
    component.close.subscribe(closeSpy);

    (fixture.nativeElement.querySelector('.dialog') as HTMLElement).click();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('закрытие проигрывает анимацию 180 мс и убирает оверлей', fakeAsync(() => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();
    expect(overlay()?.classList.contains('closing')).toBeTrue();

    tick(179);
    fixture.detectChanges();
    expect(overlay()).not.toBeNull();

    tick(1);
    fixture.detectChanges();
    expect(overlay()).toBeNull();
  }));
});
