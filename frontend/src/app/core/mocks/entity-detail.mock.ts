import { EntityDetail, EntityTask, EntityTaxReport } from '../models/entity.model';

// Mock Tasks for entities
const MOCK_TASKS_CCP5_FR: EntityTask[] = [
  {
    id: 'TASK-001',
    title: 'Upload Tax Return 2025',
    description: 'Upload the corporate tax return document for fiscal year 2025',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-02-15',
    category: 'document',
    assignee: 'Client',
  },
  {
    id: 'TASK-002',
    title: 'Review Trial Balance',
    description: 'Review and validate the trial balance entries for accuracy',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-02-10',
    category: 'review',
    assignee: 'EY Tax Team',
  },
  {
    id: 'TASK-003',
    title: 'Validate Bank Reconciliation',
    description: 'Ensure bank statements match general ledger entries',
    status: 'completed',
    priority: 'medium',
    dueDate: '2026-01-28',
    category: 'validation',
    completedAt: '2026-01-27T14:30:00Z',
    assignee: 'EY Tax Team',
  },
  {
    id: 'TASK-004',
    title: 'Upload Financial Statements',
    description: 'Upload audited financial statements for the fiscal year',
    status: 'pending',
    priority: 'medium',
    dueDate: '2026-02-20',
    category: 'document',
    assignee: 'Client',
  },
  {
    id: 'TASK-005',
    title: 'Intercompany Loan Documentation',
    description: 'Provide documentation for intercompany loan agreements',
    status: 'blocked',
    priority: 'high',
    dueDate: '2026-02-08',
    category: 'document',
    assignee: 'Client',
    blockedReason: 'Awaiting legal review of loan terms',
  },
  {
    id: 'TASK-006',
    title: 'Approve CIT Calculation',
    description: 'Review and approve the corporate income tax calculation',
    status: 'pending',
    priority: 'low',
    dueDate: '2026-02-25',
    category: 'approval',
    assignee: 'Tax Manager',
  },
];

const MOCK_TASKS_GENERIC: EntityTask[] = [
  {
    id: 'TASK-G01',
    title: 'Upload General Ledger',
    description: 'Upload the general ledger export for the fiscal year',
    status: 'completed',
    priority: 'high',
    dueDate: '2026-01-20',
    category: 'document',
    completedAt: '2026-01-18T10:15:00Z',
    assignee: 'Client',
  },
  {
    id: 'TASK-G02',
    title: 'Data Entry Verification',
    description: 'Verify all data entries against source documents',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2026-02-05',
    category: 'data_entry',
    assignee: 'EY Tax Team',
  },
  {
    id: 'TASK-G03',
    title: 'Tax Provision Review',
    description: 'Review tax provision calculations and adjustments',
    status: 'pending',
    priority: 'high',
    dueDate: '2026-02-12',
    category: 'review',
    assignee: 'Tax Manager',
  },
];

