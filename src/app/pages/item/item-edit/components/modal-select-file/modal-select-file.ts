import { Component, Output, EventEmitter, signal } from '@angular/core';

@Component({
  selector: 'app-modal-select-file',
  standalone: true,
  imports: [],
  templateUrl: './modal-select-file.html',
})
export class ModalSelectFile {
  @Output() imageSelected = new EventEmitter<string>();

  tempImageDataUrl = signal<string | null>(null);

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.tempImageDataUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  clearFile() {
    this.tempImageDataUrl.set(null);
    // Reseta o input de arquivo
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }

  saveFile() {
    const url = this.tempImageDataUrl();
    if (url) {
      this.imageSelected.emit(url);
      this.tempImageDataUrl.set(null);
    }
  }
}
