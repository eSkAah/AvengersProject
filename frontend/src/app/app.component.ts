import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutShellComponent } from './core';
import { ToastComponent } from './shared';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutShellComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'Star-Eyes';
}
