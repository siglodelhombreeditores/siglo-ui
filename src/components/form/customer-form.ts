import { ProxyForm } from "./form";
import { loadingMain } from "../loading/loading-main";
import { captcha } from "../../services";

export class CustomerForm extends ProxyForm {
  public static init(selector = '#customer-form') {
    const customerForm = new this(selector);

    customerForm.onSubmit(e => {
      e.preventDefault();
      e.stopPropagation();
      if (customerForm.checkValidity()) {
        loadingMain.show();
        captcha.executeForm(customerForm.element()!, 'recaptcha', 'registration').then(() => {
          customerForm.submit();
        }).catch(() => loadingMain.hide())
      }
    })
  }
}