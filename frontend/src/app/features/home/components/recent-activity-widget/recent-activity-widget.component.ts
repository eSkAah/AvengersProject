import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  LucideIconData,
  FileUp,
  FileCheck,
  MessageSquare,
  AlertCircle,
  Clock,
} from 'lucide-angular';

interface Activity {
  id: string;
  type: 'upload' | 'approval' | 'comment' | 'alert';
  title: string;
  entity: string;
  time: string;
  icon: LucideIconData;
}

@Component({
  selector: 'app-recent-activity-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './recent-activity-widget.component.html',
  styleUrl: './recent-activity-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityWidgetComponent {
  readonly icons = {
    fileUp: FileUp,
    fileCheck: FileCheck,
    message: MessageSquare,
    alert: AlertCircle,
    clock: Clock,
  };

  readonly activities: Activity[] = [
    {
      id: '1',
      type: 'upload',
      title: 'Bank Statement uploaded',
      entity: 'CCP 5 Paris Office SPV',
      time: '2 min ago',
      icon: this.icons.fileUp,
    },
    {
      id: '2',
      type: 'approval',
      title: 'General Ledger approved',
      entity: 'CCP 5 Munich PropCo',
      time: '15 min ago',
      icon: this.icons.fileCheck,
    },
    {
      id: '3',
      type: 'comment',
      title: 'New comment on Tax Return',
      entity: 'EPISO 6 Madrid SL',
      time: '1 hour ago',
      icon: this.icons.message,
    },
    {
      id: '4',
      type: 'alert',
      title: 'Document deadline approaching',
      entity: 'EPISO 6 Brussels SA',
      time: '2 hours ago',
      icon: this.icons.alert,
    },
    {
      id: '5',
      type: 'upload',
      title: 'Trial Balance uploaded',
      entity: 'EPISO 6 Milan Srl',
      time: '3 hours ago',
      icon: this.icons.fileUp,
    },
    {
      id: '6',
      type: 'approval',
      title: 'VAT Return approved',
      entity: 'Luxembourg HoldCo',
      time: '5 hours ago',
      icon: this.icons.fileCheck,
    },
  ];

  getTypeClass(type: Activity['type']): string {
    return `activity-item--${type}`;
  }
}
