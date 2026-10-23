import { ProxyElemento } from "../elemento/proxy-elemento";

export class Spinner extends ProxyElemento {
  show() {
    this.classList.remove('d-none');
  }
  hide() {
    this.classList.add('d-none');
  }
}

export const pageLoaderSpinner = new Spinner('#page-loader-spinner')