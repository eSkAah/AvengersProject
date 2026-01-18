import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-entity-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './entity-autocomplete.component.html',
  styleUrls: ['./entity-autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityAutocompleteComponent {
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  @Input() set entities(value: string[]) {
    this._entities.set(value);
  }
  @Input() placeholder = 'Rechercher une entité...';
  @Input() set selectedEntity(value: string) {
    this._selectedEntity.set(value);
    if (value) {
      this.searchQuery.set(value);
    }
  }

  @Output() entitySelect = new EventEmitter<string>();
  @Output() entityClear = new EventEmitter<void>();

  private _entities = signal<string[]>([]);
  private _selectedEntity = signal<string>('');

  searchQuery = signal('');
  isOpen = signal(false);
  highlightedIndex = signal(-1);

  // Filtered entities based on search query
  filteredEntities = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const entities = this._entities();

    if (!query) {
      // Show first 10 when no query
      return entities.slice(0, 10);
    }

    return entities
      .filter(entity => entity.toLowerCase().includes(query))
      .slice(0, 20); // Limit to 20 results for performance
  });

  hasSelection = computed(() => !!this._selectedEntity());

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  constructor(private elementRef: ElementRef) {}

  onInputFocus(): void {
    this.isOpen.set(true);
    this.highlightedIndex.set(-1);
  }

  onInputChange(value: string): void {
    this.searchQuery.set(value);
    this.isOpen.set(true);
    this.highlightedIndex.set(-1);

    // Clear selection if user is typing something different
    if (this._selectedEntity() && value !== this._selectedEntity()) {
      this._selectedEntity.set('');
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const filtered = this.filteredEntities();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i =>
          i < filtered.length - 1 ? i + 1 : 0
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i =>
          i > 0 ? i - 1 : filtered.length - 1
        );
        break;

      case 'Enter':
        event.preventDefault();
        const index = this.highlightedIndex();
        if (index >= 0 && index < filtered.length) {
          this.selectEntity(filtered[index]);
        }
        break;

      case 'Escape':
        this.closeDropdown();
        break;

      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  selectEntity(entity: string): void {
    this._selectedEntity.set(entity);
    this.searchQuery.set(entity);
    this.entitySelect.emit(entity);
    this.closeDropdown();
  }

  clearSelection(): void {
    this._selectedEntity.set('');
    this.searchQuery.set('');
    this.entityClear.emit();
    this.isOpen.set(false);

    // Focus input after clear
    setTimeout(() => {
      this.inputElement?.nativeElement?.focus();
    }, 0);
  }

  private closeDropdown(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
  }

  // Highlight matching text in results
  highlightMatch(entity: string): string {
    const query = this.searchQuery().trim();
    if (!query) return entity;

    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return entity.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
