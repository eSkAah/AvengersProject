import { Document } from '../models';

export const MOCK_DOCUMENTS: Document[] = [
  // Germany PropCo documents
  {
    id: 'DOC-DE-001',
    name: 'Grand_Livre_Germany_2026.xlsx',
    type: 'general_ledger',
    engagementId: 'ENG-DE-001',
    uploadedAt: '2026-01-10T09:15:00Z',
    status: 'analyzing',
    size: 2456789,
    aiSummary: 'Grand livre comptable pour Germany PropCo, exercice 2026. Contient 1,247 écritures.',
  },
  {
    id: 'DOC-DE-002',
    name: 'Trial_Balance_Germany_Q4.xlsx',
    type: 'trial_balance',
    engagementId: 'ENG-DE-001',
    uploadedAt: '2026-01-10T09:18:00Z',
    status: 'analyzing',
    size: 567890,
    aiSummary: 'Balance générale Q4 2025 pour Germany PropCo. Total actifs: 5,200,000€.',
  },

  // Netherlands BV documents (all analyzed - completed engagement)
  {
    id: 'DOC-NL-001',
    name: 'Grand_Livre_Netherlands_2026.xlsx',
    type: 'general_ledger',
    engagementId: 'ENG-NL-001',
    uploadedAt: '2026-01-05T14:30:00Z',
    status: 'analyzed',
    size: 1890234,
    aiSummary: 'Grand livre comptable complet pour Netherlands BV. 892 écritures, aucune anomalie détectée.',
    extractedData: {
      totalEntries: 892,
      totalDebits: 2100000,
      totalCredits: 2100000,
      balanced: true,
    },
  },
  {
    id: 'DOC-NL-002',
    name: 'Trial_Balance_Netherlands_2025.xlsx',
    type: 'trial_balance',
    engagementId: 'ENG-NL-001',
    uploadedAt: '2026-01-05T14:32:00Z',
    status: 'analyzed',
    size: 456123,
    aiSummary: 'Balance générale 2025 conforme. Écart N/N-1: +12.1% sur les actifs.',
    extractedData: {
      assets: 2100000,
      liabilities: 890000,
      equity: 1210000,
    },
  },
  {
    id: 'DOC-NL-003',
    name: 'Bank_Statement_NL_Dec2025.pdf',
    type: 'bank_statement',
    engagementId: 'ENG-NL-001',
    uploadedAt: '2026-01-05T14:35:00Z',
    status: 'analyzed',
    size: 234567,
    aiSummary: 'Relevé bancaire décembre 2025. Solde de clôture: 423,567€. Cohérent avec le grand livre.',
    extractedData: {
      closingBalance: 423567,
      totalCredits: 156000,
      totalDebits: 142000,
    },
  },
  {
    id: 'DOC-NL-004',
    name: 'Tax_Return_NL_2025.pdf',
    type: 'tax_return',
    engagementId: 'ENG-NL-001',
    uploadedAt: '2026-01-06T10:00:00Z',
    status: 'analyzed',
    size: 678901,
    aiSummary: 'Déclaration fiscale 2025 complète. Impôt dû: 124,500€. Conforme aux données financières.',
    extractedData: {
      taxableIncome: 498000,
      taxDue: 124500,
      taxRate: 0.25,
    },
  },

  // Belgium HoldCo documents
  {
    id: 'DOC-BE-001',
    name: 'Grand_Livre_Belgium_2026.xlsx',
    type: 'general_ledger',
    engagementId: 'ENG-BE-001',
    uploadedAt: '2026-01-14T11:45:00Z',
    status: 'analyzed',
    size: 3456789,
    aiSummary: 'Grand livre Belgium HoldCo. 1,567 écritures. Note: Baisse YoY de -3.4% sur le chiffre d\'affaires.',
    extractedData: {
      totalEntries: 1567,
      totalDebits: 4500000,
      totalCredits: 4500000,
      balanced: true,
      alerts: ['Revenue decline detected: -3.4% YoY'],
    },
  },
];
