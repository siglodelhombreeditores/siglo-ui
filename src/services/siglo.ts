interface Siglo {
  captcha?: {
    siteKey: string,
    script: string,
    version?: number,
  }
}

declare global {
  interface Window {
    siglo: Siglo
  }
}

export const siglo = window.siglo;