import { Injectable } from '@angular/core';
import { Briefcase, FileText, Scale, Calculator, Building2 } from 'lucide-angular';

export type EntityStatus = 'not-started' | 'in-progress' | 'reviewing' | 'completed';

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconBgColor: string;
}

export interface ServiceEntity {
  id: string;
  name: string;
  countryFlag: string;
  status: EntityStatus;
  progress: number;
  lastUpdated: string;
}

export interface ProgressionDataPoint {
  date: string;
  notStarted: number;
  inProgress: number;
  reviewing: number;
  completed: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceEntityService {
  private readonly services: Service[] = [
    {
      id: 'cit',
      name: 'Corporate Tax Return',
      description: 'CIT compliance and filing',
      icon: Briefcase,
      iconBgColor: 'bg-blue'
    },
    {
      id: 'vat',
      name: 'VAT Return',
      description: 'Indirect tax compliance',
      icon: FileText,
      iconBgColor: 'bg-green'
    },
    {
      id: 'assessment',
      name: 'Tax Assessment',
      description: 'Tax provision & analysis',
      icon: Scale,
      iconBgColor: 'bg-purple'
    },
    {
      id: 'accounting',
      name: 'Accounting',
      description: 'Financial statements & reporting',
      icon: Calculator,
      iconBgColor: 'bg-orange'
    },
    {
      id: 'transfer-pricing',
      name: 'Transfer Pricing',
      description: 'Intercompany transactions',
      icon: Building2,
      iconBgColor: 'bg-teal'
    }
  ];

  private readonly entitiesByService: Record<string, ServiceEntity[]> = {
    'cit': [
      { id: 'fr-sci', name: 'France SCI', countryFlag: '🇫🇷', status: 'completed', progress: 100, lastUpdated: '2026-01-20' },
      { id: 'de-gmbh', name: 'Germany GmbH', countryFlag: '🇩🇪', status: 'reviewing', progress: 85, lastUpdated: '2026-01-22' },
      { id: 'nl-bv', name: 'Netherlands BV', countryFlag: '🇳🇱', status: 'in-progress', progress: 60, lastUpdated: '2026-01-21' },
      { id: 'be-sa', name: 'Belgium SA', countryFlag: '🇧🇪', status: 'in-progress', progress: 45, lastUpdated: '2026-01-19' },
      { id: 'lu-sarl', name: 'Luxembourg SARL', countryFlag: '🇱🇺', status: 'not-started', progress: 0, lastUpdated: '2026-01-15' },
    ],
    'vat': [
      { id: 'fr-sci-vat', name: 'France SCI', countryFlag: '🇫🇷', status: 'completed', progress: 100, lastUpdated: '2026-01-18' },
      { id: 'de-gmbh-vat', name: 'Germany GmbH', countryFlag: '🇩🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-17' },
      { id: 'nl-bv-vat', name: 'Netherlands BV', countryFlag: '🇳🇱', status: 'completed', progress: 100, lastUpdated: '2026-01-16' },
      { id: 'be-sa-vat', name: 'Belgium SA', countryFlag: '🇧🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-15' },
      { id: 'es-sl-vat', name: 'Spain SL', countryFlag: '🇪🇸', status: 'in-progress', progress: 70, lastUpdated: '2026-01-22' },
    ],
    'assessment': [
      { id: 'fr-sci-assess', name: 'France SCI', countryFlag: '🇫🇷', status: 'reviewing', progress: 90, lastUpdated: '2026-01-21' },
      { id: 'de-gmbh-assess', name: 'Germany GmbH', countryFlag: '🇩🇪', status: 'reviewing', progress: 88, lastUpdated: '2026-01-20' },
      { id: 'nl-bv-assess', name: 'Netherlands BV', countryFlag: '🇳🇱', status: 'in-progress', progress: 55, lastUpdated: '2026-01-19' },
    ],
    'accounting': [
      { id: 'fr-sci-acc', name: 'France SCI', countryFlag: '🇫🇷', status: 'completed', progress: 100, lastUpdated: '2026-01-10' },
      { id: 'de-gmbh-acc', name: 'Germany GmbH', countryFlag: '🇩🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-11' },
      { id: 'nl-bv-acc', name: 'Netherlands BV', countryFlag: '🇳🇱', status: 'completed', progress: 100, lastUpdated: '2026-01-12' },
      { id: 'be-sa-acc', name: 'Belgium SA', countryFlag: '🇧🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-13' },
    ],
    'transfer-pricing': [
      { id: 'fr-de-tp', name: 'France-Germany', countryFlag: '🇫🇷🇩🇪', status: 'reviewing', progress: 80, lastUpdated: '2026-01-22' },
      { id: 'nl-be-tp', name: 'Netherlands-Belgium', countryFlag: '🇳🇱🇧🇪', status: 'in-progress', progress: 50, lastUpdated: '2026-01-21' },
      { id: 'lu-fr-tp', name: 'Luxembourg-France', countryFlag: '🇱🇺🇫🇷', status: 'not-started', progress: 0, lastUpdated: '2026-01-18' },
    ]
  };

  getServices(): Service[] {
    return this.services;
  }

  getServiceById(id: string): Service | undefined {
    return this.services.find(s => s.id === id);
  }

  getEntitiesByService(serviceId: string): ServiceEntity[] {
    return this.entitiesByService[serviceId] ?? [];
  }

  getProgressionHistory(serviceId: string): ProgressionDataPoint[] {
    const entities = this.getEntitiesByService(serviceId);
    const total = entities.length;

    // Generate 12 weeks of mock progression data
    const weeks: ProgressionDataPoint[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      const weekLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Simulate progression over time (more completed as we get closer to today)
      const progressFactor = (12 - i) / 12;
      const completed = Math.floor(total * progressFactor * 0.4);
      const reviewing = Math.floor(total * progressFactor * 0.2);
      const inProgress = Math.floor(total * progressFactor * 0.3);
      const notStarted = total - completed - reviewing - inProgress;

      weeks.push({
        date: weekLabel,
        notStarted: Math.max(0, notStarted),
        inProgress: Math.max(0, inProgress),
        reviewing: Math.max(0, reviewing),
        completed: Math.max(0, completed)
      });
    }

    // Make the last point match actual current state
    const currentState = this.getStatusCounts(serviceId);
    weeks[weeks.length - 1] = {
      date: weeks[weeks.length - 1].date,
      ...currentState
    };

    return weeks;
  }

  private getStatusCounts(serviceId: string): { notStarted: number; inProgress: number; reviewing: number; completed: number } {
    const entities = this.getEntitiesByService(serviceId);
    return {
      notStarted: entities.filter(e => e.status === 'not-started').length,
      inProgress: entities.filter(e => e.status === 'in-progress').length,
      reviewing: entities.filter(e => e.status === 'reviewing').length,
      completed: entities.filter(e => e.status === 'completed').length
    };
  }
}
