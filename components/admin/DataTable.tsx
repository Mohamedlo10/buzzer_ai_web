'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string, selected: boolean) => void;
  selectAll?: boolean;
  onSelectAll?: (selected: boolean) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  page = 0,
  totalPages = 1,
  onPageChange,
  searchPlaceholder = 'Rechercher...',
  onSearch,
  searchQuery = '',
  isLoading,
  onRowClick,
  selectedRows,
  onSelectRow,
  selectAll,
  onSelectAll,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a: any, b: any) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  return (
    <div className="bg-surface rounded-2xl border border-line overflow-hidden">
      {/* Search bar */}
      {onSearch && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line">
          <Search size={18} color="#FFFFFF60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-txt text-sm focus:outline-none placeholder-white/40"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line">
              {onSelectAll !== undefined && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-line bg-bg text-[#9B59B6] focus:ring-[#9B59B6]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 lg:px-4 py-2 lg:py-3 text-[10px] lg:text-xs font-semibold text-txt-60 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-txt select-none' : ''
                  }`}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="inline-flex">
                        {sortKey === col.key ? (
                          sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        ) : (
                          <ArrowUpDown size={14} color="#FFFFFF30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll !== undefined ? 1 : 0)} className="px-4 py-12 text-center text-txt-60">
                  Chargement...
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectAll !== undefined ? 1 : 0)} className="px-4 py-12 text-center text-txt-60">
                  Aucune donnée
                </td>
              </tr>
            ) : (
              sortedData.map((row) => {
                const id = keyExtractor(row);
                return (
                  <tr
                    key={id}
                    className={`border-b border-line last:border-b-0 transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-surface-2/30' : ''
                    }`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {onSelectRow !== undefined && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows?.has(id) || false}
                          onChange={(e) => onSelectRow(id, e.target.checked)}
                          className="rounded border-line bg-bg text-[#9B59B6] focus:ring-[#9B59B6]"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-2 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-txt-60">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-line">
          <span className="text-txt-40 text-xs">
            Page {page + 1} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg bg-surface-2 text-txt disabled:opacity-30 hover:bg-surface-2 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
