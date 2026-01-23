// Entity Task Model
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface EntityTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignee?: string;
  category: 'document' | 'review' | 'approval' | 'data_entry' | 'validation';
  completedAt?: string;
  blockedReason?: string;
}

// Tax Report Data Model (based on the document structure)
export interface TaxAttribute {
  functionalCurrency: string;
  advancedTaxAgreement: boolean;
  permanentEstablishment: boolean;
  taxConsolidation: 'yes' | 'no' | 'n/a';
}

export interface FinancingActivity {
  intercompanyTransactions: boolean;
  intercompanyFinancing: boolean;
  tpReport: boolean;
  marginRealized: boolean;
  tpAdjustment: boolean;
}

export interface HoldingActivity {
  qualifyingParticipations: boolean;
  partnerships: boolean;
}

export interface InterestLimitationRules {
  article164bis1LIR: boolean;
  exceedingBorrowingCosts: boolean;
  nonDeductibleEBC: boolean;
  carriedForwardEBC: boolean;
}

export interface AtadRules {
  associatedEnterprises: boolean;
  controlledForeignCompanies: boolean;
  hybrids: boolean;
  mdrDac6: 'yes' | 'no' | 'n/a';
}

export interface TaxChargeItem {
  label: string;
  amount: number;
  perBooks?: number;
  difference?: number;
}

export interface CorporateIncomeTax {
  adjustedIncome: number;
  taxableIncome: number;
  taxFollowingTaxTable: number;
  employmentTaxSurcharge: number;
  citLiabilityBeforeCredits: number;
  taxCredits: number;
  citLiabilityAfterCredits: number;
}

export interface MunicipalBusinessTax {
  adjustedIncome: number;
  municipalBusinessTaxRebate: number;
  taxableIncome: number;
  taxableIncomeRounded: number;
  mbtLiability: number;
  mbtRate: number;
}

export interface NetWorthTax {
  taxDueBasedOnUnitaryValue: number;
  taxableWorthAt1January: number;
  nwt: number;
  minimumNetWorthTax: number;
  totalBalanceSheet: number;
  minimumNWT: number;
  reductionCitAfterCredits: number;
  minimumNWTAfterDeduction: number;
  highestNWTTax: number;
  finalNWTLiability: number;
}

export interface TaxBaseCalculation {
  profitLoss: number;
  taxBaseBeforeTLCF: number;
  taxBaseAfterTLCF: number;
  additions: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
}

export interface TaxLossesCarriedForward {
  available: boolean;
  items?: { year: number; amount: number; utilized: number; remaining: number }[];
}

export interface EntityTaxReport {
  taxId: string;
  taxOffice: string;
  taxPeriodStart: string;
  taxPeriodEnd: string;
  fiscalYear: number;

  // Estimated Tax Charge Summary
  estimatedTaxCharge: {
    total: TaxChargeItem;
    corporateIncomeTax: TaxChargeItem;
    municipalBusinessTax: TaxChargeItem;
    netWorthTax2023: TaxChargeItem;
    netWorthTax2024: TaxChargeItem;
  };

  // Attributes
  taxAttribute: TaxAttribute;
  financingActivity: FinancingActivity;
  holdingActivity: HoldingActivity;
  interestLimitationRules: InterestLimitationRules;
  atadRules: AtadRules;

  // Tax Calculations
  corporateIncomeTax: CorporateIncomeTax;
  municipalBusinessTax: MunicipalBusinessTax;
  netWorthTax: NetWorthTax;

  // Tax Base
  taxBase: TaxBaseCalculation;
  taxLossesCarriedForward: TaxLossesCarriedForward;
}

// Entity Metadata
export interface EntityMetadata {
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  vatNumber?: string;
  incorporationDate: string;
  fiscalYearEnd: string;
  currency: string;
  legalForm: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
}

// Full Entity Detail
export interface EntityDetail {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  status: string;
  service: string;
  metadata: EntityMetadata;
  tasks: EntityTask[];
  taxReport?: EntityTaxReport;
}
