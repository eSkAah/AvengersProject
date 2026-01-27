import {
  EntityDetail,
  EntityTask,
  EntityTaxReport,
  WorkflowStep,
  WorkflowTask,
} from '../models/entity.model';

// Workflow tasks templates for each step
const COLLECT_DATA_TASKS: WorkflowTask[] = [
  {
    id: 'WF-CD-01',
    title: 'Request financial statements from client',
    status: 'pending',
    assignee: 'EY Team',
  },
  { id: 'WF-CD-02', title: 'Upload trial balance document', status: 'pending', assignee: 'Client' },
  {
    id: 'WF-CD-03',
    title: 'Collect bank reconciliation reports',
    status: 'pending',
    assignee: 'Client',
  },
  {
    id: 'WF-CD-04',
    title: 'Gather intercompany transaction details',
    status: 'pending',
    assignee: 'Client',
  },
];

const PROCESSING_TASKS: WorkflowTask[] = [
  { id: 'WF-PR-01', title: 'Import data into tax system', status: 'pending', assignee: 'EY Team' },
  { id: 'WF-PR-02', title: 'Run automated data validation', status: 'pending', assignee: 'System' },
  {
    id: 'WF-PR-03',
    title: 'Calculate tax base adjustments',
    status: 'pending',
    assignee: 'EY Team',
  },
  {
    id: 'WF-PR-04',
    title: 'Generate preliminary tax computation',
    status: 'pending',
    assignee: 'System',
  },
];

const REVIEWING_TASKS: WorkflowTask[] = [
  {
    id: 'WF-RV-01',
    title: 'Senior review of tax calculations',
    status: 'pending',
    assignee: 'Tax Manager',
  },
  {
    id: 'WF-RV-02',
    title: 'Verify compliance with local regulations',
    status: 'pending',
    assignee: 'EY Team',
  },
  {
    id: 'WF-RV-03',
    title: 'Cross-check with prior year filings',
    status: 'pending',
    assignee: 'EY Team',
  },
  { id: 'WF-RV-04', title: 'Quality assurance sign-off', status: 'pending', assignee: 'QA Lead' },
];

const COMPLETED_TASKS: WorkflowTask[] = [
  { id: 'WF-CP-01', title: 'Generate final tax report', status: 'pending', assignee: 'System' },
  {
    id: 'WF-CP-02',
    title: 'Send report to client for review',
    status: 'pending',
    assignee: 'EY Team',
  },
  {
    id: 'WF-CP-03',
    title: 'Archive all supporting documents',
    status: 'pending',
    assignee: 'System',
  },
];

// Helper to mark tasks as completed
function completeTasks(tasks: WorkflowTask[], completedAt: string): WorkflowTask[] {
  return tasks.map(t => ({ ...t, status: 'completed' as const, completedAt }));
}

// Helper to partially complete tasks
function partialCompleteTasks(
  tasks: WorkflowTask[],
  count: number,
  completedAt: string
): WorkflowTask[] {
  return tasks.map((t, i) => (i < count ? { ...t, status: 'completed' as const, completedAt } : t));
}

