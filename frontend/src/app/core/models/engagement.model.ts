export type EngagementStatus = 'waiting' | 'received' | 'processing' | 'completed';
export type RiskLevel = 'high' | 'medium' | 'low';
export type CountryCode = 'FR' | 'DE' | 'NL' | 'BE' | 'LU';

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
  predictedCompletion?: string;
  financialData: FinancialData;
  documentsRequired: string[];
  documentsUploaded: string[];
  scenario?: string;
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
