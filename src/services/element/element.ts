export function loadScript(src: string, async = true, type = "text/javascript") {
  return new Promise((resolve, reject) => {
    try {
      const scriptEle = document.createElement("script");
      scriptEle.type = type;
      scriptEle.async = async;
      scriptEle.src = src;

      scriptEle.addEventListener("load", (ev) => {
        resolve({ status: true });
      });

      scriptEle.addEventListener("error", (ev) => {
        reject({
          status: false,
          message: `Failed to load the script ${src}`
        });
      });

      document.body.appendChild(scriptEle);
    } catch (error) {
      reject(error);
    }
  });
}

export function requery<T extends HTMLElement>(selector: string|T, parent?: HTMLElement): T {
  const parentElement = parent ?? document;
  const element = typeof selector === 'string' ? (parentElement.querySelector(selector) as T | null) : selector;
  if (!element) {
    throw new Error(`element ${selector} not found`);
  }
  return element;
}