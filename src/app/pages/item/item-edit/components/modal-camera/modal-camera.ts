import {
  Component,
  Output,
  EventEmitter,
  signal,
  OnDestroy,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-modal-camera',
  standalone: true,
  imports: [],
  templateUrl: './modal-camera.html',
})
export class ModalCamera implements OnDestroy {
  @Output() imageSelected = new EventEmitter<string>();

  private platformId = inject(PLATFORM_ID);
  private stream: MediaStream | null = null;

  isCameraActive = signal(false);
  tempImageDataUrl = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  async startCamera() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.errorMessage.set(null);
    this.tempImageDataUrl.set(null);

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      const video = document.getElementById('cameraVideoFeed') as HTMLVideoElement;
      if (video) {
        video.srcObject = this.stream;
        await video.play();
      }
      this.isCameraActive.set(true);
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      this.errorMessage.set('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }

  takePhoto() {
    if (!this.isCameraActive()) return;

    const video = document.getElementById('cameraVideoFeed') as HTMLVideoElement;
    const canvas = document.getElementById('cameraCanvas') as HTMLCanvasElement;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    this.tempImageDataUrl.set(dataUrl);
    this.stopStream();
  }

  clearPhoto() {
    this.tempImageDataUrl.set(null);
  }

  savePhoto() {
    const url = this.tempImageDataUrl();
    if (url) {
      this.imageSelected.emit(url);
      this.tempImageDataUrl.set(null);
      this.isCameraActive.set(false);
    }
  }

  stopCamera() {
    this.stopStream();
    this.tempImageDataUrl.set(null);
    this.isCameraActive.set(false);
  }

  private stopStream() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.isCameraActive.set(false);
    const video = document.getElementById('cameraVideoFeed') as HTMLVideoElement;
    if (video) video.srcObject = null;
  }

  ngOnDestroy() {
    this.stopStream();
  }
}
