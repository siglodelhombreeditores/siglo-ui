import { loadScript } from "./element/element";
import { appendInput } from "./form";
import { siglo } from './siglo'

type RecaptchaType = {
  ready: (callback: () => void) => void,
  execute: (siteKey?: string|number, options?: {action?: string}) => Promise<string>,
  render: (element: string|HTMLElement, options?: any) => number,
  reset: (widgetId: number) => void,
};

class Captcha {
  public readonly enabled: boolean;
  private readonly version: number = 3;
  private readonly siteKey: string = '';
  private readonly script: string = '';
  private scriptLoaded: boolean = false;
  private scriptLoading: boolean = false;
  private recaptcha: RecaptchaType|undefined;
  private recaptchaReady: boolean = false;
  private executeResolve: any = null;
  private executeReject: any = null;
  private recaptchaIds: {[k: string]: number} = {};
  private readyQueue: Array<() => void> = [];

  constructor() {
    if (siglo.captcha) {
      this.enabled = true;
      this.siteKey = siglo.captcha.siteKey;
      this.script = siglo.captcha.script;
      this.version = siglo.captcha.version || 2;
      (window as any).onRecaptchaLoad = () => this.recaptchaLoadHandler();
    } else {
      this.enabled = false;
    }
  }

  loadScript() {
    if (this.enabled && !this.scriptLoaded && !this.scriptLoading) {
      this.scriptLoading = true;
      loadScript(this.script).then(() => {
        this.scriptLoaded = true;
        this.recaptcha = (window as any).grecaptcha;
        if (this.version === 3 && this.recaptcha) {
          this.recaptcha.ready( () => this.setRecaptchaReady(true));
        } else {
          this.setRecaptchaReady(!!this.recaptcha);
        }
      }).catch(e => {
        this.scriptLoaded = true;
        this.setRecaptchaReady(false)
      });
    }
  }

  private setRecaptchaReady(ready: boolean): void {
    this.recaptchaReady = ready;
    while(this.readyQueue.length) {
      const callback = this.readyQueue.shift();
      callback?.();
    }
  }

  ready(callback: () => void) {
    if (!this.enabled || (this.scriptLoaded && !this.recaptcha)) {
      callback();
    } else if (!this.scriptLoaded) {
      if (!this.scriptLoading) {
        throw new Error('Captcha enabled but call loadScript first');
      }
      this.readyQueue.push(callback);
    } else if (this.recaptcha) {
      this.recaptcha.ready(callback);
    }
  }

  executeForm(form: HTMLFormElement, elementId: string, action?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.version === 3) {
        this.ready(() => {
          if (this.recaptcha) {
            try {
              this.recaptcha.execute(this.recaptchaIds[elementId], {action}).then(token => {
                appendInput(form, 'hidden', 'g-recaptcha-response', token);
                resolve(token);
              });
            } catch (e) {
              reject(e)
            }
          } else {
            resolve('ok');
          }
        })
      } else if (this.recaptchaReady && this.version === 2) {
        this.executeResolve = resolve;
        this.executeReject = reject;
        (this.recaptcha as RecaptchaType).execute(this.recaptchaIds[elementId]);
      } else {
        reject('undefined error');
      }
    });
  }

  render(captchaElement: HTMLElement|null) {
    if (this.recaptcha && captchaElement) {
      this.recaptchaIds[captchaElement.id] = this.recaptcha.render(captchaElement, {
        'sitekey': this.siteKey,
        'size': 'invisible',
        'callback': (token: string) => this.recaptchaHandler(token),
        'expired-callback': () => this.recaptchaHandler('expired', false),
        'error-callback': () => this.recaptchaHandler('error', false),
      });
    }
  }

  reset(elementId?: string): void {
    if (!elementId) {
      elementId = Object.keys(this.recaptchaIds).shift();
    }
    const widgetId = elementId ? this.recaptchaIds[elementId] : undefined;
    if (typeof widgetId !== 'undefined') {
      this.recaptcha?.reset(widgetId);
    }
  }

  private recaptchaLoadHandler() {
    document.querySelectorAll<HTMLElement>('.captcha-element')
      .forEach(captchaElement => this.render(captchaElement))
  }

  private recaptchaHandler(message: string, success: boolean = true) {
    if (success && this.executeResolve) {
      const executeResolve = this.executeResolve;
      this.executeResolve = null;
      executeResolve(message);
    } else if (!success && this.executeReject) {
      const executeReject = this.executeReject;
      this.executeReject = null;
      executeReject(message);
    }
  }
}

export const captcha = new Captcha();