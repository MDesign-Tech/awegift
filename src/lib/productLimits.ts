import type { ProductType } from "../../type";

type ProductLimits = Pick<
  ProductType,
  | "stock"
  | "minimumOrderQuantity"
  | "isUnlimitedStock"
  | "isUnlimitedMinimumOrderQuantity"
>;

export const MAX_ORDER_QUANTITY = 1000;

export const getProductStockLimit = (
  product: Partial<ProductLimits>
): number | null => {
  if (product.isUnlimitedStock === true) return null;
  if (product.stock === null || product.stock === undefined) return null;
  return Number.isSafeInteger(product.stock) && product.stock >= 0
    ? product.stock
    : 0;
};

export const getProductMaximumOrderQuantity = (
  product: Partial<ProductLimits>
): number => {
  const stockLimit = getProductStockLimit(product);
  return stockLimit === null
    ? MAX_ORDER_QUANTITY
    : Math.min(stockLimit, MAX_ORDER_QUANTITY);
};

export const getProductMinimumOrderQuantity = (
  product: Partial<ProductLimits>
): number => {
  if (product.isUnlimitedMinimumOrderQuantity === true) return 1;
  const minimum = product.minimumOrderQuantity;
  return Number.isSafeInteger(minimum) && Number(minimum) >= 1
    ? Number(minimum)
    : 1;
};

export const isProductAvailable = (product: Partial<ProductLimits>): boolean => {
  const stockLimit = getProductStockLimit(product);
  return (
    getProductMinimumOrderQuantity(product) <=
      getProductMaximumOrderQuantity(product) &&
    (stockLimit === null || stockLimit > 0)
  );
};

export const isValidProductQuantity = (
  product: Partial<ProductLimits>,
  quantity: number
): boolean => {
  const minimum = getProductMinimumOrderQuantity(product);
  const maximum = getProductMaximumOrderQuantity(product);
  return (
    Number.isSafeInteger(quantity) &&
    quantity >= minimum &&
    quantity <= maximum
  );
};
