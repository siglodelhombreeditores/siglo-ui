import { getForm } from "../form";

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
  }

  get deletable(): boolean {
    return this.dataDeletable;
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
    this.img!.src = src;
    this.imgContainer!.classList.remove('empty')
  }

  loading(show: boolean) {
    if (show) {
      this.prependLoadingOverlay();
    }
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

  private createFileViewer(): HTMLElement {
    this.fileViewer = document.createElement('div');
    this.fileViewer.classList.add('file-viewer', 'mt-3');

    this.figure = document.createElement('figure');
    this.figure.classList.add('figure');

    this.imgContainer = document.createElement('div');
    this.imgContainer.classList.add('figure-img-container', 'empty')

    this.img = document.createElement('img');
    this.img.classList.add('figure-img', 'img-fluid', 'img-thumbnail');

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
      this.loadingOverlay = document.createElement('div');
      this.loadingOverlay.classList.add('loader-overlay');
      this.loadingOverlay.appendChild(document.createElement('div'))
      this.getImgContainer().prepend(this.loadingOverlay);
    }
  }

  private getFigcaption(): HTMLElement {
    if (!this.figcaption) {
      this.figcaption = document.createElement('figcaption');
      this.figcaption.classList.add('figure-caption');
      this.getFigure().appendChild(this.figcaption);
    }
    return this.figcaption;
  }

  private getDeleteButton(): HTMLButtonElement {
    if (!this.deleteButton) {
      this.deleteButton = document.createElement('button');
      this.deleteButton.classList.add('btn', 'btn-outline-danger', 'btn-sm');
      this.deleteButton.setAttribute('type', 'button')

      const icon = document.createElement('i');
      icon.classList.add('material-icons')
      icon.innerText = 'delete_forever'

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
}