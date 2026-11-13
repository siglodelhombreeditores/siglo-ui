/**
 * basado en themes/_core/js/facets.js
 */
// import events from "../constants/events";
import { loadingMain } from "../components/loading/loading-main";
import { Request } from "./fetch/request";
// import prestashop from "./prestashop";
import { replaceSelectorWith, targetClosest } from "./element/element";

const EVENT_PRODUCT_LIST_UPDATED = "EVENT_PRODUCT_LIST_UPDATED";
const listeners: Record<string, Array<() => void>> = {[EVENT_PRODUCT_LIST_UPDATED]: []};
let currentRequest: Request|null = null;

type RequestResponse = {
  current_url: string,
  rendered_active_filters: string,
  rendered_facets: string,
  rendered_products: string,
  rendered_products_bottom: string,
  rendered_products_header: string,
  rendered_products_top: string,
};

export async function fetchResults(url?: string) {
  loadingMain.show();
  const data = await requestResults(url || window.location.href);
  if (data) {
    updateProductListDom(data);
    // Slider.createSliders(slider => fetchResults(slider.buildFetchUrl()));
    loadingMain.hide();
    window.history.pushState(data, document.title, data.current_url);
  }
  return data;
}

export function fetchResultsOnSearchLinkClick(e: UIEvent, onResultFetched?: (data: RequestResponse, searchLink: HTMLAnchorElement) => void) {
  const searchLink = targetClosest<HTMLAnchorElement>(e.target, '.js-search-link');
  if (searchLink) {
    e.preventDefault();
    fetchResults(searchLink.href).then(data => {
      if (data) {
        onResultFetched?.(data, searchLink)
      }
    });
  }
}

export const isSearchLinkPagination = (searchLink: HTMLAnchorElement) => searchLink.matches('.pagination .js-search-link');

export const onProductListUpdated = (listener: () => void) => listeners[EVENT_PRODUCT_LIST_UPDATED].push(listener);

export async function requestResults(url: string): Promise<RequestResponse|null> {
  currentRequest?.abort();

  // We need to add a parameter to the URL
  // to make it different from the one we're on,
  // otherwise when you do "duplicate tab" under chrome
  // it mixes up the cache between the AJAX request (that
  // returns JSON) and the non-AJAX request (that returns
  // HTML) and you just get a mess of JSON on the duplicated tab.
  const separator = url.indexOf('?') >= 0 ? '&' : '?';
  const slightlyDifferentURL = `${url + separator}from-xhr`;

  currentRequest = new Request();

  try {
    return currentRequest.get<RequestResponse>(slightlyDifferentURL);
  } catch (e) {
    // prestashop.emit(events.handleError, {resp: e})
    return null;
  } finally {
    currentRequest = null
  }
}

export function updateProductListDom(data: RequestResponse) {
  replaceSelectorWith('#search-filters', data.rendered_facets);
  replaceSelectorWith('#js-active-search-filters', data.rendered_active_filters);
  replaceSelectorWith('#js-product-list-top', data.rendered_products_top);
  replaceSelectorWith('#js-product-list', data.rendered_products);
  replaceSelectorWith('#js-product-list-bottom', data.rendered_products_bottom);
  if (data.rendered_products_header) {
    replaceSelectorWith('#js-product-list-header', data.rendered_products_header);
  }
  listeners[EVENT_PRODUCT_LIST_UPDATED].forEach(listener => listener());
  // prestashop.emit(events.updatedProductList, { data })
}