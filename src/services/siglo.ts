interface Siglo {
  captcha?: {
    siteKey: string,
    script: string,
    version?: number,
  },
  customer: {
    authenticatedStaticToken: string,
    email: string,
    firstname: string,
    lastname: string,
  }|null;
  wishlist: {
    productsTagged: Array<{id_product:number, id_wishlist: number, quantity?: number, id_product_attribute?: number}>,
    texts: {
      titles: { addToWishlist: string, createWishlist: string, },
    },
  }
}

declare global {
  interface Window {
    siglo: Siglo
  }
}

export const siglo = window.siglo;