/**
 * Centralized loading keys for the shopper module
 * Using constants prevents typos and enables autocomplete
 */
export const LOADING_KEYS = {
  // Cart
  CART_LOAD: 'shopper:cart-load',
  CART_UPDATE: 'shopper:cart-update',
  CART_REMOVE: 'shopper:cart-remove',
  CART_CLEAR: 'shopper:cart-clear',

  // Catalog
  CATALOG_ITEMS: 'shopper:catalog-items',
  CATALOG_SEARCH: 'shopper:catalog-search',
  CATALOG_FILTER: 'shopper:catalog-filter',

  // Item Detail
  ITEM_DETAIL: 'shopper:item-detail',
  ITEM_IMAGES: 'shopper:item-images',
} as const;

export type LoadingKey = typeof LOADING_KEYS[keyof typeof LOADING_KEYS];