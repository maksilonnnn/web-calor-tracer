import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppComponent } from './app.component';

describe('AppComponent — корневой каркас', () => {
  it('рендерит хост уведомлений и router-outlet', () => {
    const fixture = TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).createComponent(AppComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-toast')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
