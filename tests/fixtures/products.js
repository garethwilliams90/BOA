// Fixtures modeled on the two real dev-store test products described in AGENTS.md.
// Shapes mirror the JSON emitted by blocks/product-card.liquid's
// `<script type="application/json" data-product-card-variants>` payload.

export const snowboardWithColoredVariants = [
  {
    id: 1001,
    available: true,
    price: '$100.00',
    compareAtPrice: '$150.00',
    hasCompareAtPrice: true,
    color: 'Red',
    image: { src: 'https://cdn.shopify.com/red.jpg', srcset: '', alt: 'Red snowboard' },
  },
  {
    id: 1002,
    available: true,
    price: '$100.00',
    compareAtPrice: '$150.00',
    hasCompareAtPrice: true,
    color: 'Blue',
    image: { src: 'https://cdn.shopify.com/blue.jpg', srcset: '', alt: 'Blue snowboard' },
  },
  {
    id: 1003,
    available: false,
    price: '$100.00',
    compareAtPrice: '$150.00',
    hasCompareAtPrice: true,
    color: 'White',
    image: { src: 'https://cdn.shopify.com/white.jpg', srcset: '', alt: 'White snowboard' },
  },
];

// "The Collection Snowboard: Liquid" — single default variant, no Color option.
export const collectionSnowboardLiquid = [
  {
    id: 2001,
    available: true,
    price: '$85.00',
    compareAtPrice: '$85.00',
    hasCompareAtPrice: false,
    color: null,
    image: { src: 'https://cdn.shopify.com/liquid.jpg', srcset: '', alt: 'The Collection Snowboard: Liquid' },
  },
];
