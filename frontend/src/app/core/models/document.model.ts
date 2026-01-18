export type DocumentType =
  | 'general_ledger'
  | 'trial_balance'
  | 'bank_statement'
  | 'tax_return'
  | 'financial_statement';

export type DocumentCategory = 'accounting' | 'tax' | 'financial';

export type DocumentStatus = 'pending' | 'uploaded' | 'analyzing' | 'analyzed' | 'error';

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
  year: number;              // Fiscal year (2024, 2025, 2026)
  entityId: string;          // Primary entity ID
  entityName: string;        // e.g., "France SPV"
  subsidiaryId?: string;     // Optional for multi-subsidiary
  subsidiaryName?: string;
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
  error: 'Error',
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
