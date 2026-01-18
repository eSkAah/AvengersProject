import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutShellComponent } from './core';
import { ToastComponent, EveFabComponent, EvePanelComponent } from './shared';
import { routeAnimations } from './core/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutShellComponent, ToastComponent, EveFabComponent, EvePanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [routeAnimations],
})
export class AppComponent {
  title = 'Avengers Project';

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.isActivated
      ? (outlet.activatedRouteData?.['animation'] ?? outlet.activatedRoute?.snapshot?.url)
      : null;
  }
}
