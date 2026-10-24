import { Backdrop } from "./backdrop";
import { Spinner } from "./spinner";
import { BaseElemento } from "../elemento/base-elemento";

export class Loading {

  static instance(
    backdropSelector: string = '.loading-content', spinnerSelector: string = '.spinner', parent?: HTMLElement|BaseElemento
  ): Loading {
    const backdrop = new Backdrop(backdropSelector, parent);
    return new this(backdrop, new Spinner(spinnerSelector, backdrop));
  }

  constructor(
    protected backdrop: Backdrop,
    protected spinner: Spinner,
  ) {}

  get isConnected(): boolean {
    return this.backdrop.isConnected;
  }

  show() {
    this.backdrop.show();
    this.spinner.show();
  }
  hide() {
    this.backdrop.hide()
    this.hideSpinner();
  }

  hideSpinner() {
    this.spinner.hide();
  }

  getBackdrop(): Backdrop {
    return this.backdrop;
  }
}

export { Backdrop, Spinner }