// Default workflow steps generator based on entity status
function generateWorkflowSteps(entityStatus: string): WorkflowStep[] {
  const steps: WorkflowStep[] = [
    {
      id: 'collect_data',
      label: 'Collect Data',
      description: 'Gathering all required documents and financial data from the client',
      status: 'pending',
      tasks: [...COLLECT_DATA_TASKS],
    },
    {
      id: 'processing',
      label: 'Processing',
      description: 'Processing and validating data, running tax calculations',
      status: 'pending',
      tasks: [...PROCESSING_TASKS],
    },
    {
      id: 'reviewing',
      label: 'Reviewing',
      description: 'Senior review and quality assurance verification',
      status: 'pending',
      tasks: [...REVIEWING_TASKS],
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Finalizing reports and archiving documents',
      status: 'pending',
      tasks: [...COMPLETED_TASKS],
    },
  ];

  switch (entityStatus) {
    case 'waiting':
      steps[0].status = 'in_progress';
      steps[0].startedAt = '2026-01-20T09:00:00Z';
      steps[0].tasks = partialCompleteTasks(COLLECT_DATA_TASKS, 1, '2026-01-21T10:30:00Z');
      break;
    case 'received':
      steps[0].status = 'completed';
      steps[0].completedAt = '2026-01-22T14:30:00Z';
      steps[0].tasks = completeTasks(COLLECT_DATA_TASKS, '2026-01-22T14:30:00Z');
      steps[1].status = 'in_progress';
      steps[1].startedAt = '2026-01-22T14:30:00Z';
      steps[1].tasks = partialCompleteTasks(PROCESSING_TASKS, 2, '2026-01-23T09:00:00Z');
      break;
    case 'processing':
      steps[0].status = 'completed';
      steps[0].completedAt = '2026-01-20T16:00:00Z';
      steps[0].tasks = completeTasks(COLLECT_DATA_TASKS, '2026-01-20T16:00:00Z');
      steps[1].status = 'completed';
      steps[1].completedAt = '2026-01-23T11:00:00Z';
      steps[1].tasks = completeTasks(PROCESSING_TASKS, '2026-01-23T11:00:00Z');
      steps[2].status = 'in_progress';
      steps[2].startedAt = '2026-01-23T11:00:00Z';
      steps[2].tasks = partialCompleteTasks(REVIEWING_TASKS, 2, '2026-01-24T15:00:00Z');
      break;
    case 'completed':
      steps[0].status = 'completed';
      steps[0].completedAt = '2026-01-15T10:00:00Z';
      steps[0].tasks = completeTasks(COLLECT_DATA_TASKS, '2026-01-15T10:00:00Z');
      steps[1].status = 'completed';
      steps[1].completedAt = '2026-01-18T14:00:00Z';
      steps[1].tasks = completeTasks(PROCESSING_TASKS, '2026-01-18T14:00:00Z');
      steps[2].status = 'completed';
      steps[2].completedAt = '2026-01-22T09:00:00Z';
      steps[2].tasks = completeTasks(REVIEWING_TASKS, '2026-01-22T09:00:00Z');
      steps[3].status = 'completed';
      steps[3].completedAt = '2026-01-24T16:30:00Z';
      steps[3].tasks = completeTasks(COMPLETED_TASKS, '2026-01-24T16:30:00Z');
      break;
  }

  return steps;
}

// =============================================================================
// MOCK TASKS BY ENTITY STATUS
// Comprehensive tasks for Corporate Tax service workflow
// =============================================================================

// Tasks for entities in "waiting" status (early stage - collecting documents)
function generateTasksForWaiting(entityId: string): EntityTask[] {
  return [
    {
      id: `${entityId}-T001`,
      title: 'Upload General Ledger',
      description: 'Upload the general ledger export for fiscal year 2025',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-05',
      category: 'document',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T002`,
      title: 'Upload Trial Balance',
      description: 'Provide the trial balance report for the fiscal year',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-05',
      category: 'document',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T003`,
      title: 'Upload Financial Statements',
      description: 'Upload audited financial statements for the fiscal year',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-10',
      category: 'document',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T004`,
      title: 'Provide Bank Statements',
      description: 'Upload all bank statements for the fiscal year',
      status: 'completed',
      priority: 'medium',
      dueDate: '2026-01-25',
      category: 'document',
      completedAt: '2026-01-24T14:30:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T005`,
      title: 'Intercompany Agreements',
      description: 'Provide documentation for intercompany loan agreements',
      status: 'blocked',
      priority: 'high',
      dueDate: '2026-02-08',
      category: 'document',
      assignee: 'Client',
      blockedReason: 'Awaiting legal review of loan terms',
    },
    {
      id: `${entityId}-T006`,
      title: 'Fixed Assets Register',
      description: 'Upload the fixed assets register with depreciation schedules',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-12',
      category: 'document',
      assignee: 'Client',
    },
  ];
}

