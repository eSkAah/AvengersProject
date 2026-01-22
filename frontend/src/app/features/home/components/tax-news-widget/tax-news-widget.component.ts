import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Newspaper, ExternalLink, Calendar, TrendingUp } from 'lucide-angular';

interface TaxNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceLogo: string;
  date: Date;
  url: string;
  category: 'regulation' | 'insight' | 'update' | 'alert';
  imageUrl: string;
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
    externalLink: ExternalLink,
    calendar: Calendar,
    trendingUp: TrendingUp
  };

  readonly news: TaxNews[] = [
    {
      id: '1',
      title: 'EU Pillar Two: Implementation guidance for multinational enterprises',
      summary: 'New guidance on the global minimum tax rules affecting groups with revenues exceeding EUR 750 million.',
      source: 'EY',
      sourceLogo: 'EY',
      date: new Date('2026-01-20'),
      url: 'https://www.ey.com/tax',
      category: 'regulation',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop'
    },
    {
      id: '2',
      title: 'Transfer pricing documentation: 2026 compliance deadlines',
      summary: 'Key dates and requirements for Country-by-Country reporting and Master File submissions.',
      source: 'PwC',
      sourceLogo: 'PwC',
      date: new Date('2026-01-18'),
      url: 'https://www.pwc.com/tax',
      category: 'update',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=250&fit=crop'
    },
    {
      id: '3',
      title: 'DAC7 reporting obligations: What platforms need to know',
      summary: 'Digital platform operators must report seller information under new EU directive.',
      source: 'Deloitte',
      sourceLogo: 'Deloitte',
      date: new Date('2026-01-15'),
      url: 'https://www.deloitte.com/tax',
      category: 'alert',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop'
    },
    {
      id: '4',
      title: 'Carbon border adjustment mechanism: Tax implications',
      summary: 'CBAM transitional phase requirements and impact on import duties and VAT.',
      source: 'KPMG',
      sourceLogo: 'KPMG',
      date: new Date('2026-01-12'),
      url: 'https://www.kpmg.com/tax',
      category: 'insight',
      imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=400&h=250&fit=crop'
    }
  ];

  getCategoryClass(category: TaxNews['category']): string {
    const classes: Record<TaxNews['category'], string> = {
      regulation: 'news-card__category--regulation',
      insight: 'news-card__category--insight',
      update: 'news-card__category--update',
      alert: 'news-card__category--alert'
    };
    return classes[category];
  }

  getCategoryLabel(category: TaxNews['category']): string {
    const labels: Record<TaxNews['category'], string> = {
      regulation: 'Regulation',
      insight: 'Insight',
      update: 'Update',
      alert: 'Alert'
    };
    return labels[category];
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onNewsClick(item: TaxNews): void {
    window.open(item.url, '_blank', 'noopener,noreferrer');
  }
}
