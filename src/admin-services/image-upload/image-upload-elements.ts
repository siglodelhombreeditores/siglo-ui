import { getForm } from "../form";
import { elementCreate } from "../../services/element/element-create";

export class ImageUploadElements {

  private fileViewer: HTMLElement|null = null;
  private figure: HTMLElement|null = null;
  private imgContainer: HTMLDivElement|null = null;
  private img: HTMLImageElement|null = null;
  private loadingOverlay: HTMLElement|null = null;
  private textDanger: HTMLElement|null = null;
  private figcaption: HTMLElement|null = null;
  private deleteButton: HTMLButtonElement|null = null;
  private size: HTMLParagraphElement|null = null;
  private deletableLabel: string;
  private dataDeletable: boolean;
  private deleteListener: (() => void)|null = null;
  private deleteListenerAttached = false;
  private imgPrevSrc: string;
  private imgContainerHeight: number = 0;

  constructor(
    public readonly element: HTMLElement,
    public readonly input: HTMLInputElement,
    public readonly label: HTMLLabelElement
  ) {
    this.fileViewer = this.element.querySelector<HTMLElement>('.file-viewer');
    this.figure = this.fileViewer?.querySelector('figure') ?? null;
    this.imgContainer = this.figure?.querySelector<HTMLDivElement>('.figure-img-container') ?? null
    this.img = this.imgContainer?.querySelector<HTMLImageElement>('img.figure-img') ?? null;
    this.figcaption = this.figure?.querySelector('figcaption') ?? null;
    this.deleteButton = this.figcaption?.querySelector('.btn') ?? null;

    this.deletableLabel = this.dataset('deletableLabel', 'Delete');
    this.dataDeletable = !!this.dataset('deletable');
    this.imgPrevSrc = this.img?.src ?? '';
  }

  get deletable(): boolean {
    return this.dataDeletable;
  }

  get clientWidth(): number {
    return this.element.clientWidth;
  }

  dataset(key: string, defaultValue: string = ''): string {
    return this.element.dataset[key] ?? defaultValue;
  }

  getFigure(): HTMLElement {
    if (!this.figure) {
      this.createFileViewer();
    }
    return this.figure as HTMLElement;
  }

  setImgSrc(src: string): void {
    if (!this.img) {
      this.createFileViewer();
    }
    if (src) {
      this.imgPrevSrc = src;
    }
    this.img!.src = src;
    this.imgContainer!.classList.toggle('empty', !src)
  }

  setImgPrevSrc(): this {
    if (this.img && this.imgPrevSrc) {
      this.setImgSrc(this.imgPrevSrc);
    }
    return this;
  }

  loading(show: boolean, imgContainerDimensions: {width?: number, height: number} = {height: 0}): void {
    if (show) {
      this.prependLoadingOverlay();
      if (imgContainerDimensions.height) {
        this.setImgSrc('');
      }
    }
    this.setImgContainerDimensions(imgContainerDimensions);
    // in loading show false maybe figure doesnt exist, thats why no getFigure() is used
    this.figure?.classList.toggle('loading', show);
    getForm(this.input)?.setSubmitButtonDisabled(show);
  }

  getTextDanger(): HTMLElement {
    if (!this.textDanger) {
      this.textDanger = this.element.querySelector<HTMLElement>('.text-danger span');
      if (!this.textDanger) {
        const textDangerContainer = document.createElement('div');
        textDangerContainer.classList.add('d-inline-block', 'align-baseline', 'text-danger', 'mt-1');
        textDangerContainer.setAttribute('role', 'alert')

        this.textDanger = document.createElement('span');

        const icon = document.createElement('i')
        icon.classList.add('material-icons', 'form-error-icon')
        icon.innerText = 'error_outline';

        textDangerContainer.appendChild(icon)
        textDangerContainer.appendChild(this.textDanger)
        if (this.fileViewer) {
          this.fileViewer.insertAdjacentElement('beforebegin', textDangerContainer)
        } else {
          this.element.appendChild(textDangerContainer);
        }
      }
    }

    return this.textDanger;
  }

  showDeleteButton(): void {
    this.getDeleteButton();
  }

  removeFileViewer(): void {
    this.slideUpFileViewer().then(() => {
      this.removeSize();
      this.removeDeleteButton();
      this.fileViewer?.remove();
      this.fileViewer = null;
      this.figure = null;
      this.imgContainer = null;
      this.img = null;
      this.loadingOverlay = null;
      this.figcaption = null;
      this.imgContainerHeight = 0;
      this.imgPrevSrc = '';
    })
  }