// Tasks for entities in "received" status (documents received, processing starting)
function generateTasksForReceived(entityId: string): EntityTask[] {
  return [
    {
      id: `${entityId}-T001`,
      title: 'Upload General Ledger',
      description: 'Upload the general ledger export for fiscal year 2025',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-20',
      category: 'document',
      completedAt: '2026-01-18T10:15:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T002`,
      title: 'Upload Trial Balance',
      description: 'Provide the trial balance report for the fiscal year',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-20',
      category: 'document',
      completedAt: '2026-01-19T16:45:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T003`,
      title: 'Data Validation',
      description: 'Validate imported data against source documents',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-05',
      category: 'validation',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T004`,
      title: 'Bank Reconciliation Review',
      description: 'Review and validate bank reconciliation entries',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2026-02-08',
      category: 'review',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T005`,
      title: 'Calculate Tax Adjustments',
      description: 'Identify and calculate required tax base adjustments',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-15',
      category: 'data_entry',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T006`,
      title: 'Transfer Pricing Analysis',
      description: 'Review intercompany transactions for TP compliance',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-20',
      category: 'review',
      assignee: 'TP Specialist',
    },
    {
      id: `${entityId}-T007`,
      title: 'Upload Missing Invoices',
      description: 'Client to provide missing invoices identified during review',
      status: 'pending',
      priority: 'low',
      dueDate: '2026-02-10',
      category: 'document',
      assignee: 'Client',
    },
  ];
}

// Tasks for entities in "processing" status (calculations in progress, review stage)
function generateTasksForProcessing(entityId: string): EntityTask[] {
  return [
    {
      id: `${entityId}-T001`,
      title: 'Upload General Ledger',
      description: 'Upload the general ledger export for fiscal year 2025',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-15',
      category: 'document',
      completedAt: '2026-01-14T09:30:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T002`,
      title: 'Data Validation',
      description: 'Validate imported data against source documents',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-22',
      category: 'validation',
      completedAt: '2026-01-21T17:00:00Z',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T003`,
      title: 'Tax Base Calculation',
      description: 'Calculate corporate income tax base with all adjustments',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-28',
      category: 'data_entry',
      completedAt: '2026-01-27T15:45:00Z',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T004`,
      title: 'Senior Review - Tax Calculations',
      description: 'Senior manager review of all tax calculations',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-05',
      category: 'review',
      assignee: 'Tax Manager',
    },
    {
      id: `${entityId}-T005`,
      title: 'Compliance Check',
      description: 'Verify compliance with local tax regulations',
      status: 'in_progress',
      priority: 'high',
      dueDate: '2026-02-08',
      category: 'validation',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T006`,
      title: 'Prior Year Comparison',
      description: 'Cross-check calculations with prior year filings',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-10',
      category: 'review',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T007`,
      title: 'Quality Assurance Sign-off',
      description: 'QA review and sign-off on tax return package',
      status: 'pending',
      priority: 'high',
      dueDate: '2026-02-15',
      category: 'approval',
      assignee: 'QA Lead',
    },
    {
      id: `${entityId}-T008`,
      title: 'Client Review Meeting',
      description: 'Schedule meeting to present draft tax return to client',
      status: 'pending',
      priority: 'medium',
      dueDate: '2026-02-18',
      category: 'review',
      assignee: 'Tax Manager',
    },
  ];
}

