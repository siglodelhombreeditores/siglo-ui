import { Modal } from "../modal/modal";
import { BaseElemento } from "../elemento/base-elemento";
import { elementCreate } from "../../services/element/element-create";

export class MailalertConfirmModal extends Modal {
  private readonly confirmSubmitButton: HTMLButtonElement
  private readonly modalBody: HTMLElement;
  private readonly modalSubtitle: HTMLElement;

  constructor(element: string|HTMLElement, parent?: HTMLElement|BaseElemento) {
    super(element, parent);
    this.confirmSubmitButton = this.querySelector('.js-siglo-mailalert-confirm-submit') as HTMLButtonElement;
    this.listeners.onEventAdded('confirmSubmit', () =>
      this.confirmSubmitButton.addEventListener('click', () => this.listeners.execute('confirmSubmit'))
    );
    this.modalBody = this.querySelector('.modal-body') as HTMLElement;
    this.modalSubtitle = this.querySelector('.modal-subtitle') as HTMLElement;
  }

  get confirmUrl(): string {
    return this.data('confirmUrl');
  }

  onConfirmSubmit(listener: () => void) {
    this.listeners.add('confirmSubmit', listener);
  }

  clear() {
    this.alertHide();
    this.subtitleShow();
  }

  alertShow(type: 'success'|'danger', message: string): void {
    const alertElement = elementCreate(`div.alert.alert-${type}:contains("${message}")`);
    this.modalBody.insertAdjacentElement('afterbegin', alertElement)
  }

  alertHide(): void {
    this.modalBody.querySelector('.alert')?.remove();
  }

  subtitleHide(): void {
    this.modalSubtitle.classList.add('d-none')
  }
  subtitleShow(): void {
    this.modalSubtitle.classList.remove('d-none')
  }

  submitDisable(): void {
    this.confirmSubmitButton.disabled = true;
  }

}
