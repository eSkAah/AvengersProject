import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Briefcase, FileText, Scale, Calculator, Building2 } from 'lucide-angular';

interface StatusCount {
  notStarted: number;
  inProgress: number;
  reviewing: number;
  completed: number;
}

interface ClientService {
  id: string;
  name: string;
  description: string;
  status: StatusCount;
  icon: any;
  iconBgColor: string;
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
    briefcase: Briefcase,
    fileText: FileText,
    scale: Scale,
    calculator: Calculator,
    building: Building2
  };

  readonly services: ClientService[] = [
    {
      id: 'cit',
      name: 'Corporate Tax Return',
      description: 'CIT compliance and filing',
      status: { notStarted: 1, inProgress: 2, reviewing: 1, completed: 1 },
      icon: this.icons.briefcase,
      iconBgColor: 'bg-blue'
    },
    {
      id: 'vat',
      name: 'VAT Return',
      description: 'Indirect tax compliance',
      status: { notStarted: 0, inProgress: 1, reviewing: 0, completed: 4 },
      icon: this.icons.fileText,
      iconBgColor: 'bg-green'
    },
    {
      id: 'assessment',
      name: 'Tax Assessment',
      description: 'Tax provision & analysis',
      status: { notStarted: 0, inProgress: 1, reviewing: 2, completed: 0 },
      icon: this.icons.scale,
      iconBgColor: 'bg-purple'
    },
    {
      id: 'accounting',
      name: 'Accounting',
      description: 'Financial statements & reporting',
      status: { notStarted: 0, inProgress: 0, reviewing: 0, completed: 4 },
      icon: this.icons.calculator,
      iconBgColor: 'bg-orange'
    },
    {
      id: 'transfer-pricing',
      name: 'Transfer Pricing',
      description: 'Intercompany transactions',
      status: { notStarted: 1, inProgress: 1, reviewing: 1, completed: 0 },
      icon: this.icons.building,
      iconBgColor: 'bg-teal'
    }
  ];

  getTotalEntities(service: ClientService): number {
    const s = service.status;
    return s.notStarted + s.inProgress + s.reviewing + s.completed;
  }
}