// Tasks for entities in "completed" status (all done)
function generateTasksForCompleted(entityId: string): EntityTask[] {
  return [
    {
      id: `${entityId}-T001`,
      title: 'Upload General Ledger',
      description: 'Upload the general ledger export for fiscal year 2025',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-10',
      category: 'document',
      completedAt: '2026-01-08T10:00:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T002`,
      title: 'Data Validation',
      description: 'Validate imported data against source documents',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-15',
      category: 'validation',
      completedAt: '2026-01-14T14:30:00Z',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T003`,
      title: 'Tax Base Calculation',
      description: 'Calculate corporate income tax base with all adjustments',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-18',
      category: 'data_entry',
      completedAt: '2026-01-17T16:00:00Z',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T004`,
      title: 'Senior Review',
      description: 'Senior manager review of all tax calculations',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-22',
      category: 'review',
      completedAt: '2026-01-21T11:30:00Z',
      assignee: 'Tax Manager',
    },
    {
      id: `${entityId}-T005`,
      title: 'Quality Assurance',
      description: 'QA review and sign-off on tax return package',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-24',
      category: 'approval',
      completedAt: '2026-01-23T15:00:00Z',
      assignee: 'QA Lead',
    },
    {
      id: `${entityId}-T006`,
      title: 'Client Approval',
      description: 'Client review and approval of final tax return',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-28',
      category: 'approval',
      completedAt: '2026-01-26T09:45:00Z',
      assignee: 'Client',
    },
    {
      id: `${entityId}-T007`,
      title: 'File Tax Return',
      description: 'Submit tax return to tax authorities',
      status: 'completed',
      priority: 'high',
      dueDate: '2026-01-30',
      category: 'approval',
      completedAt: '2026-01-28T14:00:00Z',
      assignee: 'EY Tax Team',
    },
    {
      id: `${entityId}-T008`,
      title: 'Archive Documents',
      description: 'Archive all supporting documents in document management system',
      status: 'completed',
      priority: 'low',
      dueDate: '2026-02-01',
      category: 'document',
      completedAt: '2026-01-29T10:30:00Z',
      assignee: 'EY Tax Team',
    },
  ];
}

// Helper to get tasks based on entity status
function getTasksForStatus(entityId: string, status: string): EntityTask[] {
  switch (status) {
    case 'waiting':
      return generateTasksForWaiting(entityId);
    case 'received':
      return generateTasksForReceived(entityId);
    case 'processing':
      return generateTasksForProcessing(entityId);
    case 'completed':
      return generateTasksForCompleted(entityId);
    default:
      return generateTasksForWaiting(entityId);
  }
}

// Year-specific data configurations for more realistic variations
interface YearData {
  profitLoss: number;
  totalTaxCharge: number;
  citAmount: number;
  mbtAmount: number;
  nwtPrevYear: number;
  nwtCurrentYear: number;
  totalBalanceSheet: number;
  additions: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  hasLossesCarriedForward: boolean;
  lossesItems?: { year: number; amount: number; utilized: number; remaining: number }[];
  intercompanyTransactions: boolean;
  tpReport: boolean;
}

const YEAR_DATA: Record<number, YearData> = {
  2025: {
    profitLoss: 245678.9,
    totalTaxCharge: 58432.15,
    citAmount: 42156.8,
    mbtAmount: 11460.35,
    nwtPrevYear: 4815.0,
    nwtCurrentYear: 4815.0,
    totalBalanceSheet: 3250000.0,
    additions: [
      { label: 'Non-deductible expenses', amount: 12500.0 },
      { label: 'Depreciation adjustment', amount: 8750.0 },
      { label: 'Entertainment expenses', amount: 3200.0 },
    ],
    deductions: [
      { label: 'R&D tax credit', amount: 15000.0 },
      { label: 'Investment allowance', amount: 5500.0 },
    ],
    hasLossesCarriedForward: false,
    intercompanyTransactions: true,
    tpReport: true,
  },
  2024: {
    profitLoss: 178234.56,
    totalTaxCharge: 41256.78,
    citAmount: 29845.6,
    mbtAmount: 8096.18,
    nwtPrevYear: 4650.0,
    nwtCurrentYear: 4815.0,
    totalBalanceSheet: 2890000.0,
    additions: [
      { label: 'Non-deductible expenses', amount: 9800.0 },
      { label: 'Depreciation adjustment', amount: 6500.0 },
    ],
    deductions: [{ label: 'R&D tax credit', amount: 12000.0 }],
    hasLossesCarriedForward: false,
    intercompanyTransactions: true,
    tpReport: false,
  },
  2023: {
    profitLoss: -89456.32,
    totalTaxCharge: 4650.0,
    citAmount: 0.0,
    mbtAmount: 0.0,
    nwtPrevYear: 4500.0,
    nwtCurrentYear: 4650.0,
    totalBalanceSheet: 2450000.0,
    additions: [{ label: 'Non-deductible interest', amount: 4200.0 }],
    deductions: [],
    hasLossesCarriedForward: true,
    lossesItems: [{ year: 2023, amount: 89456.32, utilized: 0, remaining: 89456.32 }],
    intercompanyTransactions: true,
    tpReport: false,
  },
  2022: {
    profitLoss: -156789.45,
    totalTaxCharge: 4500.0,
    citAmount: 0.0,
    mbtAmount: 0.0,
    nwtPrevYear: 4350.0,
    nwtCurrentYear: 4500.0,
    totalBalanceSheet: 2120000.0,
    additions: [
      { label: 'Provision for bad debts', amount: 25000.0 },
      { label: 'Non-deductible interest', amount: 8500.0 },
    ],
    deductions: [],
    hasLossesCarriedForward: true,
    lossesItems: [{ year: 2022, amount: 156789.45, utilized: 0, remaining: 156789.45 }],
    intercompanyTransactions: false,
    tpReport: false,
  },
};

