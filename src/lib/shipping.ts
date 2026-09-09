/**
 * Delivery pricing, shared by the checkout page and the order API so the
 * total the customer sees always matches the total stored with the order.
 * Values come from admin Settings → Shop / Orders.
 */
export type ShippingConfig = { flatRate: number; freeThreshold: number };

export function calculateDeliveryFee(
  subtotal: number,
  shipping: ShippingConfig = { flatRate: 0, freeThreshold: 0 },
): number {
  const flat = shipping.flatRate > 0 ? shipping.flatRate : 0;
  if (flat === 0) return 0;
  if (shipping.freeThreshold > 0 && subtotal >= shipping.freeThreshold) return 0;
  return Number(flat.toFixed(2));
}
