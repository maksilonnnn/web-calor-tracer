import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;
  let component: ProgressBarComponent;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).createComponent(
      ProgressBarComponent,
    );
    component = fixture.componentInstance;
  });

  function percentText(): string {
    return fixture.nativeElement.querySelector('.progress-value')?.textContent?.trim() ?? '';
  }

  function fillWidth(): string {
    return (fixture.nativeElement.querySelector('.progress-fill') as HTMLElement).style.width;
  }

  it('считает и показывает процент, ширина заливки совпадает', () => {
    fixture.componentRef.setInput('value', 50);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();

    expect(percentText()).toBe('50%');
    expect(fillWidth()).toBe('50%');
  });

  it('округляет и ограничивает сверху 100%', () => {
    fixture.componentRef.setInput('value', 175);
    fixture.componentRef.setInput('max', 100);
    fixture.detectChanges();

    expect(percentText()).toBe('100%');
  });

  it('max=0 даёт 0%', () => {
    fixture.componentRef.setInput('value', 30);
    fixture.componentRef.setInput('max', 0);
    fixture.detectChanges();

    expect(percentText()).toBe('0%');
  });

  it('label рендерится, showPercentage=false скрывает процент', () => {
    fixture.componentRef.setInput('label', 'Белки');
    fixture.componentRef.setInput('value', 10);
    fixture.componentRef.setInput('max', 100);
    fixture.componentRef.setInput('showPercentage', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.progress-label')?.textContent).toBe('Белки');
    expect(fixture.nativeElement.querySelector('.progress-value')).toBeNull();
  });
});
