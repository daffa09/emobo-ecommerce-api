export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"] as const;

export const PASSWORD_MIN_LENGTH = 6;

// email column is VarChar(50)
export const isValidEmail = (v: unknown): boolean =>
  typeof v === "string" && v.length <= 50 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export const isValidPassword = (v: unknown): boolean =>
  typeof v === "string" && v.length >= PASSWORD_MIN_LENGTH;

export const isValidRating = (v: unknown): boolean =>
  typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

export const isValidOrderStatus = (v: unknown): boolean =>
  ORDER_STATUSES.includes(v as (typeof ORDER_STATUSES)[number]);
