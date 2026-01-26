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
  engagementId: string; // Maps to the entity detail page
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
      { id: 'fr-sci', engagementId: 'ENG-CCP5-FR-001', name: 'CCP 5 Paris Office SPV', countryFlag: '🇫🇷', status: 'in-progress', progress: 67, lastUpdated: '2026-01-20' },
      { id: 'de-gmbh', engagementId: 'ENG-CCP5-DE-001', name: 'CCP 5 Munich Logistics PropCo', countryFlag: '🇩🇪', status: 'reviewing', progress: 85, lastUpdated: '2026-01-22' },
      { id: 'nl-bv', engagementId: 'ENG-CCP5-NL-001', name: 'CCP 5 Amsterdam Retail BV', countryFlag: '🇳🇱', status: 'completed', progress: 100, lastUpdated: '2026-01-21' },
      { id: 'lu-sarl', engagementId: 'ENG-EPISO6-LU-001', name: 'EPISO 6 Luxembourg HoldCo', countryFlag: '🇱🇺', status: 'in-progress', progress: 78, lastUpdated: '2026-01-15' },
      { id: 'es-sl', engagementId: 'ENG-EPISO6-ES-001', name: 'EPISO 6 Madrid Residential SL', countryFlag: '🇪🇸', status: 'not-started', progress: 35, lastUpdated: '2026-01-19' },
    ],
    'vat': [
      { id: 'fr-sci-vat', engagementId: 'ENG-CCP5-FR-001', name: 'CCP 5 Paris Office SPV', countryFlag: '🇫🇷', status: 'completed', progress: 100, lastUpdated: '2026-01-18' },
      { id: 'de-gmbh-vat', engagementId: 'ENG-CCP5-DE-001', name: 'CCP 5 Munich Logistics PropCo', countryFlag: '🇩🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-17' },
      { id: 'nl-bv-vat', engagementId: 'ENG-CCP5-NL-001', name: 'CCP 5 Amsterdam Retail BV', countryFlag: '🇳🇱', status: 'completed', progress: 100, lastUpdated: '2026-01-16' },
      { id: 'be-sa-vat', engagementId: 'ENG-EPISO6-BE-001', name: 'EPISO 6 Brussels Industrial SA', countryFlag: '🇧🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-15' },
      { id: 'es-sl-vat', engagementId: 'ENG-EPISO6-ES-001', name: 'EPISO 6 Madrid Residential SL', countryFlag: '🇪🇸', status: 'in-progress', progress: 70, lastUpdated: '2026-01-22' },
    ],
    'assessment': [
      { id: 'fr-sci-assess', engagementId: 'ENG-CCP5-FR-001', name: 'CCP 5 Paris Office SPV', countryFlag: '🇫🇷', status: 'reviewing', progress: 90, lastUpdated: '2026-01-21' },
      { id: 'de-gmbh-assess', engagementId: 'ENG-CCP5-DE-001', name: 'CCP 5 Munich Logistics PropCo', countryFlag: '🇩🇪', status: 'reviewing', progress: 88, lastUpdated: '2026-01-20' },
      { id: 'nl-bv-assess', engagementId: 'ENG-CCP5-NL-001', name: 'CCP 5 Amsterdam Retail BV', countryFlag: '🇳🇱', status: 'in-progress', progress: 55, lastUpdated: '2026-01-19' },
    ],
    'accounting': [
      { id: 'fr-sci-acc', engagementId: 'ENG-CCP5-FR-001', name: 'CCP 5 Paris Office SPV', countryFlag: '🇫🇷', status: 'completed', progress: 100, lastUpdated: '2026-01-10' },
      { id: 'de-gmbh-acc', engagementId: 'ENG-CCP5-DE-001', name: 'CCP 5 Munich Logistics PropCo', countryFlag: '🇩🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-11' },
      { id: 'nl-bv-acc', engagementId: 'ENG-CCP5-NL-001', name: 'CCP 5 Amsterdam Retail BV', countryFlag: '🇳🇱', status: 'completed', progress: 100, lastUpdated: '2026-01-12' },
      { id: 'be-sa-acc', engagementId: 'ENG-EPISO6-BE-001', name: 'EPISO 6 Brussels Industrial SA', countryFlag: '🇧🇪', status: 'completed', progress: 100, lastUpdated: '2026-01-13' },
    ],
    'transfer-pricing': [
      { id: 'fr-de-tp', engagementId: 'ENG-CCP5-FR-001', name: 'France-Germany TP', countryFlag: '🇫🇷🇩🇪', status: 'reviewing', progress: 80, lastUpdated: '2026-01-22' },
      { id: 'nl-be-tp', engagementId: 'ENG-CCP5-NL-001', name: 'Netherlands-Belgium TP', countryFlag: '🇳🇱🇧🇪', status: 'in-progress', progress: 50, lastUpdated: '2026-01-21' },
      { id: 'lu-fr-tp', engagementId: 'ENG-EPISO6-LU-001', name: 'Luxembourg-France TP', countryFlag: '🇱🇺🇫🇷', status: 'not-started', progress: 0, lastUpdated: '2026-01-18' },
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

  /**
   * Generates yearly progression history (12 months) where:
   * - 'completed' only increases (never decreases)
   * - 'notStarted' only decreases (never increases)
   * - Entities flow: Not Started → In Progress → Reviewing → Completed
   * - End of year: ALL entities are Completed (100% for demo)
   */
  getProgressionHistory(serviceId: string): ProgressionDataPoint[] {
    const entities = this.getEntitiesByService(serviceId);
    const total = entities.length;
    if (total === 0) return [];

    const months: ProgressionDataPoint[] = [];
    const numMonths = 12;
    const currentMonth = new Date().getMonth(); // 0-11

    // Month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Each entity completes at a different month (staggered for realistic progression)
    // All entities must be completed by December (month 11)
    const entityTimelines = entities.map((entity, idx) => {
      // Spread entity completions across months 4-11 (May to Dec)
      // Earlier indexed entities complete earlier
      const completionMonth = Math.min(
        11, // Latest: December
        4 + Math.floor((idx / total) * 7) + (idx % 2) // May (4) to Dec (11)
      );

      // Each entity starts 3-4 months before completion
      const startMonth = Math.max(0, completionMonth - 3 - (idx % 2));

      // Reviewing starts 1-2 months before completion
      const reviewMonth = Math.max(startMonth + 1, completionMonth - 1 - (idx % 2));

      return { startMonth, reviewMonth, completionMonth };
    });

    // Generate each month's state
    for (let monthIdx = 0; monthIdx < numMonths; monthIdx++) {
      let notStarted = 0;
      let inProgress = 0;
      let reviewing = 0;
      let completed = 0;

      // For each entity, calculate its status at this month
      entityTimelines.forEach(timeline => {
        if (monthIdx < timeline.startMonth) {
          notStarted++;
        } else if (monthIdx < timeline.reviewMonth) {
          inProgress++;
        } else if (monthIdx < timeline.completionMonth) {
          reviewing++;
        } else {
          completed++;
        }
      });

      months.push({
        date: monthNames[monthIdx],
        notStarted,
        inProgress,
        reviewing,
        completed
      });
    }

    // Apply monotonic smoothing to ensure no regressions
    this.ensureMonotonicProgression(months);

    // Final month should be 100% completed for demo
    months[numMonths - 1] = {
      date: monthNames[numMonths - 1],
      notStarted: 0,
      inProgress: 0,
      reviewing: 0,
      completed: total
    };

    return months;
  }

  /**
   * Ensures monotonic progression: completed never decreases, notStarted never increases.
   * Adjusts intermediate values to create smooth, realistic progression.
   */
  private ensureMonotonicProgression(weeks: ProgressionDataPoint[]): void {
    const total = weeks[0].notStarted + weeks[0].inProgress + weeks[0].reviewing + weeks[0].completed;

    // Forward pass: ensure completed never decreases
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i].completed < weeks[i - 1].completed) {
        weeks[i].completed = weeks[i - 1].completed;
      }
    }

    // Forward pass: ensure notStarted never increases
    for (let i = 1; i < weeks.length; i++) {
      if (weeks[i].notStarted > weeks[i - 1].notStarted) {
        weeks[i].notStarted = weeks[i - 1].notStarted;
      }
    }

    // Rebalance inProgress and reviewing to maintain total
    for (let i = 0; i < weeks.length; i++) {
      const currentTotal = weeks[i].notStarted + weeks[i].inProgress + weeks[i].reviewing + weeks[i].completed;
      const diff = total - currentTotal;

      if (diff !== 0) {
        // Distribute difference to inProgress and reviewing
        // Prefer inProgress for positive diff, reviewing for balancing
        if (diff > 0) {
          weeks[i].inProgress += Math.ceil(diff / 2);
          weeks[i].reviewing += Math.floor(diff / 2);
        } else {
          // Need to reduce - take from inProgress first, then reviewing
          const reduction = Math.abs(diff);
          const fromInProgress = Math.min(weeks[i].inProgress, reduction);
          weeks[i].inProgress -= fromInProgress;
          weeks[i].reviewing -= (reduction - fromInProgress);
        }
      }

      // Ensure no negative values
      weeks[i].notStarted = Math.max(0, weeks[i].notStarted);
      weeks[i].inProgress = Math.max(0, weeks[i].inProgress);
      weeks[i].reviewing = Math.max(0, weeks[i].reviewing);
      weeks[i].completed = Math.max(0, weeks[i].completed);
    }
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
