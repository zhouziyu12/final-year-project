import React from 'react';
import { useDevice } from '../hooks';

function StatCard({ label, value, accent = 'cyan' }) {
  const colors = {
    cyan: { bg: 'from-cyan-500/15 to-cyan-500/5', text: 'text-cyan-400', border: 'border-cyan-500/20' },
    emerald: { bg: 'from-emerald-500/15 to-emerald-500/5', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    purple: { bg: 'from-purple-500/15 to-purple-500/5', text: 'text-purple-400', border: 'border-purple-500/20' },
    amber: { bg: 'from-amber-500/15 to-amber-500/5', text: 'text-amber-400', border: 'border-amber-500/20' },
  };
  const c = colors[accent] || colors.cyan;
  return (
    <div className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg} p-4 sm:p-5 transition-all hover:scale-[1.02]`}>
      <p className="text-zinc-400 text-xs sm:text-sm mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${c.text}`}>{value}</p>
    </div>
  );
}

function NetworkStatus({ chain, info }) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${info.connected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-zinc-600'}`} />
        <span className="text-white font-medium capitalize">{chain}</span>
      </div>
      <span className="text-cyan-400 font-mono text-sm">#{info.blockNumber?.toLocaleString()}</span>
    </div>
  );
}

export function DashboardPage({ status, loading }) {
  const { isMobile } = useDevice();
  
  const stats = [
    { label: 'Models', value: status?.totalModels || 0, accent: 'cyan' },
    { label: 'Audits', value: status?.totalAudits || 0, accent: 'emerald' },
    { label: 'ZK Engine', value: status?.zkReady ? 'Active' : 'Off', accent: status?.zkReady ? 'purple' : 'amber' },
    { label: 'IPFS', value: 'Online', accent: 'amber' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className={`font-bold text-white ${isMobile ? 'text-xl' : 'text-2xl'} mb-1`}>
          {isMobile ? 'Dashboard' : 'AI Model Provenance'}
        </h1>
        <p className="text-zinc-400 text-sm">ZK-Powered Verification System</p>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-3 sm:gap-4 animate-fade-in-up ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`} style={{ animationDelay: '0.1s' }}>
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Networks */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className={`font-semibold text-zinc-300 mb-3 ${isMobile ? 'text-sm' : ''}`}>Networks</h2>
        <div className="space-y-2">
          {Object.entries(status?.chains || {}).map(([chain, info]) => (
            <NetworkStatus key={chain} chain={chain} info={info} />
          ))}
        </div>
      </div>

      {/* Quick Actions - Desktop only */}
      {!isMobile && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="font-semibold text-zinc-300 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-4">
            <a href="#models" className="flex items-center gap-4 p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <div>
                <h3 className="text-cyan-400 font-semibold">Register Model</h3>
                <p className="text-zinc-400 text-sm">Add new AI model</p>
              </div>
            </a>
            <a href="#audit" className="flex items-center gap-4 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-emerald-400 font-semibold">Verify Model</h3>
                <p className="text-zinc-400 text-sm">Audit with ZK</p>
              </div>
            </a>
            <a href="#nft" className="flex items-center gap-4 p-5 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
              </div>
              <div>
                <h3 className="text-purple-400 font-semibold">View NFTs</h3>
                <p className="text-zinc-400 text-sm">Ownership records</p>
              </div>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
