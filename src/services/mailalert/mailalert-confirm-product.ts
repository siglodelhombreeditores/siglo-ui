import { Elemento } from "../../components/elemento/elemento";
import { Form } from "../../components";
import { MailalertConfirmModal } from "../../components/mailalert/mailalert-confirm-modal";
import { Request } from "../fetch/request";

type PostResponse = {
  ok: boolean;
  fields: Record<string, string>;
  message?: string;
};

const request = new Request();
let customerEmailInfo: { checked: boolean; email: string } = {
  checked: false,
  email: "",
}

export function mailalertConfirmProduct() {
  const confirmModal = MailalertConfirmModal.instance("#siglo-mailalert-confirm-modal");
  if (confirmModal) {
    const confirmUrl = confirmModal.confirmUrl;
    const confirmForm = new Form("form", confirmModal);
    const addButton = Elemento.require('.js-siglo-mailalert-confirm-add');
    addButton.addEventListener('click', () => confirmModal.show());

    request.onStart(() => confirmModal.loadingContent.show());
    request.onEnd(() => confirmModal.loadingContent.hide());

    confirmModal.onShow(() => fetchCustomerEmail(confirmUrl).then((customerEmail) =>
      confirmForm.getNamedInput('email').setValue(customerEmail).setDisabled(!!customerEmail)
    ));

    confirmModal.onHidden(() => {
      request.abort();
      confirmModal.clear();
      confirmForm.show().clearInputs();
    });

    confirmModal.onConfirmSubmit(() => {
      const formData = confirmForm.getFormData({
        'id_product' : addButton.data('idProduct'),
        'id_product_attribute' : addButton.data('idProductAttribute'),
      });
      request.post<PostResponse>(`${confirmUrl}/add`, formData).then(response => {
        if (response.message) {
          confirmModal.alertHide()
          confirmModal.alertShow(response.ok ? 'success' : 'danger', response.message);
          confirmModal.subtitleHide();
          confirmForm.hide();
          if (response.ok) {
            confirmModal.submitDisable();
          }
        } else {
          confirmForm.setInputsInvalidFeedback(response.fields);
        }
      })
    });
  }
}

async function fetchCustomerEmail(confirmUrl: string): Promise<string> {
  if (!customerEmailInfo.checked) {
    const { customerEmail } = await request.get<{ customerEmail: string }>(`${confirmUrl}/customer-email`);
    customerEmailInfo = { checked: true, email: customerEmail };
  }
  return customerEmailInfo.email;
}