// Mock Tax Report based on the image provided
const MOCK_TAX_REPORT_LU: EntityTaxReport = {
  taxId: '2015 0000 005',
  taxOffice: 'Luxembourg Tax Office',
  taxPeriodStart: '2022-07-01',
  taxPeriodEnd: '2023-06-30',
  fiscalYear: 2023,

  estimatedTaxCharge: {
    total: { label: 'TOTAL', amount: 535.00, perBooks: 4514.00, difference: 4979.00 },
    corporateIncomeTax: { label: 'Corporate Income Tax', amount: 0.00, perBooks: 0.00, difference: 0.00 },
    municipalBusinessTax: { label: 'Municipal Business Tax', amount: 0.00, perBooks: 0.00, difference: 0.00 },
    netWorthTax2023: { label: 'Net Worth Tax 2023', amount: 535.00, perBooks: 4914.00, difference: 0.00 },
    netWorthTax2024: { label: 'Net Worth Tax 2024', amount: 4815.00, perBooks: 0.00, difference: 0.00 },
  },

  taxAttribute: {
    functionalCurrency: 'EUR',
    advancedTaxAgreement: false,
    permanentEstablishment: false,
    taxConsolidation: 'n/a',
  },

  financingActivity: {
    intercompanyTransactions: true,
    intercompanyFinancing: false,
    tpReport: false,
    marginRealized: false,
    tpAdjustment: false,
  },

  holdingActivity: {
    qualifyingParticipations: false,
    partnerships: false,
  },

  interestLimitationRules: {
    article164bis1LIR: false,
    exceedingBorrowingCosts: false,
    nonDeductibleEBC: false,
    carriedForwardEBC: false,
  },

  atadRules: {
    associatedEnterprises: false,
    controlledForeignCompanies: false,
    hybrids: false,
    mdrDac6: 'n/a',
  },

  corporateIncomeTax: {
    adjustedIncome: -166813.37,
    taxableIncome: 0.00,
    taxFollowingTaxTable: 0.00,
    employmentTaxSurcharge: 0.00,
    citLiabilityBeforeCredits: 0.00,
    taxCredits: 0.00,
    citLiabilityAfterCredits: 0.00,
  },

  municipalBusinessTax: {
    adjustedIncome: -166813.37,
    municipalBusinessTaxRebate: -37500.00,
    taxableIncome: 0.00,
    taxableIncomeRounded: 0.00,
    mbtLiability: 0.00,
    mbtRate: 0.00,
  },

  netWorthTax: {
    taxDueBasedOnUnitaryValue: 0.00,
    taxableWorthAt1January: 0.00,
    nwt: 0.00,
    minimumNetWorthTax: 4815.00,
    totalBalanceSheet: 2679647.96,
    minimumNWT: 4815.00,
    reductionCitAfterCredits: 0.00,
    minimumNWTAfterDeduction: 4815.00,
    highestNWTTax: 4815.00,
    finalNWTLiability: 4815.00,
  },

  taxBase: {
    profitLoss: -171713.26,
    taxBaseBeforeTLCF: -166818.37,
    taxBaseAfterTLCF: -166818.37,
    additions: [
      { label: 'NWT', amount: 4914.00 },
    ],
    deductions: [
      { label: 'Amount', amount: 14.20 },
    ],
  },

  taxLossesCarriedForward: {
    available: false,
  },
};

