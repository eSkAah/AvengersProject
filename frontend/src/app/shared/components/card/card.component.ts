import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() hoverable = false;
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() clickable = false;

  get cardClasses(): string {
    return [
      'card',
      `card--padding-${this.padding}`,
      this.hoverable ? 'card--hoverable' : '',
      this.clickable ? 'card--clickable' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
