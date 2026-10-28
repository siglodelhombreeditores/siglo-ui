class Loader {

  private overlay: HTMLDivElement|null = null;
  private shown: boolean = false;
  private builded = false;
  private inserted = false;

  appendTo(container: HTMLElement|string): this {
    const containerElement = container instanceof HTMLElement ? container : document.querySelector<HTMLElement>(container);
    if (containerElement) {
      containerElement.append(this.build())
      this.inserted = true;
    }
    return this;
  }

  show() {
    this.setDisplay(true);
  }
  hide() {
    this.setDisplay(false);
  }
  isShown(): boolean {
    return this.shown;
  }

  build(): HTMLDivElement {
    if (!this.builded || !this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.classList.add('loader-overlay');
      const spinner = document.createElement('div');
      spinner.classList.add('spinner');
      this.overlay.appendChild(spinner);
      this.builded = true;
    }
    return this.overlay;
  }

  async execute<T>(task: () => Promise<T>): Promise<T> {
    this.show();
    try {
      return await task();
    } finally {
      this.hide();
    }
  }

  new(): Loader {
    return new Loader();
  }

  isInserted(): boolean {
    return  this.inserted;
  }

  private setDisplay(shown: boolean) {
    if (this.overlay) {
      this.overlay.style.display = shown ? 'flex' : 'none';
      this.shown = shown;
    }
  }
}

export const loader = new Loader();