import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './layout-shell.component.html',
  styleUrl: './layout-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutShellComponent {}
