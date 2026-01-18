import { DocumentType } from './document.model';

export type EngagementStatus = 'waiting' | 'received' | 'processing' | 'completed';
export type RiskLevel = 'high' | 'medium' | 'low';
export type CountryCode = 'FR' | 'DE' | 'NL' | 'BE' | 'LU';
export type DocumentRequirementStatus = 'missing' | 'uploaded' | 'validated' | 'year_mismatch';

export interface FinancialData {
  assets: number;
  liabilities: number;
  revenue: number;
  yoyChange: number;
  previousYear?: {
    assets: number;
    liabilities: number;
    revenue: number;
  };
}

export interface VarianceAlert {
  metric: string;
  metric_label: string;
  current_value: number;
  previous_value: number;
  variance_percent: number;
  variance_type: 'increase' | 'decrease';
  insight_message: string;
}

export interface DocumentRequirement {
  type: DocumentType;
  label: string;
  required: boolean;
  status: DocumentRequirementStatus;
  documentId?: string;
  fiscalYear: number;  // Required fiscal year (e.g., 2025)
}

export interface Engagement {
  id: string;
  entity: string;
  country: CountryCode;
  countryFlag: string;
  service: string;
  status: EngagementStatus;
  riskLevel: RiskLevel;
  completionPercent: number;
  dueDate: string;
  fiscalYear: number;  // Target fiscal year (e.g., 2025)
  predictedCompletion?: string;
  financialData: FinancialData;
  documentsRequired: string[];
  documentsUploaded: string[];
  documentRequirements?: DocumentRequirement[];  // Structured requirements with status
  scenario?: string;
  varianceAlerts?: VarianceAlert[];
  aiInsights?: string[];
}

export const STATUS_LABELS: Record<EngagementStatus, string> = {
  waiting: 'En attente',
  received: 'Reçu',
  processing: 'En cours',
  completed: 'Terminé',
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
};

export const COUNTRY_FLAGS: Record<CountryCode, string> = {
  FR: '🇫🇷',
  DE: '🇩🇪',
  NL: '🇳🇱',
  BE: '🇧🇪',
  LU: '🇱🇺',
};
