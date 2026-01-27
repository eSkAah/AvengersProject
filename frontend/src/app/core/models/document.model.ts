export type DocumentType =
  | 'general_ledger'
  | 'trial_balance'
  | 'bank_statement'
  | 'tax_return'
  | 'financial_statement';

export type DocumentCategory = 'accounting' | 'tax' | 'financial';

export type DocumentStatus =
  | 'pending'
  | 'uploaded'
  | 'analyzing'
  | 'analyzed'
  | 'validated'
  | 'missing'
  | 'error'
  | 'signed_off'
  | 'in_review'
  | 'private'
  | 'unclassified';

export type ServiceType = 'cit' | 'vat' | 'assessment' | 'transfer-pricing' | 'others';

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  cit: 'CIT',
  vat: 'VAT',
  assessment: 'Tax Assessment',
  'transfer-pricing': 'Transfer Pricing',
  others: 'Others',
};

export const SERVICE_TYPE_ICONS: Record<ServiceType, string> = {
  cit: 'landmark',
  vat: 'receipt',
  assessment: 'clipboard-check',
  'transfer-pricing': 'arrow-left-right',
  others: 'folder-question',
};

// Map document types to services
export const DOCUMENT_TYPE_TO_SERVICE: Record<DocumentType, ServiceType> = {
  general_ledger: 'cit',
  trial_balance: 'cit',
  tax_return: 'cit',
  financial_statement: 'cit',
  bank_statement: 'vat',
};

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  category?: DocumentCategory;
  engagementIds: string[];
  uploadedAt: string;
  status: DocumentStatus;
  size: number;
  aiSummary?: string;
  extractedData?: Record<string, unknown>;
  filePath?: string;
  year: number; // Fiscal year (2024, 2025, 2026)
  entityId: string; // Primary entity ID
  entityName: string; // e.g., "France SPV"
  subsidiaryId?: string; // Optional for multi-subsidiary
  subsidiaryName?: string;
  serviceType?: ServiceType; // Link to service (cit, vat, accounting, etc.)
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  general_ledger: 'General Ledger',
  trial_balance: 'Trial Balance',
  bank_statement: 'Bank Statement',
  tax_return: 'Tax Return',
  financial_statement: 'Financial Statement',
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  accounting: 'Accounting',
  tax: 'Tax',
  financial: 'Financial',
};

export const DOCUMENT_TYPE_CATEGORIES: Record<DocumentType, DocumentCategory> = {
  general_ledger: 'accounting',
  trial_balance: 'accounting',
  tax_return: 'tax',
  financial_statement: 'financial',
  bank_statement: 'financial',
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Pending',
  uploaded: 'Uploaded',
  analyzing: 'Analyzing',
  analyzed: 'Analyzed',
  validated: 'Validated',
  missing: 'Missing',
  error: 'Error',
  signed_off: 'Signed Off',
  in_review: 'In Review',
  private: 'Private (EY)',
  unclassified: 'Unclassified',
};

export interface DocumentTypeGroup {
  type: DocumentType;
  typeLabel: string;
  documents: Document[];
  count: number;
}

export interface DocumentCategoryGroup {
  category: DocumentCategory;
  categoryLabel: string;
  types: DocumentTypeGroup[];
  totalCount: number;
}

export interface DocumentLibrary {
  categories: DocumentCategoryGroup[];
  totalCount: number;
}
