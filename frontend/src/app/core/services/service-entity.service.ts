import { Injectable } from '@angular/core';
import { Briefcase, FileText, Scale, Building2, LucideIconData } from 'lucide-angular';

export type EntityStatus = 'not-started' | 'in-progress' | 'reviewing' | 'completed';

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: LucideIconData;
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
  // Multi-country filter fields
  year?: number;
  jurisdiction?: string;
  entity?: string;
  subfund?: string;
}

export interface ProgressionDataPoint {
  date: string;
  notStarted: number;
  inProgress: number;
  reviewing: number;
  completed: number;
}

@Injectable({
  providedIn: 'root',
})
export class ServiceEntityService {
  private readonly services: Service[] = [
    {
      id: 'cit',
      name: 'Corporate Tax Return',
      description: 'CIT compliance and filing',
      icon: Briefcase,
      iconBgColor: 'bg-blue',
    },
    {
      id: 'vat',
      name: 'VAT Return',
      description: 'Indirect tax compliance',
      icon: FileText,
      iconBgColor: 'bg-green',
    },
    {
      id: 'assessment',
      name: 'Tax Assessment',
      description: 'Tax provision & analysis',
      icon: Scale,
      iconBgColor: 'bg-purple',
    },
    {
      id: 'transfer-pricing',
      name: 'Transfer Pricing',
      description: 'Intercompany transactions',
      icon: Building2,
      iconBgColor: 'bg-teal',
    },
  ];

