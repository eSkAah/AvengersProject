import {
  Directive,
  Output,
  EventEmitter,
  HostListener,
  Input,
} from '@angular/core';

export interface CmdClickContext {
  label: string;
  value: string | number;
  sourceDocument?: string;
  additionalContext?: Record<string, unknown>;
}

@Directive({
  selector: '[appCmdClick]',
  standalone: true,
})
export class CmdClickDirective {
  @Input() cmdClickContext: CmdClickContext | null = null;
  @Input() cmdClickEnabled = true;

  @Output() cmdClick = new EventEmitter<CmdClickContext>();

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.cmdClickEnabled) return;

    const isCmdClick = event.metaKey || event.altKey;
    if (isCmdClick && this.cmdClickContext) {
      event.preventDefault();
      event.stopPropagation();
      this.cmdClick.emit(this.cmdClickContext);
    }
  }
}
