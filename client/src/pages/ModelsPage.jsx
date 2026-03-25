import React from 'react';
import { useDevice } from '../hooks';

export function ModelsPage({ models, onRegister, loading }) {
  const { isMobile } = useDevice();

  if (isMobile) {
    // =========================================
    // MOBILE: Card-based list
    // =========================================
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Models</h1>
            <p className="text-zinc-400 text-sm">{models.length} registered</p>
          </div>
          <a href="#register" className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-900 font-semibold text-sm active:scale-95 transition-transform">
            + Add
          </a>
        </div>

        {models.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <p className="text-zinc-400">No models yet</p>
            <p className="text-zinc-500 text-sm mt-1">Register your first AI model</p>
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white truncate">{model.name || 'Unnamed Model'}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${model.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {model.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm truncate mb-2">{model.description || 'No description'}</p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono">{model.id?.slice(0, 10)}...</span>
                  <span>•</span>
                  <span>{model.chain || 'Unknown'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================
  // DESKTOP: Table-based list
  // =========================================
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Models</h1>
          <p className="text-zinc-400">{models.length} registered models</p>
        </div>
        <a href="#register" className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition-colors">
          + Register New Model
        </a>
      </div>

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="text-left px-4 py-3 text-zinc-400 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-zinc-400 text-sm font-medium">Description</th>
              <th className="text-left px-4 py-3 text-zinc-400 text-sm font-medium">Chain</th>
              <th className="text-left px-4 py-3 text-zinc-400 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-zinc-400 text-sm font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                  No models registered yet
                </td>
              </tr>
            ) : (
              models.map((model, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4 font-medium text-white">{model.name || 'Unnamed'}</td>
                  <td className="px-4 py-4 text-zinc-400">{model.description || '-'}</td>
                  <td className="px-4 py-4 text-zinc-400 capitalize">{model.chain || '-'}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${model.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {model.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-zinc-500">{model.id?.slice(0, 16)}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
