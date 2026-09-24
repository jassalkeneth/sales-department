import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | boolean | Date | null | undefined;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

const compareValues = (left: SortValue, right: SortValue) => {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  const leftValue = left instanceof Date ? left.getTime() : left;
  const rightValue = right instanceof Date ? right.getTime() : right;

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return leftValue - rightValue;
  }

  if (typeof leftValue === 'boolean' && typeof rightValue === 'boolean') {
    return Number(leftValue) - Number(rightValue);
  }

  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
};

export function useSortableData<T>(
  items: T[],
  accessors: Record<string, (item: T) => SortValue>,
  initialConfig?: SortConfig
) {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(initialConfig || null);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;

    const accessor = accessors[sortConfig.key];
    if (!accessor) return items;

    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    return [...items].sort((left, right) => compareValues(accessor(left), accessor(right)) * direction);
  }, [items, accessors, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return { sortedItems, sortConfig, requestSort };
}