// Helper to generate tax report for a specific year with realistic data
function generateTaxReportForYear(
  baseReport: EntityTaxReport,
  year: number,
  taxId: string,
  taxOffice: string
): EntityTaxReport {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const yearData = YEAR_DATA[year] || YEAR_DATA[2025];

  const taxBaseBeforeTLCF =
    yearData.profitLoss +
    yearData.additions.reduce((sum, a) => sum + a.amount, 0) -
    yearData.deductions.reduce((sum, d) => sum + d.amount, 0);

  return {
    ...baseReport,
    taxId,
    taxOffice,
    taxPeriodStart: startDate,
    taxPeriodEnd: endDate,
    fiscalYear: year,
    estimatedTaxCharge: {
      total: {
        label: 'TOTAL',
        amount: yearData.totalTaxCharge,
        perBooks: yearData.totalTaxCharge * 1.15,
        difference: yearData.totalTaxCharge * 0.15,
      },
      corporateIncomeTax: {
        label: 'Corporate Income Tax',
        amount: yearData.citAmount,
        perBooks: yearData.citAmount,
        difference: 0,
      },
      municipalBusinessTax: {
        label: 'Municipal Business Tax',
        amount: yearData.mbtAmount,
        perBooks: yearData.mbtAmount,
        difference: 0,
      },
      netWorthTax2023: {
        label: `Net Worth Tax ${year - 1}`,
        amount: yearData.nwtPrevYear,
        perBooks: yearData.nwtPrevYear,
        difference: 0,
      },
      netWorthTax2024: {
        label: `Net Worth Tax ${year}`,
        amount: yearData.nwtCurrentYear,
        perBooks: yearData.nwtCurrentYear,
        difference: 0,
      },
    },
    financingActivity: {
      ...baseReport.financingActivity,
      intercompanyTransactions: yearData.intercompanyTransactions,
      tpReport: yearData.tpReport,
    },
    corporateIncomeTax: {
      adjustedIncome: yearData.profitLoss,
      taxableIncome: Math.max(0, taxBaseBeforeTLCF),
      taxFollowingTaxTable: yearData.citAmount * 0.95,
      employmentTaxSurcharge: yearData.citAmount * 0.05,
      citLiabilityBeforeCredits: yearData.citAmount,
      taxCredits: 0,
      citLiabilityAfterCredits: yearData.citAmount,
    },
    municipalBusinessTax: {
      adjustedIncome: yearData.profitLoss,
      municipalBusinessTaxRebate: yearData.profitLoss < 0 ? yearData.profitLoss * 0.1 : 0,
      taxableIncome: Math.max(0, taxBaseBeforeTLCF),
      taxableIncomeRounded: Math.round(Math.max(0, taxBaseBeforeTLCF) / 100) * 100,
      mbtLiability: yearData.mbtAmount,
      mbtRate: 6.75,
    },
    netWorthTax: {
      taxDueBasedOnUnitaryValue: yearData.nwtCurrentYear * 0.5,
      taxableWorthAt1January: yearData.totalBalanceSheet * 0.8,
      nwt: yearData.nwtCurrentYear * 0.5,
      minimumNetWorthTax: yearData.nwtCurrentYear,
      totalBalanceSheet: yearData.totalBalanceSheet,
      minimumNWT: yearData.nwtCurrentYear,
      reductionCitAfterCredits: 0,
      minimumNWTAfterDeduction: yearData.nwtCurrentYear,
      highestNWTTax: yearData.nwtCurrentYear,
      finalNWTLiability: yearData.nwtCurrentYear,
    },
    taxBase: {
      profitLoss: yearData.profitLoss,
      taxBaseBeforeTLCF: taxBaseBeforeTLCF,
      taxBaseAfterTLCF: Math.max(0, taxBaseBeforeTLCF),
      additions: yearData.additions,
      deductions: yearData.deductions,
    },
    taxLossesCarriedForward: {
      available: yearData.hasLossesCarriedForward,
      items: yearData.lossesItems,
    },
  };
}

