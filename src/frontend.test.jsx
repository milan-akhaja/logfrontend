// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { priceNumber, formatPrice, getPriceDisplay } from './lib/pricing';
import ProductPrice from './components/ProductPrice';
import Terms from './pages/Terms';

describe('Pricing Helper Functions', () => {
  it('priceNumber parses string values correctly', () => {
    expect(priceNumber('499')).toBe(499);
    expect(priceNumber('invalid')).toBe(0);
    expect(priceNumber(-10)).toBe(0);
  });

  it('formatPrice formats correctly with currency prefix', () => {
    expect(formatPrice(499)).toBe('₹499');
    expect(formatPrice(1250, '$')).toBe('$1,250');
  });

  it('getPriceDisplay calculates discounts correctly', () => {
    const product = {
      price: 800,
      originalPrice: 1000,
      discountPercentage: 0
    };
    const display = getPriceDisplay(product);
    expect(display.sellingPrice).toBe(800);
    expect(display.originalPrice).toBe(1000);
    expect(display.discountPercent).toBe(20); // (1000-800)/1000 = 20%
    expect(display.showSellingPrice).toBe(true);
    expect(display.showOriginalPrice).toBe(true);
    expect(display.showDiscountPercent).toBe(true);
  });
});

describe('ProductPrice React Component', () => {
  it('renders correct current and original prices', () => {
    const product = {
      price: 800,
      originalPrice: 1000
    };
    render(<ProductPrice product={product} />);
    
    // Check if the current selling price is rendered
    expect(screen.getByText('₹800')).toBeDefined();
    
    // Check if the original price is rendered
    expect(screen.getByText('₹1,000')).toBeDefined();
    
    // Check if the discount percent text is rendered
    expect(screen.getByText('20% OFF')).toBeDefined();
  });
});

describe('Terms React Component', () => {
  it('renders the Offer Terms section correctly', () => {
    render(<Terms />);
    
    // Check for section heading
    expect(screen.getByRole('heading', { name: /OFFER TERMS/i })).toBeDefined();
    
    // Check for specific text content from the offer terms
    expect(screen.getByText(/Buy 1 Get 1 Free/i)).toBeDefined();
    expect(screen.getByText(/not eligible for return or exchange/i)).toBeDefined();
    expect(screen.getByText(/48 hours/i)).toBeDefined();
  });
});
