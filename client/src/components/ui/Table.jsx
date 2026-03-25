import React from 'react';
import { Skeleton } from './Spinner';

/**
 * Cyber Table Component
 */
export function Table({ 
  columns = [],
  data = [],
  emptyText = 'No data available',
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div 
        className="rounded-xl border border-white/5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(18, 20, 28, 0.95) 100%)' }}
      >
        <div className="p-8 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div 
        className="rounded-xl border border-white/5 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(18, 20, 28, 0.95) 100%)' }}
      >
        <div className="p-16 text-center">
          {/* Empty state icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-slate-400">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-xl border border-white/5 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(135deg, rgba(22, 24, 34, 0.9) 0%, rgba(18, 20, 28, 0.95) 100%)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody className="divide-y divide-white/5">
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex}
                className="hover:bg-white/5 transition-colors duration-150"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-slate-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Table Row Actions
 */
export function TableActions({ actions }) {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className={`
            p-2 rounded-lg transition-all duration-200
            ${action.variant === 'danger' 
              ? 'text-rose-400 hover:bg-rose-500/10' 
              : action.variant === 'success'
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-cyan-400 hover:bg-cyan-500/10'
            }
          `}
          title={action.label}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