// Mock Tax Report based on the image provided
const MOCK_TAX_REPORT_LU: EntityTaxReport = {
  taxId: '2015 0000 005',
  taxOffice: 'Luxembourg Tax Office',
  taxPeriodStart: '2022-07-01',
  taxPeriodEnd: '2023-06-30',
  fiscalYear: 2023,

  estimatedTaxCharge: {
    total: { label: 'TOTAL', amount: 535.0, perBooks: 4514.0, difference: 4979.0 },
    corporateIncomeTax: {
      label: 'Corporate Income Tax',
      amount: 0.0,
      perBooks: 0.0,
      difference: 0.0,
    },
    municipalBusinessTax: {
      label: 'Municipal Business Tax',
      amount: 0.0,
      perBooks: 0.0,
      difference: 0.0,
    },
    netWorthTax2023: {
      label: 'Net Worth Tax 2023',
      amount: 535.0,
      perBooks: 4914.0,
      difference: 0.0,
    },
    netWorthTax2024: {
      label: 'Net Worth Tax 2024',
      amount: 4815.0,
      perBooks: 0.0,
      difference: 0.0,
    },
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
    taxableIncome: 0.0,
    taxFollowingTaxTable: 0.0,
    employmentTaxSurcharge: 0.0,
    citLiabilityBeforeCredits: 0.0,
    taxCredits: 0.0,
    citLiabilityAfterCredits: 0.0,
  },

  municipalBusinessTax: {
    adjustedIncome: -166813.37,
    municipalBusinessTaxRebate: -37500.0,
    taxableIncome: 0.0,
    taxableIncomeRounded: 0.0,
    mbtLiability: 0.0,
    mbtRate: 0.0,
  },

  netWorthTax: {
    taxDueBasedOnUnitaryValue: 0.0,
    taxableWorthAt1January: 0.0,
    nwt: 0.0,
    minimumNetWorthTax: 4815.0,
    totalBalanceSheet: 2679647.96,
    minimumNWT: 4815.0,
    reductionCitAfterCredits: 0.0,
    minimumNWTAfterDeduction: 4815.0,
    highestNWTTax: 4815.0,
    finalNWTLiability: 4815.0,
  },

  taxBase: {
    profitLoss: -171713.26,
    taxBaseBeforeTLCF: -166818.37,
    taxBaseAfterTLCF: -166818.37,
    additions: [{ label: 'NWT', amount: 4914.0 }],
    deductions: [{ label: 'Amount', amount: 14.2 }],
  },

  taxLossesCarriedForward: {
    available: false,
  },
};

// Base tax report for France entities
const MOCK_TAX_REPORT_FR_BASE: EntityTaxReport = {
  ...MOCK_TAX_REPORT_LU,
  taxId: '2024 1234 567',
  taxOffice: 'Paris Tax Office - Service des Impôts des Entreprises',
  taxPeriodStart: '2025-01-01',
  taxPeriodEnd: '2025-12-31',
  fiscalYear: 2025,
};

