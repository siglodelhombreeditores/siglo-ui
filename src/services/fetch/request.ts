export class Request {
  private controller: AbortController | null = null;
  private method: string = 'GET';
  private headers: {[k: string]: string} = {
    Accept: 'application/json, text/javascript, */*; q=0.01',
  };
  private headersDefault: {[k: string]: string};
  private body: FormData|string|null = null;

  private timeout: number = 0;
  private timeoutId: number|undefined = undefined;

  constructor() {
    this.headersDefault = Object.assign({}, this.headers);
  }

  setMethod(method: 'GET'|'POST'|'DELETE') {
    this.method = method;
    return this;
  }

  setBody(data: { [k: string]: any }|FormData|HTMLFormElement|string|null) {
    if (data instanceof HTMLFormElement) {
      data = new FormData(data);
    }
    if (data instanceof FormData || typeof data === 'string' || !data) {
      this.body = data;
    } else {
      this.body = new FormData();
      for (const k in data) {
        this.body.append(k, data[k]);
      }
    }
    return this;
  }

  get<T = any>(url: string): Promise<T> {
    return new Promise((resolve, reject) =>
      this.setMethod('GET').handleFetch(this.fetch(url), resolve, reject)
    )
  }

  getText(url: string): Promise<string> {
    return new Promise((resolve, reject) =>
      this.setMethod('GET').handleFetch(this.fetch(url), resolve, reject, 'text')
    )
  }

  post<T = any>(url: string, data: {[k: string]: any}|FormData|HTMLFormElement|string|null): Promise<T> {
    return new Promise((resolve, reject) =>
      this.setMethod('POST').setBody(data).handleFetch(this.fetch(url), resolve, reject)
    )
  }

  fetch(url: string): Promise<Response> {
    return fetch(url, this.buildFetchInit());
  }

  abort() {
    this.controller?.abort()
  }

  private async handleFetch<T>(
    fetchPromise: Promise<Response>,
    resolve: (resp: T) => void,
    reject: (resp: any) => void,
    responseType: 'json' | 'text' | null = 'json',
  ) {
    try {
      const resp = await fetchPromise;

      let isJson: boolean = responseType === 'json';
      if (!responseType) {
        const contentType = resp.headers.get('content-type');
        isJson = contentType ? contentType.includes('application/json') : false;
      }

      const data = isJson ? await resp.json() : await resp.text();

      if (!resp.ok) {
        reject(data);
        return;
      }

      resolve(data);

    } catch (error: any) {
      if (error?.name !== 'AbortError' && error?.name !== 'TimeoutError') {
        reject(error);
      }
    } finally {
      this.controller = null;
      clearTimeout(this.timeoutId);
    }
  }

  private buildFetchInit(): RequestInit {
    this.controller = new AbortController();
    if (this.timeout) {
      this.timeoutId = window.setTimeout(() =>
          this.controller?.abort(new DOMException('signal timed out', 'TimeoutError')),
        this.timeout);
    }
    const requestInit: RequestInit = {
      method: this.method,
      signal: this.controller.signal,
      headers: this.buildHeaders(this.headers),
    };

    if (this.body) {
      requestInit.body = this.body;
    }

    return requestInit;
  }

  private buildHeaders(data: {[k: string]: string}): Headers {
    const headers = new Headers();
    for (const k in data) {
      headers.append(k, data[k]);
    }
    return headers;
  }
}