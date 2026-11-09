import assert from "node:assert/strict";
import test from "node:test";
import {
  getProductMinimumOrderQuantity,
  getProductStockLimit,
  isProductAvailable,
  isValidProductQuantity,
} from "../src/lib/productLimits";

test("legacy products without explicit limits remain purchasable", () => {
  const product = {};
  assert.equal(getProductMinimumOrderQuantity(product), 1);
  assert.equal(getProductStockLimit(product), null);
  assert.equal(isProductAvailable(product), true);
  assert.equal(isValidProductQuantity(product, 1), true);
  assert.equal(isValidProductQuantity(product, 1000), true);
  assert.equal(isValidProductQuantity(product, 1001), false);
});

test("finite stock and minimum order bounds are enforced", () => {
  const product = { stock: 8, minimumOrderQuantity: 3 };
  assert.equal(isProductAvailable(product), true);
  assert.equal(isValidProductQuantity(product, 2), false);
  assert.equal(isValidProductQuantity(product, 3), true);
  assert.equal(isValidProductQuantity(product, 8), true);
  assert.equal(isValidProductQuantity(product, 9), false);
  assert.equal(isValidProductQuantity(product, 3.5), false);
  assert.equal(isValidProductQuantity({ stock: 1500 }, 1000), true);
  assert.equal(isValidProductQuantity({ stock: 1500 }, 1001), false);
});

test("unlimited stock and minimum settings are independent", () => {
  const unlimitedStock = {
    stock: 0,
    minimumOrderQuantity: 4,
    isUnlimitedStock: true,
  };
  assert.equal(getProductStockLimit(unlimitedStock), null);
  assert.equal(isValidProductQuantity(unlimitedStock, 3), false);
  assert.equal(isValidProductQuantity(unlimitedStock, 4), true);

  const noMinimum = {
    stock: 5,
    minimumOrderQuantity: 4,
    isUnlimitedMinimumOrderQuantity: true,
  };
  assert.equal(getProductMinimumOrderQuantity(noMinimum), 1);
  assert.equal(isValidProductQuantity(noMinimum, 1), true);
  assert.equal(isValidProductQuantity(noMinimum, 6), false);
});

test("invalid or zero finite stock is unavailable", () => {
  assert.equal(isProductAvailable({ stock: 0 }), false);
  assert.equal(isProductAvailable({ stock: -1 }), false);
  assert.equal(
    isProductAvailable({ stock: 2, minimumOrderQuantity: 3 }),
    false
  );
});
