// =============================================================================
// Widget System - Models & Interfaces
// =============================================================================

export interface WidgetConfig {
  id: string;
  name: string;
  icon: string;
  description?: string;
  defaultVisible: boolean;
  minWidth?: number;
  category?: string;
}

export interface WidgetState {
  id: string;
  visible: boolean;
  order: number;
  column?: number;
}

export interface WidgetLayout {
  pageId: string;
  widgets: WidgetState[];
  columns: number;
  lastUpdated: string;
}

export interface WidgetDropEvent {
  widgetId: string;
  previousIndex: number;
  currentIndex: number;
  previousColumn?: number;
  currentColumn?: number;
}

export const WIDGET_CATEGORIES = {
  SUMMARY: 'Summary',
  CALCULATIONS: 'Tax Calculations',
  COMPLIANCE: 'Compliance & Attributes',
} as const;

export type WidgetCategory = (typeof WIDGET_CATEGORIES)[keyof typeof WIDGET_CATEGORIES];
