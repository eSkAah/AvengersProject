// =============================================================================
// Widget System - Service for State Management & Persistence
// =============================================================================

import { Injectable, signal, computed } from '@angular/core';
import { WidgetConfig, WidgetState, WidgetLayout } from './widget.models';

const STORAGE_KEY_PREFIX = 'ey_widget_layout_';

@Injectable({
  providedIn: 'root',
})
export class WidgetService {
  private currentPageId = signal<string>('');
  private widgetRegistry = signal<Map<string, WidgetConfig>>(new Map());
  private widgetStates = signal<WidgetState[]>([]);

  readonly visibleWidgets = computed(() =>
    this.widgetStates()
      .filter(w => w.visible)
      .sort((a, b) => a.order - b.order)
  );

  readonly hiddenWidgets = computed(() => this.widgetStates().filter(w => !w.visible));

  readonly allWidgets = computed(() => this.widgetStates());

  initializePage(pageId: string, availableWidgets: WidgetConfig[]): void {
    this.currentPageId.set(pageId);

    const registry = new Map<string, WidgetConfig>();
    availableWidgets.forEach(w => registry.set(w.id, w));
    this.widgetRegistry.set(registry);

    const savedLayout = this.loadFromStorage(pageId);

    if (savedLayout && savedLayout.widgets.length > 0) {
      const validWidgets = savedLayout.widgets.filter(w => registry.has(w.id));
      const existingIds = new Set(validWidgets.map(w => w.id));
      const newWidgets = availableWidgets
        .filter(w => !existingIds.has(w.id))
        .map((w, i) => ({
          id: w.id,
          visible: w.defaultVisible,
          order: validWidgets.length + i,
        }));

      this.widgetStates.set([...validWidgets, ...newWidgets]);
    } else {
      const defaultStates = availableWidgets.map((w, i) => ({
        id: w.id,
        visible: w.defaultVisible,
        order: i,
      }));
      this.widgetStates.set(defaultStates);
    }
  }

  getWidgetConfig(widgetId: string): WidgetConfig | undefined {
    return this.widgetRegistry().get(widgetId);
  }

  toggleWidget(widgetId: string): void {
    this.widgetStates.update(states => {
      const updated = states.map(s => (s.id === widgetId ? { ...s, visible: !s.visible } : s));

      const visibleCount = updated.filter(w => w.visible).length;
      const widget = updated.find(w => w.id === widgetId);
      if (widget?.visible) {
        widget.order = visibleCount - 1;
      }

      return updated;
    });
    this.saveToStorage();
  }

  showWidget(widgetId: string): void {
    this.widgetStates.update(states => {
      const visibleCount = states.filter(w => w.visible).length;
      return states.map(s =>
        s.id === widgetId ? { ...s, visible: true, order: visibleCount } : s
      );
    });
    this.saveToStorage();
  }

  hideWidget(widgetId: string): void {
    this.widgetStates.update(states =>
      states.map(s => (s.id === widgetId ? { ...s, visible: false } : s))
    );
    this.saveToStorage();
  }

  reorderWidgets(previousIndex: number, currentIndex: number): void {
    this.widgetStates.update(states => {
      const visible = states.filter(w => w.visible).sort((a, b) => a.order - b.order);
      const hidden = states.filter(w => !w.visible);

      const [moved] = visible.splice(previousIndex, 1);
      visible.splice(currentIndex, 0, moved);

      visible.forEach((w, i) => (w.order = i));

      return [...visible, ...hidden];
    });
    this.saveToStorage();
  }

  resetToDefaults(): void {
    const registry = this.widgetRegistry();
    const defaultStates: WidgetState[] = [];
    let order = 0;

    registry.forEach((config, id) => {
      defaultStates.push({
        id,
        visible: config.defaultVisible,
        order: order++,
      });
    });

    this.widgetStates.set(defaultStates);
    this.saveToStorage();
  }

  private loadFromStorage(pageId: string): WidgetLayout | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + pageId);
      if (stored) {
        return JSON.parse(stored) as WidgetLayout;
      }
    } catch {
      console.warn('Failed to load widget layout from storage');
    }
    return null;
  }

  private saveToStorage(): void {
    const pageId = this.currentPageId();
    if (!pageId) return;

    const layout: WidgetLayout = {
      pageId,
      widgets: this.widgetStates(),
      columns: 3,
      lastUpdated: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY_PREFIX + pageId, JSON.stringify(layout));
    } catch {
      console.warn('Failed to save widget layout to storage');
    }
  }
}
