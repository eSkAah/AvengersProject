import { Component, ChangeDetectionStrategy, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Upload } from 'lucide-angular';

@Component({
  selector: 'app-upload-widget',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './upload-widget.component.html',
  styleUrl: './upload-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UploadWidgetComponent {
  readonly icons = {
    upload: Upload
  };

  readonly isDragOver = signal(false);
  readonly uploadFiles = output<File[]>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles.emit(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(Array.from(input.files));
    }
  }
}
