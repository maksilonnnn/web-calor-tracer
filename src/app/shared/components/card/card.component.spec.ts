import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  templateUrl: './card-host.component.html',
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
