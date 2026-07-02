import React from 'react';
import { formatPrice, getPriceDisplay } from '../lib/pricing';

export default function ProductPrice({
  product,
  prefix = '₹',
  className = 'product-prices',
  currentClassName = 'price-current',
  originalClassName = 'price-original',
  compact = false
}) {
  const price = getPriceDisplay(product);

  return (
    <div className={className}>
      <div className="product-price-line">
        {price.showSellingPrice && (
          <span className={currentClassName}>{formatPrice(price.sellingPrice, prefix)}</span>
        )}
        {price.showDiscountedPrice && (
          <span className="price-discounted">{formatPrice(price.discountedPrice, prefix)}</span>
        )}
        {price.showOriginalPrice && price.originalPrice !== price.sellingPrice && (
          <span className={originalClassName}>{formatPrice(price.originalPrice, prefix)}</span>
        )}
      </div>
      {price.showDiscountPercent && (
        <span className={`price-discount-percent${compact ? ' compact' : ''}`}>
          {price.discountPercent}% OFF
        </span>
      )}
    </div>
  );
}
