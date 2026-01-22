import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Newspaper, Calendar, ExternalLink, Tag, ChevronRight } from 'lucide-angular';

interface TaxNews {
  id: string;
  title: string;
  summary: string;
  date: Date;
  category: 'regulation' | 'policy' | 'market' | 'insight';
  source: string;
  countries: string[];
}

@Component({
  selector: 'app-tax-news-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tax-news-widget.component.html',
  styleUrl: './tax-news-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaxNewsWidgetComponent {
  readonly icons = {
    newspaper: Newspaper,
    calendar: Calendar,
    externalLink: ExternalLink,
    tag: Tag,
    chevronRight: ChevronRight
  };

  readonly news = signal<TaxNews[]>([
    {
      id: '1',
      title: 'EU Pillar Two Implementation Update',
      summary: 'New guidance on Global Minimum Tax rules affecting multinational entities with consolidated revenues above €750M.',
      date: new Date('2026-01-20'),
      category: 'regulation',
      source: 'European Commission',
      countries: ['🇪🇺', '🇫🇷', '🇩🇪', '🇳🇱']
    },
    {
      id: '2',
      title: 'French Real Estate Tax Reform 2026',
      summary: 'Changes to property taxation for commercial real estate funds and SPVs effective Q2 2026.',
      date: new Date('2026-01-18'),
      category: 'policy',
      source: 'Ministry of Finance',
      countries: ['🇫🇷']
    },
    {
      id: '3',
      title: 'Transfer Pricing Documentation Requirements',
      summary: 'Updated benchmarking requirements for intercompany transactions in the Benelux region.',
      date: new Date('2026-01-15'),
      category: 'regulation',
      source: 'OECD',
      countries: ['🇧🇪', '🇳🇱', '🇱🇺']
    },
    {
      id: '4',
      title: 'Real Estate Market Outlook Q1 2026',
      summary: 'Analysis of European commercial real estate trends and investment opportunities.',
      date: new Date('2026-01-12'),
      category: 'insight',
      source: 'EY Research',
      countries: ['🇪🇺']
    }
  ]);

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'regulation': return 'Regulation';
      case 'policy': return 'Policy';
      case 'market': return 'Market';
      case 'insight': return 'Insight';
      default: return category;
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
