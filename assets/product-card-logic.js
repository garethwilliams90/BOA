(function (global) {
  function findVariant(variants, { variantId, colorValue } = {}) {
    if (!Array.isArray(variants)) {
      return undefined;
    }

    const byId = variants.find((variant) => variant.id === variantId);

    if (byId) {
      return byId;
    }

    return variants.find((variant) => variant.color === colorValue);
  }

  function getSelectedVariant(variants, selectedVariantId) {
    if (!Array.isArray(variants)) {
      return undefined;
    }

    return variants.find((variant) => variant.id === selectedVariantId);
  }

  function deriveCtaState(variant, { availableText, soldOutText } = {}) {
    if (!variant) {
      return { disabled: true, text: soldOutText };
    }

    return variant.available
      ? { disabled: false, text: availableText }
      : { disabled: true, text: soldOutText };
  }

  function canAddToCart(variant, { isAdding = false } = {}) {
    return Boolean(variant) && variant.available === true && !isAdding;
  }

  const ProductCardLogic = {
    findVariant,
    getSelectedVariant,
    deriveCtaState,
    canAddToCart,
  };

  global.ProductCardLogic = ProductCardLogic;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductCardLogic;
  }
})(typeof window !== 'undefined' ? window : globalThis);
