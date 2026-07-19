import { describe, expect, it } from 'vitest';
import ProductCardLogic from '../assets/product-card-logic.js';
import { collectionSnowboardLiquid, snowboardWithColoredVariants } from './fixtures/products.js';

const { findVariant, getSelectedVariant, deriveCtaState, canAddToCart } = ProductCardLogic;

describe('findVariant — "Snowboard with colored variants" (Red/Blue/White)', () => {
  it('resolves the Red variant by color value, as a swatch click would', () => {
    const variant = findVariant(snowboardWithColoredVariants, { variantId: NaN, colorValue: 'Red' });

    expect(variant).toBeDefined();
    expect(variant.id).toBe(1001);
    expect(variant.available).toBe(true);
  });

  it('resolves the Blue variant by color value', () => {
    const variant = findVariant(snowboardWithColoredVariants, { variantId: NaN, colorValue: 'Blue' });

    expect(variant.id).toBe(1002);
  });

  it('resolves the out-of-stock White variant by color value', () => {
    const variant = findVariant(snowboardWithColoredVariants, { variantId: NaN, colorValue: 'White' });

    expect(variant.id).toBe(1003);
    expect(variant.available).toBe(false);
  });

  it('prefers an exact variant id match over the color value', () => {
    const variant = findVariant(snowboardWithColoredVariants, { variantId: 1002, colorValue: 'Red' });

    expect(variant.id).toBe(1002);
  });

  it('returns undefined when neither id nor color match anything', () => {
    const variant = findVariant(snowboardWithColoredVariants, { variantId: 9999, colorValue: 'Green' });

    expect(variant).toBeUndefined();
  });
});

describe('findVariant — "The Collection Snowboard: Liquid" (no Color option)', () => {
  it('resolves its single variant by id, with no color-based lookup involved', () => {
    const variant = findVariant(collectionSnowboardLiquid, { variantId: 2001, colorValue: undefined });

    expect(variant).toBeDefined();
    expect(variant.id).toBe(2001);
    expect(variant.color).toBeNull();
  });

  it('never accidentally matches by a null/undefined color across products', () => {
    // Guards against a regression where `color: null` on every variant of a
    // colorless product could cause a false-positive match via `colorValue: undefined`.
    const variant = findVariant(collectionSnowboardLiquid, { variantId: 9999, colorValue: undefined });

    expect(variant).toBeUndefined();
  });
});

describe('getSelectedVariant', () => {
  it('finds the currently selected variant id out of the full variant list', () => {
    const variant = getSelectedVariant(snowboardWithColoredVariants, 1003);

    expect(variant.color).toBe('White');
  });

  it('returns undefined for an id that is not part of the product', () => {
    expect(getSelectedVariant(snowboardWithColoredVariants, 4242)).toBeUndefined();
  });
});

describe('deriveCtaState', () => {
  it('enables the CTA with the "available" text for an in-stock variant', () => {
    const redVariant = snowboardWithColoredVariants[0];
    const state = deriveCtaState(redVariant, { availableText: 'Add to cart', soldOutText: 'Sold out' });

    expect(state).toEqual({ disabled: false, text: 'Add to cart' });
  });

  it('disables the CTA with the "out-of-stock" text for the White variant', () => {
    const whiteVariant = snowboardWithColoredVariants[2];
    const state = deriveCtaState(whiteVariant, { availableText: 'Add to cart', soldOutText: 'Sold out' });

    expect(state).toEqual({ disabled: true, text: 'Sold out' });
  });

  it('disables the CTA when no variant is resolved at all', () => {
    const state = deriveCtaState(undefined, { availableText: 'Add to cart', soldOutText: 'Sold out' });

    expect(state).toEqual({ disabled: true, text: 'Sold out' });
  });

  it('derives correct CTA state for the single-variant, no-color product', () => {
    const onlyVariant = collectionSnowboardLiquid[0];
    const state = deriveCtaState(onlyVariant, { availableText: 'Add to cart', soldOutText: 'Sold out' });

    expect(state).toEqual({ disabled: false, text: 'Add to cart' });
  });
});

describe('canAddToCart', () => {
  it('allows adding an available variant when not already adding', () => {
    expect(canAddToCart(snowboardWithColoredVariants[0], { isAdding: false })).toBe(true);
  });

  it('blocks adding the out-of-stock White variant even if clicked', () => {
    expect(canAddToCart(snowboardWithColoredVariants[2], { isAdding: false })).toBe(false);
  });

  it('blocks a second add while a request is already in flight', () => {
    expect(canAddToCart(snowboardWithColoredVariants[0], { isAdding: true })).toBe(false);
  });

  it('blocks adding when there is no resolved variant', () => {
    expect(canAddToCart(undefined, { isAdding: false })).toBe(false);
  });
});
