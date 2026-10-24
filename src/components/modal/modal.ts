import BootstrapModal from 'bootstrap/js/dist/modal';
import { Elemento, ElementoListenable } from "../elemento/elemento";
import { type BootstrapBackdropType } from "../loading/backdrop";
import { LoadingMain } from "../loading/loading-main";
import { Loading } from "../loading/loading";

export type SigloBootstrapModal = BootstrapModal & {
  _scrollBar: { reset: () => void },
  _backdrop: BootstrapBackdropType,
  _isShown: boolean,
  _isTransitioning: boolean
};

export class Modal extends ElementoListenable {

  protected _instance: SigloBootstrapModal|null = null;
  protected loadingMain: LoadingMain|null = null;
  private _loadingContent: Loading|null = null;

  constructor(element: string|HTMLElement, parent?: HTMLElement|Elemento) {
    super(element, parent);
    this.listeners.onEventAdded('show', () => this.addEventListener('show.bs.modal', () => this.listeners.execute('show')))
    this.listeners.onEventAdded('hide', () => this.addEventListener('hide.bs.modal', () => this.listeners.execute('hide')))
    this.listeners.onEventAdded('hidden', () => this.addEventListener('hidden.bs.modal', () => this.listeners.execute('hidden')))
  }

  get loadingContent(): Loading {
    return this._loadingContent || (this._loadingContent = this.getLoadingContent());
  }

  show() {
    this.instance().show()
  }
  hide() {
    // if (!this.isShown) {
    //   this.isShown = true
    // }
    this.instance()?.hide();
    this.loadingMain?.hide();
  }

  onShow(listener: () => void): this {
    this.listeners.add('show', listener);
    return this;
  }

  onHide(callback: (this: this, e: Event) => void): this {
    this.listeners.add('hide', callback)
    return this
  }

  onHidden(listener: () => void): this {
    this.listeners.add('hidden', listener);
    return this;
  }

  useLoadingMainBackdrop(loadingMain: LoadingMain): this {
    this.loadingMain = loadingMain;
    return this;
  }

  protected instance() {
    if (!this._instance) {
      this._instance = (new BootstrapModal(this.element()) as SigloBootstrapModal);
      if (this.loadingMain) {
        this._instance._backdrop = this.loadingMain.getBackdrop().getBootstrapBackdrop();
        this.onShow(() => (this.loadingMain as LoadingMain).hideSpinner());
        this.onHide(() => (this.loadingMain as LoadingMain).hideSpinner());
      }
    }
    return this._instance;
  }

  protected getLoadingContent(): Loading {
    const loadingContent = Loading.instance('.loading-content', '.spinner', this);
    if (loadingContent.isConnected) {
      this.onHidden(() => this.loadingContent.hide())
    }
    return loadingContent;
  }
}