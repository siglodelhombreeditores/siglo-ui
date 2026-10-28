import { Request } from "./request";

class Ajax {
  private request: Request | null = null;

  get<T = any>(url: string): Promise<T> {
    return this.getRequest().setHeaders(null).setBody(null).get<T>(url);
  }

  post<T = any>(url: string, data: { [k: string]: any } | FormData | string | null = null): Promise<T> {
    const request = this.getRequest();
    if (typeof data === 'string') {
      request.addHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
    } else {
      request.setHeaders(null);
    }
    return request.post<T>(url, data);
  }

  submitAsForm(action: string, method: 'POST'|'GET'|'DELETE' = 'POST') {
    const isGetOrPostMethod = ['GET', 'POST'].includes(method);
    const form = document.createElement('form');
    form.action = action;
    form.method = isGetOrPostMethod ? method : 'POST';
    if (!isGetOrPostMethod) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_method';
      input.value = method;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  private getRequest(): Request {
    if (this.request) {
      return this.request;
    }
    return this.request = new Request();
  }
}


export const ajax = new Ajax();
