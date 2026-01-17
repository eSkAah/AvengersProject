import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewMode = 'grid' | 'list';

const STORAGE_KEY = 'avengers-project-view-mode';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-toggle.component.html',
  styleUrl: './view-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggleComponent implements OnInit {
  @Input() mode: ViewMode = 'grid';
  @Input() persistKey?: string;

  @Output() modeChange = new EventEmitter<ViewMode>();

  ngOnInit(): void {
    if (this.persistKey) {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${this.persistKey}`);
      if (saved === 'grid' || saved === 'list') {
        this.mode = saved;
        this.modeChange.emit(this.mode);
      }
    }
  }

  setMode(mode: ViewMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      this.modeChange.emit(mode);

      if (this.persistKey) {
        localStorage.setItem(`${STORAGE_KEY}-${this.persistKey}`, mode);
      }
    }
  }
}