// Entity Details Map
export const MOCK_ENTITY_DETAILS: Record<string, EntityDetail> = {
  'ENG-CCP5-FR-001': {
    id: 'ENG-CCP5-FR-001',
    name: 'CCP 5 Paris Office SPV',
    country: 'FR',
    countryFlag: '\u{1F1EB}\u{1F1F7}',
    status: 'waiting',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'CCP 5 Paris Office SPV SAS',
      tradingName: 'CCP5 Paris',
      registrationNumber: 'RCS Paris 847 523 196',
      vatNumber: 'FR12847523196',
      incorporationDate: '2019-03-15',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'SAS (Simplified Joint Stock Company)',
      address: {
        street: '25 Avenue des Champs-Élysées',
        city: 'Paris',
        postalCode: '75008',
        country: 'France',
      },
    },
    tasks: MOCK_TASKS_CCP5_FR,
    taxReport: {
      ...MOCK_TAX_REPORT_LU,
      taxId: '2024 1234 567',
      taxOffice: 'Paris Tax Office - Service des Impôts des Entreprises',
      taxPeriodStart: '2025-01-01',
      taxPeriodEnd: '2025-12-31',
      fiscalYear: 2025,
    },
  },

  'ENG-CCP5-DE-001': {
    id: 'ENG-CCP5-DE-001',
    name: 'CCP 5 Munich Logistics PropCo',
    country: 'DE',
    countryFlag: '\u{1F1E9}\u{1F1EA}',
    status: 'processing',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'CCP 5 Munich Logistics PropCo GmbH',
      registrationNumber: 'HRB 254891',
      vatNumber: 'DE315789456',
      incorporationDate: '2020-06-22',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'GmbH (Limited Liability Company)',
      address: {
        street: 'Leopoldstraße 150',
        city: 'Munich',
        postalCode: '80804',
        country: 'Germany',
      },
    },
    tasks: MOCK_TASKS_GENERIC,
    taxReport: {
      ...MOCK_TAX_REPORT_LU,
      taxId: '2024 8765 432',
      taxOffice: 'Finanzamt München',
      fiscalYear: 2025,
    },
  },

  'ENG-CCP5-NL-001': {
    id: 'ENG-CCP5-NL-001',
    name: 'CCP 5 Amsterdam Retail BV',
    country: 'NL',
    countryFlag: '\u{1F1F3}\u{1F1F1}',
    status: 'completed',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'CCP 5 Amsterdam Retail B.V.',
      registrationNumber: 'KVK 75849321',
      vatNumber: 'NL861574923B01',
      incorporationDate: '2019-11-08',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'BV (Private Limited Company)',
      address: {
        street: 'Herengracht 450',
        city: 'Amsterdam',
        postalCode: '1017 CA',
        country: 'Netherlands',
      },
    },
    tasks: MOCK_TASKS_GENERIC.map(t => ({ ...t, status: 'completed' as const })),
    taxReport: MOCK_TAX_REPORT_LU,
  },

  'ENG-EPISO6-LU-001': {
    id: 'ENG-EPISO6-LU-001',
    name: 'EPISO 6 Luxembourg HoldCo',
    country: 'LU',
    countryFlag: '\u{1F1F1}\u{1F1FA}',
    status: 'processing',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'EPISO 6 Luxembourg HoldCo S.à r.l.',
      registrationNumber: 'B 245789',
      vatNumber: 'LU28574963',
      incorporationDate: '2021-02-14',
      fiscalYearEnd: '06-30',
      currency: 'EUR',
      legalForm: 'S.à r.l. (Private Limited Liability Company)',
      address: {
        street: '2 Boulevard Konrad Adenauer',
        city: 'Luxembourg',
        postalCode: 'L-1115',
        country: 'Luxembourg',
      },
    },
    tasks: MOCK_TASKS_GENERIC,
    taxReport: MOCK_TAX_REPORT_LU,
  },

  'ENG-EPISO6-ES-001': {
    id: 'ENG-EPISO6-ES-001',
    name: 'EPISO 6 Madrid Residential SL',
    country: 'ES',
    countryFlag: '\u{1F1EA}\u{1F1F8}',
    status: 'waiting',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'EPISO 6 Madrid Residential S.L.',
      registrationNumber: 'CIF B-12345678',
      vatNumber: 'ESB12345678',
      incorporationDate: '2022-04-10',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'S.L. (Sociedad Limitada)',
      address: {
        street: 'Paseo de la Castellana 89',
        city: 'Madrid',
        postalCode: '28046',
        country: 'Spain',
      },
    },
    tasks: MOCK_TASKS_GENERIC,
    taxReport: {
      ...MOCK_TAX_REPORT_LU,
      taxId: '2024 ES 789456',
      taxOffice: 'Agencia Tributaria - Madrid',
      fiscalYear: 2025,
    },
  },

  'ENG-EPISO6-IT-001': {
    id: 'ENG-EPISO6-IT-001',
    name: 'EPISO 6 Milan Mixed-Use Srl',
    country: 'IT',
    countryFlag: '\u{1F1EE}\u{1F1F9}',
    status: 'received',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'EPISO 6 Milan Mixed-Use S.r.l.',
      registrationNumber: 'REA MI-2345678',
      vatNumber: 'IT12345678901',
      incorporationDate: '2021-09-15',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'S.r.l. (Società a responsabilità limitata)',
      address: {
        street: 'Via Monte Napoleone 12',
        city: 'Milan',
        postalCode: '20121',
        country: 'Italy',
      },
    },
    tasks: MOCK_TASKS_GENERIC,
    taxReport: {
      ...MOCK_TAX_REPORT_LU,
      taxId: '2024 IT 456123',
      taxOffice: 'Agenzia delle Entrate - Milano',
      fiscalYear: 2025,
    },
  },

  'ENG-EPISO6-BE-001': {
    id: 'ENG-EPISO6-BE-001',
    name: 'EPISO 6 Brussels Industrial SA',
    country: 'BE',
    countryFlag: '\u{1F1E7}\u{1F1EA}',
    status: 'received',
    service: 'Corporate Tax',
    metadata: {
      legalName: 'EPISO 6 Brussels Industrial S.A.',
      registrationNumber: 'BCE 0123.456.789',
      vatNumber: 'BE0123456789',
      incorporationDate: '2020-11-20',
      fiscalYearEnd: '12-31',
      currency: 'EUR',
      legalForm: 'S.A. (Société Anonyme)',
      address: {
        street: 'Avenue Louise 250',
        city: 'Brussels',
        postalCode: '1050',
        country: 'Belgium',
      },
    },
    tasks: MOCK_TASKS_GENERIC,
    taxReport: {
      ...MOCK_TAX_REPORT_LU,
      taxId: '2024 BE 321654',
      taxOffice: 'SPF Finances - Brussels',
      fiscalYear: 2025,
    },
  },
};

// Helper to get entity detail by ID (with fallback)
export function getEntityDetail(entityId: string): EntityDetail | null {
  return MOCK_ENTITY_DETAILS[entityId] || null;
}
