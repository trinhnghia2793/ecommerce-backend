import { ValueTransformer } from 'typeorm';

// convert values between ORM and postgres
export const decimalColumnTransformer: ValueTransformer = {
  // runs when write table to database
  to: (value?: number | null) => value,

  // runs when database returns value
  from: (value?: string | number | null) => {
    if (value === null || value === undefined) {
      return null;
    }

    const num = typeof value === 'number' ? value : Number(String(value));

    return Number.isFinite(num) ? num : 0;
  },
};

// declare decimal type (for price, weight...)
export const decimalColumn = {
  type: 'decimal' as const,
  precision: 18,
  scale: 2,
  transformer: decimalColumnTransformer,
};

// declare decimal type, but can be nullable
export const nullableDecimalColumn = {
  ...decimalColumn,
  nullable: true as const,
};
