import React from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { SortConfig } from '../hooks/useSortableData';

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  sortKey,
  sortConfig,
  onSort,
  align = 'left',
  className = ''
}) => {
  const isActive = sortConfig?.key === sortKey;
  const Icon = !isActive ? ChevronsUpDown : sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th
      className={className}
      aria-sort={isActive ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`group flex w-full items-center gap-1 ${justify} whitespace-nowrap hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <Icon className={`h-3 w-3 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'}`} />
      </button>
    </th>
  );
};
