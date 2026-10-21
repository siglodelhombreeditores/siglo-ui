export class Modal {
  constructor(selector: string) {
    document.querySelector(selector)?.classList.add('modalio');
  }
  show() {
    console.log('it works');
  }
}