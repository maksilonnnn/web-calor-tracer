import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `<app-card class="my-card"><p class="projected">Содержимое</p></app-card>`,
})
class HostComponent {}

describe('CardComponent', () => {
  it('проецирует содержимое и сохраняет классы хоста', () => {
    const fixture = TestBed.configureTestingModule({ imports: [HostComponent] }).createComponent(
      HostComponent,
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.projected')?.textContent).toBe('Содержимое');
    expect(fixture.nativeElement.querySelector('app-card')?.classList.contains('my-card')).toBeTrue();
  });
});
