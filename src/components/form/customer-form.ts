import { Form } from "./form";
import { loadingMain } from "../loading/loading-main";
import { captcha } from "../../services/captcha";

export class CustomerForm extends Form {
  public static init(selector = '#customer-form') {
    const customerForm = CustomerForm.instance(selector);
    customerForm?.onSubmit(e => {
      e.preventDefault();
      e.stopPropagation();
      if (customerForm.checkValidity()) {
        loadingMain.show();
        captcha.executeForm(customerForm.element()!, 'recaptcha', 'registration').then(() => {
          customerForm.submit();
        }).catch(e => {
          loadingMain.hide();
          console.error(e);
        })
      }
    })
  }
}