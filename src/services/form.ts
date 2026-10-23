export function appendInput(form: HTMLFormElement, type: string, name: string, value: string) {
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.value = value;

  form.appendChild(input);
}

export function checkValidity(formElement: HTMLFormElement) {
  const valid = formElement.checkValidity();
  formElement.classList.add('was-validated');
  return valid;
}