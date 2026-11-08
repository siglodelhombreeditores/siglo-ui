import { ImageUploadElements } from "./image-upload-elements";
import Dropzone, { type DropzoneFile } from 'dropzone';
import '../../../styles/admin/components/_image-upload.scss';

Dropzone.autoDiscover = false;

export class ImageUploadDropzone {
  private static instances = new WeakMap<HTMLInputElement, ImageUploadDropzone>();

  private readonly fetchUrl: string;
  private readonly uploadUrl: string;
  private readonly filenameOriginal: string;
  private readonly fileSizeLabel: string;
  private readonly placeholder: string;
  private readonly dropzone: Dropzone;
  private previousImageHash: string = '';

  static instance(element: HTMLElement): ImageUploadDropzone|null {
    const inputElement = element.querySelector<HTMLInputElement>('input.custom-file-input');
    const labelElement =  element.querySelector<HTMLLabelElement>('label.custom-file-label');

    if (!inputElement || !labelElement) return null;

    let instance = ImageUploadDropzone.instances.get(inputElement);
    if (!instance) {
      instance = new ImageUploadDropzone(new ImageUploadElements(element, inputElement, labelElement));
      ImageUploadDropzone.instances.set(inputElement, instance);
    }
    return instance;
  }

  constructor(
    private readonly elements: ImageUploadElements
  ) {
    this.fetchUrl = this.elements.dataset('fetchUrl');
    this.uploadUrl = this.elements.dataset('uploadUrl');
    this.filenameOriginal = this.elements.dataset('filenameOriginal');
    this.fileSizeLabel = this.elements.dataset('fileSizeLabel','File size');
    this.placeholder = this.elements.dataset('placeholder', 'Choose file(s)');

    this.dropzone = new Dropzone(this.elements.input, {
      url: this.uploadUrl,
      paramName: 'file_upload',
      accept: async (file, done) => {
        const hash = await this.getFileHash(file);
        if (hash && hash === this.previousImageHash) {
          done('Image already uploaded');
        } else {
          this.previousImageHash = hash;
          done();
        }
      },
      error: (file: any, response: any) => this.onError(response),
      sending: file => this.showLoading(file),
    });
    this.dropzone.on('success', (file, response) => this.onSuccess(response))

    if (this.elements.deletable) {
      this.elements.onDelete(() => this.deleteHandler())
    }
  }

  /**
   * Que el loading tenga el tamaño de la imagen que se va a cargar
   */
  private async showLoading(file: DropzoneFile) {
    try {
      const dimensions = await this.getImageDimensions(file);
      const widgetWidth = this.elements.clientWidth;
      this.elements.loading(true, dimensions.width > widgetWidth
        ? {height: widgetWidth * (dimensions.height / dimensions.width)}
        : dimensions);
    } catch (e) {
      this.elements.loading(true)
    }
  }

  private onError(response: string|any) {
    if (response === 'Image already uploaded') {
      return;
    }
    this.elements.setImgPrevSrc().loading(false);
    this.addErrorMessage(
      typeof response === 'string' ? response : (response.error || response.message || response.detail || response.title || 'Unknown error')
    );
    if (!this.elements.input.value) {
      this.elements.removeFileViewer();
    }
  }

  private async onSuccess(response: any) {
    this.elements.label.innerText = response.name
    this.elements.input.value = response.path
    await this.showImage(response.path);
    this.elements.loading(false);
  }

  private addErrorMessage(message: string) {
    this.elements.getTextDanger().innerText = ' ' + message.trim()
  }

  private async showImage(filename: string) {
    const url = this.fetchUrl.replace('location/filename', filename);
    const response = await fetch(url);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob)
    this.elements.setImgSrc(blobUrl);
    if (this.elements.deletable) {
      const contentLength = response.headers.get('Content-Length');
      this.setSize(contentLength ? parseInt(contentLength) : 0);
      this.elements.showDeleteButton();
    }

    return blobUrl;
  }

  private setSize(sizeInBytes: number) {
    if (sizeInBytes) {
      this.elements.getSize().innerText = `${this.fileSizeLabel} ${(sizeInBytes / 1024).toFixed(2)}kB`;
    } else {
      this.elements.removeSize();
    }
  }

  private async deleteHandler() {
    this.elements.label.innerText = this.placeholder
    this.elements.input.value = ''
    this.elements.removeFileViewer();
  }

  private getImageDimensions(file: File): Promise<{ width: number; height: number;}> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        resolve({width: image.naturalWidth, height: image.naturalHeight});
        URL.revokeObjectURL(url);
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Unable to load image'));
      };

      image.src = url;
    });
  }

  private async getFileHash(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buffer);

      return Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      return ''
    }
  }
}