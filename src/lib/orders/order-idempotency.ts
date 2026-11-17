export function isValidOrderId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 128 &&
    value === value.trim() &&
    !value.includes("/") &&
    value !== "." &&
    value !== ".."
  );
}

export function isAlreadyExistingOrderError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = error.code;
  return code === 6 || code === "6" || code === "already-exists";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

interface OrderIntent {
  userId?: unknown;
  items?: unknown;
  orderAddress?: unknown;
}

export function isSameOrderIntent(
  existing: OrderIntent,
  requested: OrderIntent
): boolean {
  const existingItems = existing.items;
  const requestedItems = requested.items;
  if (
    existing.userId !== requested.userId ||
    !Array.isArray(existingItems) ||
    !Array.isArray(requestedItems) ||
    existingItems.length !== requestedItems.length
  ) {
    return false;
  }

  const sameItems = existingItems.every((existingItem, index) => {
    const requestedItem = requestedItems[index];
    if (!isRecord(existingItem) || !isRecord(requestedItem)) return false;
    return (
      existingItem.productId === requestedItem.productId &&
      existingItem.quantity === requestedItem.quantity
    );
  });
  if (!sameItems) return false;

  const existingAddress = isRecord(existing.orderAddress)
    ? existing.orderAddress.address
    : existing.orderAddress;
  const requestedAddress = isRecord(requested.orderAddress)
    ? requested.orderAddress.address
    : requested.orderAddress;
  return (
    typeof existingAddress === "string" &&
    existingAddress.trim().length > 0 &&
    existingAddress === requestedAddress
  );
}
