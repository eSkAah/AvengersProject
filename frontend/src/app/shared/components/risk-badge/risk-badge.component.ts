import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskLevel } from '../../../core';

@Component({
  selector: 'app-risk-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-badge.component.html',
  styleUrl: './risk-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiskBadgeComponent {
  @Input({ required: true }) level!: RiskLevel;
  @Input() showLabel = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() pulse = true;

  readonly config: Record<RiskLevel, { color: string; label: string; tooltip: string }> = {
    high: {
      color: '#EF4444',
      label: 'HIGH',
      tooltip: 'Risque élevé: Action immédiate requise. Documents manquants ou deadline proche.',
    },
    medium: {
      color: '#F59E0B',
      label: 'MEDIUM',
      tooltip: 'Risque modéré: Attention requise. Suivi recommandé.',
    },
    low: {
      color: '#10B981',
      label: 'LOW',
      tooltip: 'Risque faible: Tout est sous contrôle.',
    },
  };

  get currentConfig() {
    return this.config[this.level];
  }

  get shouldPulse(): boolean {
    return this.pulse && this.level === 'high';
  }

  get iconSize(): number {
    const sizes = { sm: 12, md: 16, lg: 20 };
    return sizes[this.size];
  }
}
