export const DEFAULT_PRICE_DISPLAY_OPTIONS = {
  sellingPrice: true,
  originalPrice: true,
  discountedPrice: false,
  discountPercentage: true
};

export function priceNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function formatPrice(value, prefix = '₹') {
  const amount = priceNumber(value);
  return `${prefix}${amount.toLocaleString('en-IN')}`;
}

export function getPriceDisplay(product = {}) {
  const options = {
    ...DEFAULT_PRICE_DISPLAY_OPTIONS,
    ...(product.priceDisplayOptions || {})
  };
  const sellingPrice = priceNumber(product.price);
  const originalPrice = priceNumber(product.originalPrice);
  const discountedPrice = priceNumber(product.discountedPrice);
  const manualPercent = Number(product.discountPercentage);
  const percentBasePrice = discountedPrice || sellingPrice;
  const computedPercent = originalPrice > percentBasePrice
    ? Math.round(((originalPrice - percentBasePrice) / originalPrice) * 100)
    : 0;
  const discountPercent = Number.isFinite(manualPercent) && manualPercent > 0
    ? Math.round(manualPercent)
    : computedPercent;

  return {
    options,
    sellingPrice,
    originalPrice,
    discountedPrice,
    discountPercent,
    showSellingPrice: options.sellingPrice && sellingPrice > 0,
    showOriginalPrice: options.originalPrice && originalPrice > 0,
    showDiscountedPrice: options.discountedPrice && discountedPrice > 0,
    showDiscountPercent: options.discountPercentage && discountPercent > 0
  };
}
