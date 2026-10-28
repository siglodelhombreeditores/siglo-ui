import { type PrestaShop } from './prestashop';
export {};
declare global {
  interface Window {
    enhancedfields?: {
      fileUpload: {
        import(): Promise<typeof FileUpload>;
        initFields(): void;
      }
    };
    prestashop: PrestaShop;
    modalConfirmation: ModalConfirmation;
    str2url(str: string): string;
  }

  class FileUpload {
    static instance(element: HTMLElement): FileUpload;
  }

  class ModalConfirmation {
    create(content: null|string, title: null|string, callbacks?: {onContinue?: () =>void, onCancel?: () => void}): this;
    show(): void;
    hide(): void;
  }
}