// Helper to generate tax reports for multiple years
function generateMultiYearTaxReports(
  taxIdPrefix: string,
  taxOffice: string
): {
  reports: Record<number, EntityTaxReport>;
  periods: { year: number; label: string; startDate: string; endDate: string }[];
} {
  const years = [2025, 2024, 2023, 2022];
  const reports: Record<number, EntityTaxReport> = {};
  const periods: { year: number; label: string; startDate: string; endDate: string }[] = [];

  years.forEach(year => {
    reports[year] = generateTaxReportForYear(
      MOCK_TAX_REPORT_LU,
      year,
      `${year} ${taxIdPrefix}`,
      taxOffice
    );
    periods.push({
      year,
      label: String(year),
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    });
  });

  return { reports, periods };
}

// Generate tax reports for each entity
const CCP5_FR_DATA = generateMultiYearTaxReports(
  '1234 567',
  'Paris Tax Office - Service des Impôts des Entreprises'
);
const CCP5_DE_DATA = generateMultiYearTaxReports('8765 432', 'Finanzamt München');
const CCP5_NL_DATA = generateMultiYearTaxReports('5678 901', 'Belastingdienst Amsterdam');
const EPISO6_LU_DATA = generateMultiYearTaxReports('0000 005', 'Luxembourg Tax Office');
const EPISO6_ES_DATA = generateMultiYearTaxReports('ES 789456', 'Agencia Tributaria - Madrid');
const EPISO6_IT_DATA = generateMultiYearTaxReports('IT 456123', 'Agenzia delle Entrate - Milano');
const EPISO6_BE_DATA = generateMultiYearTaxReports('BE 321654', 'SPF Finances - Brussels');

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
    tasks: getTasksForStatus('CCP5-FR', 'waiting'),
    taxReport: CCP5_FR_DATA.reports[2025],
    taxReportsByYear: CCP5_FR_DATA.reports,
    availableTaxPeriods: CCP5_FR_DATA.periods,
    workflowSteps: generateWorkflowSteps('waiting'),
    isApproved: false,
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
    tasks: getTasksForStatus('CCP5-DE', 'processing'),
    taxReport: CCP5_DE_DATA.reports[2025],
    taxReportsByYear: CCP5_DE_DATA.reports,
    availableTaxPeriods: CCP5_DE_DATA.periods,
    workflowSteps: generateWorkflowSteps('processing'),
    isApproved: false,
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
    tasks: getTasksForStatus('CCP5-NL', 'completed'),
    taxReport: CCP5_NL_DATA.reports[2025],
    taxReportsByYear: CCP5_NL_DATA.reports,
    availableTaxPeriods: CCP5_NL_DATA.periods,
    workflowSteps: generateWorkflowSteps('completed'),
    isApproved: true,
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
    tasks: getTasksForStatus('EPISO6-LU', 'processing'),
    taxReport: EPISO6_LU_DATA.reports[2025],
    taxReportsByYear: EPISO6_LU_DATA.reports,
    availableTaxPeriods: EPISO6_LU_DATA.periods,
    workflowSteps: generateWorkflowSteps('processing'),
    isApproved: false,
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
    tasks: getTasksForStatus('EPISO6-ES', 'waiting'),
    taxReport: EPISO6_ES_DATA.reports[2025],
    taxReportsByYear: EPISO6_ES_DATA.reports,
    availableTaxPeriods: EPISO6_ES_DATA.periods,
    workflowSteps: generateWorkflowSteps('waiting'),
    isApproved: false,
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
    tasks: getTasksForStatus('EPISO6-IT', 'received'),
    taxReport: EPISO6_IT_DATA.reports[2025],
    taxReportsByYear: EPISO6_IT_DATA.reports,
    availableTaxPeriods: EPISO6_IT_DATA.periods,
    workflowSteps: generateWorkflowSteps('received'),
    isApproved: false,
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
    tasks: getTasksForStatus('EPISO6-BE', 'received'),
    taxReport: EPISO6_BE_DATA.reports[2025],
    taxReportsByYear: EPISO6_BE_DATA.reports,
    availableTaxPeriods: EPISO6_BE_DATA.periods,
    workflowSteps: generateWorkflowSteps('received'),
    isApproved: false,
  },
};

// Helper to get entity detail by ID (with fallback)
export function getEntityDetail(entityId: string): EntityDetail | null {
  return MOCK_ENTITY_DETAILS[entityId] || null;
}
