export type DocumentType =
  | 'general_ledger'
  | 'trial_balance'
  | 'bank_statement'
  | 'tax_return';

export type DocumentStatus = 'pending' | 'analyzing' | 'analyzed' | 'error';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  engagementId: string;
  uploadedAt: string;
  status: DocumentStatus;
  size: number;
  aiSummary?: string;
  extractedData?: Record<string, unknown>;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  general_ledger: 'Grand Livre',
  trial_balance: 'Balance Générale',
  bank_statement: 'Relevé Bancaire',
  tax_return: 'Déclaration Fiscale',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'En attente',
  analyzing: 'Analyse en cours',
  analyzed: 'Analysé',
  error: 'Erreur',
};
