import { getForm } from "./form";

interface TextToLinkRewriteParams {
  sourceSelector: string;
  destinationSelector: string;
  eventName?: string
}

const AUTO_FLAG = 'linkRewriteAuto';

// Safe to write only if empty, or if the value was put there by us
const canAutoFill = (target: HTMLInputElement): boolean =>
  target.value === '' || target.dataset[AUTO_FLAG] === '1';

export const textToLinkRewrite = ({
  sourceSelector,
  destinationSelector,
  eventName = 'input',
}: TextToLinkRewriteParams): void => {
  const source = getInputBySelector(sourceSelector);
  if (!source) {
    console.warn('textToLinkRewrite: source not found');
    return;
  }
  document.addEventListener(eventName, (event: Event) => {
    const eventTarget = event.target;
    if (!(eventTarget instanceof HTMLInputElement)) return;

    // User typed in the destination themselves: stop auto-filling it
    if (eventTarget.matches(destinationSelector)) {
      delete eventTarget.dataset[AUTO_FLAG];
      return;
    }

    if (!eventTarget.matches(sourceSelector)) return;

    const sourceForm = eventTarget.form;
    if (!sourceForm) {
      console.warn('textToLinkRewrite: source is not inside a form');
      return;
    }
    const target = getInputBySelector(destinationSelector, sourceForm);
    if (!target) {
      console.warn('textToLinkRewrite: target not found in the same form');
      return;
    }

    if (!canAutoFill(target)) return;

    target.value = window.str2url(source.value);
    target.dataset[AUTO_FLAG] = '1';
  });

  if (source.dataset.linkRewriteUniqueUrl) {
    document.addEventListener('change', async (event: Event) => {
      const source = event.target;

      // Fast exit if it's not our target input
      if (!(source instanceof HTMLInputElement) || !source.matches(sourceSelector) || !source.form) {
        return;
      }

      if (!source.dataset.linkRewriteUniqueUrl) return;

      const target = getInputBySelector(destinationSelector, source.form);
      if (!target) return;

      // Don't touch (or hit the server for) an existing / manually edited value
      if (!canAutoFill(target) || target.value === '') return;

      const linkRewriteUniqueUrl = new URL(window.location.origin + source.dataset.linkRewriteUniqueUrl);

      getForm(source)?.preventSubmit(true);
      try {
        const linkRewriteUnique = await fetchLinkRewriteUnique(linkRewriteUniqueUrl, target.value);
        // Re-check: user may have edited the target while the request was in flight
        if (linkRewriteUnique && canAutoFill(target)) {
          target.value = linkRewriteUnique; // programmatic, keeps the auto flag
        }
      } finally {
        getForm(source)?.preventSubmit(false);
      }
    });
  }
};

function getInputBySelector(selector: string, container?: HTMLElement): HTMLInputElement | null {
  for (const el of Array.from((container || document).querySelectorAll(selector))) {
    if (el instanceof HTMLInputElement) {
      return el;
    }
  }
  return null;
}

async function fetchLinkRewriteUnique(linkRewriteUniqueUrl: URL, linkRewrite: string): Promise<false|string> {
  const url = window.location.origin + linkRewriteUniqueUrl.pathname + '/' + linkRewrite + linkRewriteUniqueUrl.search;
  try {
    const response = (await (await fetch(url)).json());
    return !response.unique && response.linkRewriteUnique ? response.linkRewriteUnique : false;
  } catch (e) {
    console.error(e)
    return false;
  }
}
