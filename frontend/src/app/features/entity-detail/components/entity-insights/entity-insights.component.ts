import { Component, input, signal, computed, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-angular';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

type SubTab = 'tax-attributes' | 'holding-activity';

interface TaxAttributeRow {
  name: string;
  years: Record<number, boolean | null>;
}

interface TaxLossRow {
  year: number;
  totalTaxLosses: number;
  recapture: number;
  status: 'active' | 'closed';
}

interface ParticipationRow {
  year: number;
  residency: string;
  name: string;
  acquisitionPrice: number;
  totalValueAdjustments: number;
  bookValue: number;
  totalRecapture: number;
  isTotal?: boolean;
  isExpanded?: boolean;
  children?: ParticipationRow[];
}

@Component({
  selector: 'app-entity-insights',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="insights-container">
      <!-- Sub-tabs -->
      <div class="sub-tabs">
        <button
          class="sub-tab"
          [class.sub-tab--active]="activeSubTab() === 'tax-attributes'"
          (click)="setSubTab('tax-attributes')"
        >
          Tax attributes
        </button>
        <button
          class="sub-tab"
          [class.sub-tab--active]="activeSubTab() === 'holding-activity'"
          (click)="setSubTab('holding-activity')"
        >
          Holding activity
        </button>
      </div>

      <!-- Filters Row -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Account name</label>
          <select [(ngModel)]="filters.accountName">
            <option value="All">All</option>
            <option value="France SPV">France SPV</option>
            <option value="Germany PropCo">Germany PropCo</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Fund</label>
          <select [(ngModel)]="filters.fund">
            <option value="All">All</option>
            <option value="Fund I">Fund I</option>
            <option value="Fund II">Fund II</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Legal Entity</label>
          <select [(ngModel)]="filters.legalEntity">
            <option value="Galaxy Test">Galaxy Test</option>
            <option value="All">All</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Year</label>
          <select [(ngModel)]="filters.year">
            <option value="2021">2021</option>
            <option value="2022">2022</option>
            <option value="2023">2023</option>
            <option value="All">All</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Period</label>
          <select [(ngModel)]="filters.period">
            <option value="All">All</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>
      </div>

      @if (activeSubTab() === 'tax-attributes') {
        <!-- Tax Attributes KPIs -->
        <div class="kpi-row">
          <div class="kpi-card kpi-card--dark">
            <span class="kpi-label">Commercial result</span>
            <span class="kpi-value">65,00<span class="kpi-unit">Mn</span></span>
          </div>
          <div class="kpi-card kpi-card--dark">
            <span class="kpi-label">Taxable result</span>
            <span class="kpi-value">5,00<span class="kpi-unit">Mn</span></span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Corporate taxes</span>
            <span class="kpi-value">0,00</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Net wealth tax</span>
            <span class="kpi-value">4,82<span class="kpi-unit">t</span></span>
          </div>
          <div class="kpi-card kpi-card--highlight">
            <span class="kpi-label">Total tax losses</span>
            <span class="kpi-value">11,50<span class="kpi-unit">Mn</span></span>
          </div>
          <div class="kpi-card kpi-card--highlight">
            <span class="kpi-label">Total recapture</span>
            <span class="kpi-value">7,50<span class="kpi-unit">Mn</span></span>
          </div>
        </div>

        <div class="currency-note">Values are shown in EUR-0.8B-USD</div>

        <!-- Tax Attributes Content -->
        <div class="content-grid">
          <!-- Left Column -->
          <div class="content-left">
            <!-- Tax Attributes Table -->
            <div class="data-card">
              <h4 class="card-title">Tax attributes</h4>
              <table class="attributes-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>2020</th>
                    <th>2021</th>
                    <th>2022</th>
                    <th>2023</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of taxAttributes; track row.name) {
                    <tr>
                      <td class="attr-name">{{ row.name }}</td>
                      @for (year of [2020, 2021, 2022, 2023]; track year) {
                        <td class="attr-value">
                          @if (row.years[year] === true) {
                            <lucide-icon [img]="Check" [size]="14" class="icon-check"></lucide-icon>
                          } @else if (row.years[year] === false) {
                            <lucide-icon [img]="X" [size]="14" class="icon-x"></lucide-icon>
                          } @else {
                            <span class="na">-</span>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Commercial vs Taxable Chart -->
            <div class="data-card">
              <h4 class="card-title">Commercial vs Taxable result (before TLCF)</h4>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Commercial Profit</span>
                <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Taxable Profit</span>
              </div>
              <canvas #commercialChart></canvas>
            </div>
          </div>

          <!-- Right Column -->
          <div class="content-right">
            <!-- Tax Losses Chart & Table -->
            <div class="data-card">
              <h4 class="card-title">Total tax losses vs total recaptures</h4>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot legend-dot--yellow-area"></span> Total Recapture</span>
                <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Total Tax Losses</span>
              </div>
              <div class="chart-with-table">
                <div class="chart-container">
                  <canvas #taxLossesChart></canvas>
                </div>
                <table class="mini-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Total Tax Losses</th>
                      <th>Recapture</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of taxLossData; track row.year) {
                      <tr>
                        <td>{{ row.year }}</td>
                        <td>{{ formatNumber(row.totalTaxLosses) }}</td>
                        <td>{{ formatNumber(row.recapture) }}</td>
                        <td>
                          <span class="status-dot" [class.status-dot--active]="row.status === 'active'"></span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bottom Charts Row -->
            <div class="charts-row">
              <div class="data-card data-card--half">
                <h4 class="card-title">Corporate taxes vs tax provision (after TLCF)</h4>
                <div class="chart-legend">
                  <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Tax Provision</span>
                  <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Corporate tax due</span>
                </div>
                <canvas #corporateTaxChart></canvas>
              </div>
              <div class="data-card data-card--half">
                <h4 class="card-title">Net wealth tax vs tax provision</h4>
                <div class="chart-legend">
                  <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> NWT Provision</span>
                  <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Net Wealth Tax</span>
                </div>
                <canvas #netWealthChart></canvas>
              </div>
            </div>
          </div>
        </div>
      }

      @if (activeSubTab() === 'holding-activity') {
        <!-- Holding Activity KPIs -->
        <div class="kpi-row">
          <div class="kpi-card kpi-card--dark">
            <span class="kpi-label">Qualifying participation</span>
            <span class="kpi-value">3</span>
          </div>
          <div class="kpi-card kpi-card--dark">
            <span class="kpi-label">Holding activity</span>
            <span class="kpi-value">459,11<span class="kpi-unit">...</span></span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Allocated equity</span>
            <span class="kpi-value">73,46<span class="kpi-unit">Mn</span></span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Allocated debt</span>
            <span class="kpi-value">385,65<span class="kpi-unit">...</span></span>
          </div>
          <div class="kpi-card kpi-card--highlight">
            <span class="kpi-label">Dividend income</span>
            <span class="kpi-value">60,00<span class="kpi-unit">Mn</span></span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">Capital gains</span>
            <span class="kpi-value">0,00</span>
          </div>
        </div>

        <!-- Toggle Buttons -->
        <div class="toggle-buttons">
          <button
            class="toggle-btn"
            [class.toggle-btn--active]="holdingViewMode() === 'total'"
            (click)="setHoldingViewMode('total')"
          >
            Total Values
          </button>
          <button
            class="toggle-btn"
            [class.toggle-btn--active]="holdingViewMode() === 'year'"
            (click)="setHoldingViewMode('year')"
          >
            Year Values
          </button>
        </div>

        <!-- Holding Activity Content -->
        <div class="holding-content">
          <!-- Participation Table -->
          <div class="data-card participation-card">
            <h4 class="card-title">Participation - Total values</h4>
            <table class="participation-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Year</th>
                  <th>Residency</th>
                  <th>Name</th>
                  <th>Acquisition Price</th>
                  <th>Total Value Adjustments</th>
                  <th>Book Value</th>
                  <th>Total Recapture</th>
                </tr>
              </thead>
              <tbody>
                @for (group of participationData; track group.year) {
                  <!-- Year Group Header -->
                  <tr class="group-header" (click)="toggleGroup(group)">
                    <td>
                      <lucide-icon
                        [img]="group.isExpanded ? ChevronDown : ChevronRight"
                        [size]="14"
                      ></lucide-icon>
                    </td>
                    <td class="year-cell">{{ group.year }}</td>
                    <td colspan="2" class="total-label">Totalt</td>
                    <td class="number-cell">{{ formatCurrency(group.acquisitionPrice) }}</td>
                    <td class="number-cell">{{ formatCurrency(group.totalValueAdjustments) }}</td>
                    <td class="number-cell">{{ formatCurrency(group.bookValue) }}</td>
                    <td class="number-cell">{{ formatCurrency(group.totalRecapture) }}</td>
                  </tr>
                  <!-- Children rows -->
                  @if (group.isExpanded && group.children) {
                    @for (child of group.children; track child.name) {
                      <tr class="child-row">
                        <td></td>
                        <td></td>
                        <td class="residency-cell">
                          <span class="flag">{{ getFlag(child.residency) }}</span>
                          {{ child.residency }}
                        </td>
                        <td>{{ child.name }}</td>
                        <td class="number-cell">{{ formatCurrency(child.acquisitionPrice) }}</td>
                        <td class="number-cell">{{ formatCurrency(child.totalValueAdjustments) }}</td>
                        <td class="number-cell">{{ formatCurrency(child.bookValue) }}</td>
                        <td class="number-cell">{{ formatCurrency(child.totalRecapture) }}</td>
                      </tr>
                    }
                  }
                }
              </tbody>
            </table>
          </div>

          <!-- Holding Charts -->
          <div class="holding-charts">
            <div class="data-card">
              <h4 class="card-title">Financing of participation</h4>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Equity</span>
                <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Debt</span>
              </div>
              <canvas #financingChart></canvas>
            </div>
            <div class="data-card">
              <h4 class="card-title">Recapture by participation</h4>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span> Total Value Adjustment</span>
                <span class="legend-item"><span class="legend-dot legend-dot--gray"></span> Interest And Other Expenses</span>
                <span class="legend-item"><span class="legend-dot legend-dot--dark"></span> Total Recapture</span>
              </div>
              <canvas #recaptureChart></canvas>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .insights-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Sub-tabs */
    .sub-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid #e5e7eb;
    }

    .sub-tab {
      padding: 12px 24px;
      background: transparent;
      border: none;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;

      &:hover {
        color: #2E2E38;
      }

      &--active {
        color: #2E2E38;
        font-weight: 600;

        &::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #FFE600;
        }
      }
    }

    /* Filters */
    .filters-row {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      background: #2E2E38;
      border-radius: 8px;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;

      label {
        font-size: 11px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      select {
        padding: 8px 12px;
        background: #1f1f24;
        border: 1px solid #404048;
        border-radius: 6px;
        color: white;
        font-size: 13px;
        cursor: pointer;

        &:focus {
          outline: none;
          border-color: #FFE600;
        }
      }
    }

    /* KPIs */
    .kpi-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .kpi-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px 18px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      min-width: 120px;

      &--dark {
        background: #2E2E38;
        border-color: #2E2E38;

        .kpi-label {
          color: #9ca3af;
        }

        .kpi-value {
          color: white;
        }
      }

      &--highlight {
        background: #FFF9E0;
        border-color: #FFE600;

        .kpi-value {
          color: #92400e;
        }
      }
    }

    .kpi-label {
      font-size: 11px;
      color: #6b7280;
    }

    .kpi-value {
      font-size: 18px;
      font-weight: 700;
      color: #2E2E38;
    }

    .kpi-unit {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.7;
    }

    .currency-note {
      padding: 8px 16px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
      color: #6b7280;
      text-align: right;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 16px;
    }

    .content-left, .content-right {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Data Cards */
    .data-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 16px;

      &--half {
        flex: 1;
      }
    }

    .card-title {
      margin: 0 0 12px 0;
      font-size: 13px;
      font-weight: 600;
      color: #2E2E38;
    }

    /* Chart Legend */
    .chart-legend {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #6b7280;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;

      &--yellow {
        background: #FFE600;
      }

      &--yellow-area {
        background: linear-gradient(180deg, rgba(255, 230, 0, 0.6) 0%, rgba(255, 230, 0, 0.2) 100%);
      }

      &--gray {
        background: #9ca3af;
      }

      &--dark {
        background: #2E2E38;
      }
    }

    /* Attributes Table */
    .attributes-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th, td {
        padding: 8px 12px;
        text-align: center;
        border-bottom: 1px solid #f3f4f6;
      }

      th {
        font-weight: 600;
        color: #6b7280;
        font-size: 11px;
      }

      .attr-name {
        text-align: left;
        font-weight: 500;
        color: #2E2E38;
      }

      .icon-check {
        color: #10b981;
      }

      .icon-x {
        color: #ef4444;
      }

      .na {
        color: #d1d5db;
      }
    }

    /* Mini Table */
    .chart-with-table {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 16px;
      align-items: start;
    }

    .chart-container {
      min-height: 200px;
    }

    .mini-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;

      th, td {
        padding: 6px 8px;
        text-align: right;
        border-bottom: 1px solid #f3f4f6;
      }

      th {
        font-weight: 600;
        color: #6b7280;
        font-size: 10px;
        text-align: right;

        &:first-child {
          text-align: left;
        }
      }

      td:first-child {
        text-align: left;
        font-weight: 500;
      }
    }

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;

      &--active {
        background: #10b981;
      }
    }

    /* Charts Row */
    .charts-row {
      display: flex;
      gap: 16px;
    }

    /* Toggle Buttons */
    .toggle-buttons {
      display: flex;
      gap: 0;
      background: #f3f4f6;
      border-radius: 8px;
      padding: 4px;
      width: fit-content;
    }

    .toggle-btn {
      padding: 8px 20px;
      background: transparent;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;

      &--active {
        background: white;
        color: #2E2E38;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    }

    /* Holding Content */
    .holding-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .participation-card {
      overflow-x: auto;
    }

    /* Participation Table */
    .participation-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;

      th, td {
        padding: 10px 12px;
        text-align: left;
        border-bottom: 1px solid #f3f4f6;
      }

      th {
        font-weight: 600;
        color: #6b7280;
        font-size: 11px;
        background: #f9fafb;
      }

      .group-header {
        background: #fafafa;
        cursor: pointer;

        &:hover {
          background: #f3f4f6;
        }

        td {
          font-weight: 600;
        }
      }

      .child-row {
        td {
          padding-left: 24px;
        }
      }

      .year-cell {
        font-weight: 600;
        color: #2E2E38;
      }

      .total-label {
        font-weight: 600;
        color: #2E2E38;
      }

      .number-cell {
        text-align: right;
        font-family: 'SF Mono', monospace;
      }

      .residency-cell {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .flag {
        font-size: 14px;
      }
    }

    /* Holding Charts */
    .holding-charts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    canvas {
      max-height: 200px;
    }

    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .chart-with-table {
        grid-template-columns: 1fr;
      }

      .charts-row {
        flex-direction: column;
      }

      .holding-charts {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class EntityInsightsComponent implements OnInit, AfterViewInit {
  @ViewChild('commercialChart') commercialChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('taxLossesChart') taxLossesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('corporateTaxChart') corporateTaxChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('netWealthChart') netWealthChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('financingChart') financingChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('recaptureChart') recaptureChartRef!: ElementRef<HTMLCanvasElement>;

  entityId = input.required<string>();
  entityName = input.required<string>();

  readonly Check = Check;
  readonly X = X;
  readonly ChevronDown = ChevronDown;
  readonly ChevronRight = ChevronRight;

  activeSubTab = signal<SubTab>('tax-attributes');
  holdingViewMode = signal<'total' | 'year'>('total');

  filters = {
    accountName: 'All',
    fund: 'All',
    legalEntity: 'Galaxy Test',
    year: '2021',
    period: 'All',
  };

  // Tax Attributes Data
  taxAttributes: TaxAttributeRow[] = [
    { name: 'Intercompany Transactions', years: { 2020: true, 2021: true, 2022: true, 2023: true } },
    { name: 'Advance Tax Agreement', years: { 2020: false, 2021: true, 2022: true, 2023: true } },
    { name: 'Fiscal Unity', years: { 2020: false, 2021: false, 2022: true, 2023: true } },
    { name: 'Functional Currency', years: { 2020: false, 2021: false, 2022: false, 2023: true } },
  ];

  taxLossData: TaxLossRow[] = [
    { year: 2020, totalTaxLosses: 12500, recapture: 6500, status: 'closed' },
    { year: 2021, totalTaxLosses: 11900, recapture: 9000, status: 'closed' },
    { year: 2022, totalTaxLosses: 22538, recapture: 10500, status: 'active' },
    { year: 2023, totalTaxLosses: 1337, recapture: 7004, status: 'active' },
  ];

  // Participation Data
  participationData: ParticipationRow[] = [
    {
      year: 2020,
      residency: '',
      name: '',
      acquisitionPrice: 1699308,
      totalValueAdjustments: 12680,
      bookValue: 1626427664,
      totalRecapture: 24506171,
      isExpanded: false,
      children: [
        { year: 2020, residency: 'France', name: 'Galaxy Holdings France SAS', acquisitionPrice: 600000, totalValueAdjustments: 6500, bookValue: 513500000, totalRecapture: 6500000 },
        { year: 2020, residency: 'Germany', name: 'Galaxy Deutschland GmbH', acquisitionPrice: 10000, totalValueAdjustments: 4500, bookValue: 5500000, totalRecapture: 4400001 },
        { year: 2020, residency: 'Luxembourg', name: 'Galaxy Finance Luxembourg S.à r.l.', acquisitionPrice: 20000, totalValueAdjustments: 5000, bookValue: 18000000, totalRecapture: 2100001 },
      ],
    },
    {
      year: 2021,
      residency: '',
      name: '',
      acquisitionPrice: 459108,
      totalValueAdjustments: 6180,
      bookValue: 482927707,
      totalRecapture: 7500001,
      isExpanded: true,
      children: [
        { year: 2021, residency: 'France', name: 'Galaxy Holdings France SAS', acquisitionPrice: 458623, totalValueAdjustments: 0, bookValue: 482421004, totalRecapture: 0 },
        { year: 2021, residency: 'Germany', name: 'Galaxy Deutschland GmbH', acquisitionPrice: 8825, totalValueAdjustments: 3973, bookValue: 4855951, totalRecapture: 4500001 },
        { year: 2021, residency: 'Luxembourg', name: 'Galaxy Finance Luxembourg S.à r.l.', acquisitionPrice: 27650, totalValueAdjustments: 2207, bookValue: 15450750, totalRecapture: 3000001 },
      ],
    },
    {
      year: 2022,
      residency: '',
      name: '',
      acquisitionPrice: 220000,
      totalValueAdjustments: 0,
      bookValue: 219959991,
      totalRecapture: 3502061,
      isExpanded: false,
      children: [
        { year: 2022, residency: 'Spain', name: 'Athletico Holdco, S.L.', acquisitionPrice: 220000, totalValueAdjustments: 0, bookValue: 219959991, totalRecapture: 3502061 },
      ],
    },
    {
      year: 2023,
      residency: '',
      name: '',
      acquisitionPrice: 440000,
      totalValueAdjustments: 0,
      bookValue: 439999971,
      totalRecapture: 7004121,
      isExpanded: false,
      children: [
        { year: 2023, residency: 'Spain', name: 'Athletico Holdco, S.L.', acquisitionPrice: 440000, totalValueAdjustments: 0, bookValue: 439585971, totalRecapture: 7004121 },
      ],
    },
  ];

  private charts: Chart[] = [];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 100);
  }

  setSubTab(tab: SubTab): void {
    this.activeSubTab.set(tab);
    setTimeout(() => this.initCharts(), 100);
  }

  setHoldingViewMode(mode: 'total' | 'year'): void {
    this.holdingViewMode.set(mode);
  }

  toggleGroup(group: ParticipationRow): void {
    group.isExpanded = !group.isExpanded;
  }

  getFlag(residency: string): string {
    const flags: Record<string, string> = {
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Luxembourg': '🇱🇺',
      'Spain': '🇪🇸',
    };
    return flags[residency] || '🏳️';
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  formatCurrency(value: number): string {
    if (value >= 1000000) {
      return new Intl.NumberFormat('fr-FR').format(value) + ' €';
    }
    return new Intl.NumberFormat('fr-FR').format(value) + ' €';
  }

  private initCharts(): void {
    // Destroy existing charts
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    if (this.activeSubTab() === 'tax-attributes') {
      this.initTaxAttributeCharts();
    } else {
      this.initHoldingCharts();
    }
  }

  private initTaxAttributeCharts(): void {
    // Commercial vs Taxable Chart
    if (this.commercialChartRef?.nativeElement) {
      const ctx = this.commercialChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['2020', '2021', '2022', '2023'],
            datasets: [
              {
                label: 'Commercial Profit',
                data: [100, 65, 50, 0],
                backgroundColor: '#9ca3af',
                borderRadius: 4,
              },
              {
                label: 'Taxable Profit',
                data: [-12, 8, 1, 0],
                backgroundColor: '#FFE600',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
              },
              x: {
                grid: { display: false },
              },
            },
          },
        }));
      }
    }

    // Tax Losses Chart
    if (this.taxLossesChartRef?.nativeElement) {
      const ctx = this.taxLossesChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['2020', '2021', '2022', '2023'],
            datasets: [
              {
                type: 'line',
                label: 'Total Recapture',
                data: [6.5, 12, 22, 13],
                borderColor: '#FFE600',
                backgroundColor: 'rgba(255, 230, 0, 0.2)',
                fill: true,
                tension: 0.4,
              },
              {
                type: 'bar',
                label: 'Total Tax Losses',
                data: [9, 12, 12, 11],
                backgroundColor: '#6b7280',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                title: { display: true, text: 'Mn' },
              },
              x: {
                grid: { display: false },
              },
            },
          },
        }));
      }
    }

    // Corporate Tax Chart
    if (this.corporateTaxChartRef?.nativeElement) {
      const ctx = this.corporateTaxChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['2020', '2021', '2022', '2023'],
            datasets: [
              {
                label: 'Tax Provision',
                data: [0.4, 0, 0, 0.6],
                backgroundColor: '#FFE600',
                borderRadius: 4,
              },
              {
                label: 'Corporate tax due',
                data: [-10, 0, -0.1, 0],
                backgroundColor: '#9ca3af',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                grid: { color: '#f3f4f6' },
                title: { display: true, text: 'Mn' },
              },
              x: { grid: { display: false } },
            },
          },
        }));
      }
    }

    // Net Wealth Chart
    if (this.netWealthChartRef?.nativeElement) {
      const ctx = this.netWealthChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['2020', '2021', '2022', '2023'],
            datasets: [
              {
                label: 'NWT Provision',
                data: [5, 6, 12, 14.4],
                backgroundColor: '#9ca3af',
                borderRadius: 4,
              },
              {
                label: 'Net Wealth Tax',
                data: [0.88, 3.21, 0.29, 4.82],
                backgroundColor: '#FFE600',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                title: { display: true, text: 't' },
              },
              x: { grid: { display: false } },
            },
          },
        }));
      }
    }
  }

  private initHoldingCharts(): void {
    // Financing Chart (Horizontal stacked bar)
    if (this.financingChartRef?.nativeElement) {
      const ctx = this.financingChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['2020', '2021', '2022', '2023'],
            datasets: [
              {
                label: 'Equity',
                data: [16, 18, 15, 15],
                backgroundColor: '#6b7280',
                borderRadius: 4,
              },
              {
                label: 'Debt',
                data: [84, 84, 85, 85],
                backgroundColor: '#FFE600',
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: {
                stacked: true,
                max: 100,
                grid: { color: '#f3f4f6' },
                ticks: { callback: (value) => value + '%' },
              },
              y: {
                stacked: true,
                grid: { display: false },
              },
            },
          },
        }));
      }
    }

    // Recapture Chart
    if (this.recaptureChartRef?.nativeElement) {
      const ctx = this.recaptureChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.push(new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Galaxy Deutschland', 'Galaxy Finance Luxembourg S.à r.l.', 'Galaxy Holdings France SAS'],
            datasets: [
              {
                label: 'Total Value Adjustment',
                data: [4.5, 3, 0],
                backgroundColor: '#FFE600',
                borderRadius: 4,
              },
              {
                label: 'Interest And Other Expenses',
                data: [0, 2.2, 1],
                backgroundColor: '#9ca3af',
                borderRadius: 4,
              },
              {
                label: 'Total Recapture',
                data: [0, 0, 0.8],
                backgroundColor: '#2E2E38',
                borderRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: '#f3f4f6' },
                title: { display: true, text: 'Mn' },
              },
              x: { grid: { display: false } },
            },
          },
        }));
      }
    }
  }
}
