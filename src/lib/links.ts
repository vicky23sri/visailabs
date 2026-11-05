// The product sites open in a new tab, so visitors keep their place on this site.
const PRODUCT = /^https?:\/\/(www\.)?(vmeasure|vaudit)\.ai/;

export const isProduct = (href = '') => PRODUCT.test(href);
export const newTab = (href = '') => (isProduct(href) ? { target: '_blank', rel: 'noopener' } : {});
