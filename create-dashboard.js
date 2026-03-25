const fs = require('fs');

const content = `import React from 'react';
import { Card, Skeleton } from '../components/ui';

function StatCard({ label, value, accent = 'cyan' }) {
  const colors = {
    cyan: { bg: 'from-cyan-500/20 to-cyan-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    emerald: { bg: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    purple: { bg: 'from-purple-500/20 to-purple-500/5', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-400', border: 'border-amber-500/20' },
    rose: { bg: 'from-rose-500/20 to-rose-500/5', text: 'text-rose-400', border: 'border-rose-500/20' },
  };
  const c = colors[accent] || colors.cyan;
  return (
    <div className={\`relative overflow-hidden rounded-xl sm:rounded-2xl border \${c.border} bg-gradient-to-br \${c.bg} p-4 sm:p-6 transition-all duration-300 hover:scale-[1.02]\`}>
      <p className="text-xs sm:text-sm text-slate-400 mb-1 sm:mb-2">{label}</p>
      <p className={\`text-2xl sm:text-3xl font-bold \${c.text}\`}>{value}</p>
    </div>
  );
}

function StatusDot({ status }) {
  return <div className={\`w-2.5 h-2.5 rounded-full \${status === 'online' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-600'}\`} />;
}

export function DashboardPage({ status, loading }) {
  const stats = [
    { label: 'Models', value: status?.totalModels || 0, accent: 'cyan' },
    { label: 'Audits', value: status?.totalAudits || 0, accent: 'emerald' },
    { label: 'ZK Engine', value: status?.zkReady ? 'Active' : 'Off', accent: status?.zkReady ? 'purple' : 'rose' },
    label: 'IPFS', value: 'Online', accent: 'amber' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: \`\${i * 0.1}s\` }}>
            {loading ? <Skeleton className="h-28 sm:h-32" /> : <StatCard {...stat} />}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-500 to-purple-500" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Networks</h3>
          </div>
          {loading ? <Skeleton className="h-36 sm:h-40" /> : (
            <div className="space-y-2.5">
              {Object.entries(status?.chains || {}).map(([chain, info]) => (
                <div key={chain} className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-slate-900/50 border border-white/5">
                  <div className="flex items-center gap-3">
                    <StatusDot status={info.connected ? 'online' : 'offline'} />
                    <span className="text-white capitalize">{chain}</span>
                  </div>
                  <span className="text-cyan-400 font-mono text-sm">#\${info.blockNumber?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-500 to-purple-500" />
            <h3 className="text-base sm:text-lg font-semibold text-white">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href="#models" className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all active:scale-95">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <span className="text-cyan-400 font-medium">Register</span>
            </a>
            <a href="#audit" className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all active:scale-95">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="text-emerald-400 font-medium">Verify</span>
            </a>
            <a href="#nft" className="flex items-center gap-3 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all active:scale-95">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-purple-400 font-medium">NFTs</span>
            </a>
            <a href="#audit" className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all active:scale-95">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 