  removeDeleteButton(): void {
    this.deleteButton?.remove();
    this.deleteListenerAttached = false;
    this.deleteButton = null;
  }

  getSize(): HTMLParagraphElement {
    if (!this.size) {
      this.size = this.getFigcaption().querySelector('p');
      if (!this.size) {
        this.size = document.createElement('p');
        this.getFigcaption().prepend(this.size);
      }
    }
    return this.size;
  }

  removeSize(): void {
    this.size?.remove();
    this.size = null;
  }

  onDelete(listener: () => void) {
    this.deleteListener = listener;
    if (this.deleteButton) {
      this.deleteButton.addEventListener('click', e => this.deleteListener!())
      this.deleteListenerAttached = true;
    } else {
      this.deleteListenerAttached = false;
    }
  }

  private createFileViewer(imgContainerHeight: number = 0): HTMLElement {
    if (!this.imgContainerHeight) {

    }
    this.fileViewer = elementCreate('div.file-viewer.mt-3');
    this.figure = elementCreate('figure.figure');
    this.imgContainer = elementCreate('div.figure-img-container.empty');
    this.img = elementCreate('img.figure-img.img-fluid.img-thumbnail');

    this.imgContainer.appendChild(this.img);
    this.figure.appendChild(this.imgContainer);
    this.fileViewer.appendChild(this.figure);
    this.element.appendChild(this.fileViewer);

    return this.fileViewer;
  }

  private getImgContainer(): HTMLDivElement {
    if (!this.imgContainer) {
      this.createFileViewer();
    }
    return this.imgContainer!
  }

  private prependLoadingOverlay() {
    if (!this.loadingOverlay) {
      this.loadingOverlay = elementCreate('div.loader-overlay')
      this.loadingOverlay.appendChild(document.createElement('div'))
      this.getImgContainer().prepend(this.loadingOverlay);
    }
  }

  private getFigcaption(): HTMLElement {
    if (!this.figcaption) {
      this.figcaption = elementCreate('figcaption.figure-caption');
      this.getFigure().appendChild(this.figcaption);
    }
    return this.figcaption;
  }

  private getDeleteButton(): HTMLButtonElement {
    if (!this.deleteButton) {
      this.deleteButton = elementCreate('button.btn.btn-outline-danger.btn-sm[type="button"]');

      const icon = elementCreate('i.material-icons:contains("delete_forever")');

      this.deleteButton.append(icon, ` ${this.deletableLabel}`)
      this.getFigcaption().appendChild(this.deleteButton);
    }
    if (this.deleteListener && !this.deleteListenerAttached) {
      this.deleteButton.addEventListener('click', e => this.deleteListener!())
      this.deleteListenerAttached = true;
    }
    return this.deleteButton;
  }

  private slideUpFileViewer(): Promise<void> {
    return new Promise(resolve => {
      if (this.fileViewer) {
        const animation = this.fileViewer.animate([
          {
            opacity: 1,
            maxHeight: this.fileViewer.offsetHeight + 'px',
            marginBottom: getComputedStyle(this.fileViewer).marginBottom,
            paddingTop: getComputedStyle(this.fileViewer).paddingTop,
            paddingBottom: getComputedStyle(this.fileViewer).paddingBottom
          },
          {
            opacity: 0,
            maxHeight: '0px',
            marginBottom: '0px',
            paddingTop: '0px',
            paddingBottom: '0px'
          }
        ], {
          duration: 300,
          easing: 'ease-out'
        });

        animation.onfinish = () => resolve();

      } else {
        resolve();
      }
    })
  }

  private setImgContainerHeight(height: number = 0) {
    if (this.imgContainerHeight !== height) {
      this.imgContainerHeight = height;
      this.getImgContainer().style.height = height ? height + 'px' : '';
    }
  }

  private setImgContainerDimensions(dimensions: {width?: number, height: number} = {height: 0}) {
    if (this.imgContainerHeight !== dimensions.height) {
      this.imgContainerHeight = dimensions.height;
      this.getImgContainer().style.height = dimensions.height ? dimensions.height + 'px' : '';
      this.getImgContainer().style.width = dimensions.width ? dimensions.width + 'px' : '';
    }
  }
}