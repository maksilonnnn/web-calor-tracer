import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleComponent } from './toggle.component';

describe('ToggleComponent', () => {
  let fixture: ComponentFixture<ToggleComponent>;
  let component: ToggleComponent;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [ToggleComponent] }).createComponent(
      ToggleComponent,
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function switchEl(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.toggle-switch') as HTMLButtonElement;
  }

  it('checked управляет классом active и aria-checked', () => {
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();

    expect(switchEl().classList.contains('active')).toBeTrue();
    expect(switchEl().getAttribute('aria-checked')).toBe('true');
  });

  it('клик испускает противоположное значение', () => {
    const toggled = jasmine.createSpy('toggled');
    component.toggled.subscribe(toggled);

    switchEl().click();
    expect(toggled).toHaveBeenCalledWith(true);

    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();
    switchEl().click();
    expect(toggled).toHaveBeenCalledWith(false);
  });
});
