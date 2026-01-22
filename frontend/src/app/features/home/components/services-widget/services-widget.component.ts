import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Calculator, Scale, Building2, TrendingUp, Shield, ChevronRight } from 'lucide-angular';

interface SubscribedService {
  id: string;
  name: string;
  description: string;
  icon: any;
  status: 'active' | 'pending' | 'expiring';
  engagementCount: number;
}

@Component({
  selector: 'app-services-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './services-widget.component.html',
  styleUrl: './services-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesWidgetComponent {
  readonly icons = {
    fileText: FileText,
    calculator: Calculator,
    scale: Scale,
    building: Building2,
    trending: TrendingUp,
    shield: Shield,
    chevronRight: ChevronRight
  };

  readonly services = signal<SubscribedService[]>([
    {
      id: '1',
      name: 'Tax Compliance',
      description: 'Annual tax filings and compliance monitoring',
      icon: this.icons.calculator,
      status: 'active',
      engagementCount: 5
    },
    {
      id: '2',
      name: 'Legal Advisory',
      description: 'Corporate legal and regulatory advisory',
      icon: this.icons.scale,
      status: 'active',
      engagementCount: 3
    },
    {
      id: '3',
      name: 'Transfer Pricing',
      description: 'Intercompany pricing documentation',
      icon: this.icons.trending,
      status: 'active',
      engagementCount: 4
    },
    {
      id: '4',
      name: 'Risk Assessment',
      description: 'Financial risk analysis and reporting',
      icon: this.icons.shield,
      status: 'pending',
      engagementCount: 2
    },
    {
      id: '5',
      name: 'Real Estate Advisory',
      description: 'Property valuation and transaction support',
      icon: this.icons.building,
      status: 'active',
      engagementCount: 5
    },
    {
      id: '6',
      name: 'Document Management',
      description: 'Secure document storage and workflow',
      icon: this.icons.fileText,
      status: 'expiring',
      engagementCount: 5
    }
  ]);

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Active';
      case 'pending': return 'Pending';
      case 'expiring': return 'Expiring Soon';
      default: return status;
    }
  }
}
