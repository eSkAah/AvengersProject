import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
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

  private router = inject(Router);

  // Track current URL to determine if layout should be shown
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  // Show layout only when NOT on landing page
  showLayout = computed(() => {
    const url = this.currentUrl();
    return url !== '/' && url !== '';
  });

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.isActivated
      ? (outlet.activatedRouteData?.['animation'] ?? outlet.activatedRoute?.snapshot?.url)
      : null;
  }
}