  private readonly entitiesByService: Record<string, ServiceEntity[]> = {
    cit: [
      {
        id: 'fr-sci',
        engagementId: 'ENG-CCP5-FR-001',
        name: 'CCP 5 Paris Office SPV',
        countryFlag: '🇫🇷',
        status: 'in-progress',
        progress: 67,
        lastUpdated: '2026-01-20',
        year: 2025,
        jurisdiction: 'France',
        entity: 'CCP 5 Paris Office SPV',
        subfund: 'CCP 5',
      },
      {
        id: 'de-gmbh',
        engagementId: 'ENG-CCP5-DE-001',
        name: 'CCP 5 Munich Logistics PropCo',
        countryFlag: '🇩🇪',
        status: 'reviewing',
        progress: 85,
        lastUpdated: '2026-01-22',
        year: 2025,
        jurisdiction: 'Germany',
        entity: 'CCP 5 Munich Logistics PropCo',
        subfund: 'CCP 5',
      },
      {
        id: 'nl-bv',
        engagementId: 'ENG-CCP5-NL-001',
        name: 'CCP 5 Amsterdam Retail BV',
        countryFlag: '🇳🇱',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-21',
        year: 2025,
        jurisdiction: 'Netherlands',
        entity: 'CCP 5 Amsterdam Retail BV',
        subfund: 'CCP 5',
      },
      {
        id: 'lu-sarl',
        engagementId: 'ENG-EPISO6-LU-001',
        name: 'EPISO 6 Luxembourg HoldCo',
        countryFlag: '🇱🇺',
        status: 'in-progress',
        progress: 78,
        lastUpdated: '2026-01-15',
        year: 2024,
        jurisdiction: 'Luxembourg',
        entity: 'EPISO 6 Luxembourg HoldCo',
        subfund: 'EPISO 6',
      },
      {
        id: 'es-sl',
        engagementId: 'ENG-EPISO6-ES-001',
        name: 'EPISO 6 Madrid Residential SL',
        countryFlag: '🇪🇸',
        status: 'not-started',
        progress: 35,
        lastUpdated: '2026-01-19',
        year: 2024,
        jurisdiction: 'Spain',
        entity: 'EPISO 6 Madrid Residential SL',
        subfund: 'EPISO 6',
      },
      {
        id: 'fr-sci-2024',
        engagementId: 'ENG-CCP5-FR-002',
        name: 'CCP 5 Lyon Industrial SPV',
        countryFlag: '🇫🇷',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-10',
        year: 2024,
        jurisdiction: 'France',
        entity: 'CCP 5 Lyon Industrial SPV',
        subfund: 'CCP 5',
      },
      {
        id: 'it-srl',
        engagementId: 'ENG-EPISO6-IT-001',
        name: 'EPISO 6 Milan Commercial SRL',
        countryFlag: '🇮🇹',
        status: 'in-progress',
        progress: 45,
        lastUpdated: '2026-01-18',
        year: 2025,
        jurisdiction: 'Italy',
        entity: 'EPISO 6 Milan Commercial SRL',
        subfund: 'EPISO 6',
      },
      {
        id: 'be-sa',
        engagementId: 'ENG-REIF-BE-001',
        name: 'REIF Brussels Office SA',
        countryFlag: '🇧🇪',
        status: 'reviewing',
        progress: 90,
        lastUpdated: '2026-01-21',
        year: 2025,
        jurisdiction: 'Belgium',
        entity: 'REIF Brussels Office SA',
        subfund: 'REIF',
      },
    ],
    vat: [
      {
        id: 'fr-sci-vat',
        engagementId: 'ENG-CCP5-FR-001',
        name: 'CCP 5 Paris Office SPV',
        countryFlag: '🇫🇷',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-18',
        year: 2025,
        jurisdiction: 'France',
        entity: 'CCP 5 Paris Office SPV',
        subfund: 'CCP 5',
      },
      {
        id: 'de-gmbh-vat',
        engagementId: 'ENG-CCP5-DE-001',
        name: 'CCP 5 Munich Logistics PropCo',
        countryFlag: '🇩🇪',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-17',
        year: 2025,
        jurisdiction: 'Germany',
        entity: 'CCP 5 Munich Logistics PropCo',
        subfund: 'CCP 5',
      },
      {
        id: 'nl-bv-vat',
        engagementId: 'ENG-CCP5-NL-001',
        name: 'CCP 5 Amsterdam Retail BV',
        countryFlag: '🇳🇱',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-16',
        year: 2025,
        jurisdiction: 'Netherlands',
        entity: 'CCP 5 Amsterdam Retail BV',
        subfund: 'CCP 5',
      },
      {
        id: 'be-sa-vat',
        engagementId: 'ENG-EPISO6-BE-001',
        name: 'EPISO 6 Brussels Industrial SA',
        countryFlag: '🇧🇪',
        status: 'completed',
        progress: 100,
        lastUpdated: '2026-01-15',
        year: 2024,
        jurisdiction: 'Belgium',
        entity: 'EPISO 6 Brussels Industrial SA',
        subfund: 'EPISO 6',
      },
      {
        id: 'es-sl-vat',
        engagementId: 'ENG-EPISO6-ES-001',
        name: 'EPISO 6 Madrid Residential SL',
        countryFlag: '🇪🇸',
        status: 'in-progress',
        progress: 70,
        lastUpdated: '2026-01-22',
        year: 2024,
        jurisdiction: 'Spain',
        entity: 'EPISO 6 Madrid Residential SL',
        subfund: 'EPISO 6',
      },
    ],
    assessment: [
      {
        id: 'fr-sci-assess',
        engagementId: 'ENG-CCP5-FR-001',
        name: 'CCP 5 Paris Office SPV',
        countryFlag: '🇫🇷',
        status: 'reviewing',
        progress: 90,
        lastUpdated: '2026-01-21',
        year: 2025,
        jurisdiction: 'France',
        entity: 'CCP 5 Paris Office SPV',
        subfund: 'CCP 5',
      },
      {
        id: 'de-gmbh-assess',
        engagementId: 'ENG-CCP5-DE-001',
        name: 'CCP 5 Munich Logistics PropCo',
        countryFlag: '🇩🇪',
        status: 'reviewing',
        progress: 88,
        lastUpdated: '2026-01-20',
        year: 2025,
        jurisdiction: 'Germany',
        entity: 'CCP 5 Munich Logistics PropCo',
        subfund: 'CCP 5',
      },
      {
        id: 'nl-bv-assess',
        engagementId: 'ENG-CCP5-NL-001',
        name: 'CCP 5 Amsterdam Retail BV',
        countryFlag: '🇳🇱',
        status: 'in-progress',
        progress: 55,
        lastUpdated: '2026-01-19',
        year: 2024,
        jurisdiction: 'Netherlands',
        entity: 'CCP 5 Amsterdam Retail BV',
        subfund: 'CCP 5',
      },
    ],
    'transfer-pricing': [
      {
        id: 'fr-de-tp',
        engagementId: 'ENG-CCP5-FR-001',
        name: 'France-Germany TP',
        countryFlag: '🇫🇷🇩🇪',
        status: 'reviewing',
        progress: 80,
        lastUpdated: '2026-01-22',
        year: 2025,
        jurisdiction: 'France',
        entity: 'France-Germany TP',
        subfund: 'CCP 5',
      },
      {
        id: 'nl-be-tp',
        engagementId: 'ENG-CCP5-NL-001',
        name: 'Netherlands-Belgium TP',
        countryFlag: '🇳🇱🇧🇪',
        status: 'in-progress',
        progress: 50,
        lastUpdated: '2026-01-21',
        year: 2025,
        jurisdiction: 'Netherlands',
        entity: 'Netherlands-Belgium TP',
        subfund: 'CCP 5',
      },
      {
        id: 'lu-fr-tp',
        engagementId: 'ENG-EPISO6-LU-001',
        name: 'Luxembourg-France TP',
        countryFlag: '🇱🇺🇫🇷',
        status: 'not-started',
        progress: 0,
        lastUpdated: '2026-01-18',
        year: 2024,
        jurisdiction: 'Luxembourg',
        entity: 'Luxembourg-France TP',
        subfund: 'EPISO 6',
      },
    ],
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
   * Generates progression history from October 2025 to March 2026 (6 months)
   * Current state (March 2026) matches actual entity statuses
   */
  getProgressionHistory(serviceId: string): ProgressionDataPoint[] {
    const entities = this.getEntitiesByService(serviceId);
    const total = entities.length;
    if (total === 0) return [];

    // Count current statuses from actual entity data
    const currentCounts = {
      notStarted: entities.filter(e => e.status === 'not-started').length,
      inProgress: entities.filter(e => e.status === 'in-progress').length,
      reviewing: entities.filter(e => e.status === 'reviewing').length,
      completed: entities.filter(e => e.status === 'completed').length,
    };

    // 6 months from Oct 2025 to Mar 2026
    const monthLabels = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

    // Build progression backwards from current state
    const months: ProgressionDataPoint[] = [];

    // October 2025: More not started, fewer completed
    months.push({
      date: 'Oct',
      notStarted: Math.min(total, currentCounts.notStarted + 4),
      inProgress: Math.max(0, currentCounts.inProgress - 1),
      reviewing: 0,
      completed: 0,
    });

    // November 2025: Starting to progress
    months.push({
      date: 'Nov',
      notStarted: Math.min(total, currentCounts.notStarted + 3),
      inProgress: Math.max(0, currentCounts.inProgress),
      reviewing: 0,
      completed: 0,
    });

    // December 2025: More activity
    months.push({
      date: 'Dec',
      notStarted: Math.min(total, currentCounts.notStarted + 2),
      inProgress: currentCounts.inProgress + 1,
      reviewing: Math.max(0, currentCounts.reviewing - 1),
      completed: Math.max(0, currentCounts.completed - 1),
    });

    // January 2026: Getting closer to current
    months.push({
      date: 'Jan',
      notStarted: currentCounts.notStarted + 1,
      inProgress: currentCounts.inProgress,
      reviewing: currentCounts.reviewing,
      completed: Math.max(0, currentCounts.completed - 1),
    });

    // February 2026: Almost current
    months.push({
      date: 'Feb',
      notStarted: currentCounts.notStarted,
      inProgress: currentCounts.inProgress + 1,
      reviewing: Math.max(0, currentCounts.reviewing - 1),
      completed: currentCounts.completed,
    });

    // March 2026: Current state (matches actual entity statuses)
    months.push({
      date: 'Mar',
      notStarted: currentCounts.notStarted,
      inProgress: currentCounts.inProgress,
      reviewing: currentCounts.reviewing,
      completed: currentCounts.completed,
    });

    // Normalize totals for each month
    months.forEach(month => {
      const monthTotal = month.notStarted + month.inProgress + month.reviewing + month.completed;
      if (monthTotal !== total) {
        // Adjust inProgress to balance
        month.inProgress = Math.max(
          0,
          total - month.notStarted - month.reviewing - month.completed
        );
      }
    });

    // Ensure monotonic progression
    this.ensureMonotonicProgression(months);

    return months;
  }

  /**
   * Ensures monotonic progression: completed never decreases, notStarted never increases.
   * Adjusts intermediate values to create smooth, realistic progression.
   */
  private ensureMonotonicProgression(weeks: ProgressionDataPoint[]): void {
    const total =
      weeks[0].notStarted + weeks[0].inProgress + weeks[0].reviewing + weeks[0].completed;

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
      const currentTotal =
        weeks[i].notStarted + weeks[i].inProgress + weeks[i].reviewing + weeks[i].completed;
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
          weeks[i].reviewing -= reduction - fromInProgress;
        }
      }

      // Ensure no negative values
      weeks[i].notStarted = Math.max(0, weeks[i].notStarted);
      weeks[i].inProgress = Math.max(0, weeks[i].inProgress);
      weeks[i].reviewing = Math.max(0, weeks[i].reviewing);
      weeks[i].completed = Math.max(0, weeks[i].completed);
    }
  }
}
