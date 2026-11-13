/**
 * Remplazo de jQuery $(document).ready(() => ...
 * Tomado de https://stackoverflow.com/a/7053197
 * @param callback
 */
export const documentReady = (callback: () => void) => document.readyState !== 'loading'
  ? callback()
  : document.addEventListener('DOMContentLoaded', callback);

export function eventTargetMatches<T = Element>(event: Event, selector: string, maxRecursion = 10): T|null {
  let targetElement = event.target as Element;
  let i = 0
  let maxRecursionReached = i >= maxRecursion
  while (!maxRecursionReached && targetElement && targetElement !== document.body) {
    if (targetElement.matches(selector)) {
      return targetElement as T
    }
    i++
    maxRecursionReached = i >= maxRecursion
    // Go up the DOM
    targetElement = targetElement.parentNode as Element;
  }
  return null
}