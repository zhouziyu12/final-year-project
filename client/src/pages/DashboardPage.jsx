import React from 'react';
import { Card, StatCard, StatusDot, Skeleton } from '../components/ui';

export function DashboardPage({ status, loading }) {
  const stats = [
    { label: 'Models', value: status?.totalModels || 0, accent: 'cyan' },
    { label: 'Audits', value: status?.totalAudits || 0, accent: 'emerald' },
    { label: 'ZK Engine', value: status?.zkReady ? 'Active' : 'Off', accent: status?.zkReady ? 'purple' : 'rose' },
    { label: 'IPFS', value: 'Online', accent: 'amber' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
            {loading ? <Skeleton className="h-32" /> : <StatCard {...stat} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Networks" className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {loading ? <Skeleton className="h-40" /> : (
            <div className="space-y-3">
              {Object.entries(status?.chains || {}).map(([chain, info]) => (
                <div key={chain} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <StatusDot status={info.connected ? 'online' : 'offline'} />
                    <span className="text-white capitalize">{chain}</span>
                  </div>
                  <span className="text-cyan-400 font-mono text-sm">#{info.blockNumber?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Actions" className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="grid grid-cols-2 gap-3">
            <a href="#register" className="flex items-center gap-3 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              </div>
              <span className="text-cyan-400">Register</span>
            </a>
            <a href="#audit" className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
              </div>
              <span className="text-emerald-400">Verify</span>
            </a>
            <a href="#nft" className="flex items-center gap-3 p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 transition-all">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
              </div>
              <span className="text-purple-400">NFTs</span>
            </a>
            <a href="#" className="flex items-center gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-all">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
              </div>
              <span className="text-amber-400">Stats</span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
