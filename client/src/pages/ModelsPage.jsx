import React from 'react';
import { useDevice } from '../hooks';

function formatModelId(id) {
  if (id === null || id === undefined) return '-';
  return String(id);
}

export function ModelsPage({ models, loading }) {
  const { isMobile } = useDevice();

  if (isMobile) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Models</h1>
            <p className="text-sm text-zinc-400">{models.length} registered</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500">Loading models...</div>
        ) : models.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
              <svg className="h-8 w-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <p className="text-zinc-400">No models yet</p>
            <p className="mt-1 text-sm text-zinc-500">Register a model through the backend flow first</p>
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div key={`${model.chain}-${model.id}`} className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="truncate font-semibold text-white">{model.name || 'Unnamed Model'}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${model.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {model.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <p className="mb-2 truncate text-sm text-zinc-400">{model.description || 'No description'}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">{formatModelId(model.id)}</span>
                  <span>&bull;</span>
                  <span>{model.chain || 'Unknown'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Models</h1>
          <p className="text-zinc-400">{models.length} registered models</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/5">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Description</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Chain</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  Loading models...
                </td>
              </tr>
            ) : models.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No models registered yet
                </td>
              </tr>
            ) : (
              models.map((model) => (
                <tr key={`${model.chain}-${model.id}`} className="border-b border-white/5 transition-colors hover:bg-white/5">
                  <td className="px-4 py-4 font-medium text-white">{model.name || 'Unnamed'}</td>
                  <td className="px-4 py-4 text-zinc-400">{model.description || '-'}</td>
                  <td className="px-4 py-4 capitalize text-zinc-400">{model.chain || '-'}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${model.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {model.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-zinc-500">{formatModelId(model.id)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
