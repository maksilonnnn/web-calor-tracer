import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GlobalLoaderComponent } from '../../shared/components/global-loader/global-loader.component';
import { ToastComponent } from '../../shared/notifications/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, GlobalLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
