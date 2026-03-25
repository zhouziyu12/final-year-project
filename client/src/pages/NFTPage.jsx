import React from 'react';
import { Card, Badge, Skeleton } from '../components/ui';

export function NFTPage({ nfts, loading }) {
  return (
    <div className="space-y-6">
      <Card title="Model NFTs" subtitle="Verified AI model certificates" className="animate-fade-in-up">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : nfts && nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft, i) => <NFTCard key={i} nft={nft} />)}
          </div>
        ) : (
          <EmptyState />
        )}
      </Card>
    </div>
  );
}

function NFTCard({ nft }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-800/80">
      <div className="aspect-square bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center relative">
        <svg className="w-16 h-16 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        <div className="absolute top-3 right-3"><Badge variant="emerald">Verified</Badge></div>
      </div>
      <div className="p-4">
        <h4 className="text-white font-semibold truncate">{nft.name || 'Model NFT'}</h4>
        <p className="text-slate-500 text-xs font-mono mt-1">#{nft.tokenId || nft.id}</p>
        <div className="mt-3 flex justify-between text-sm">
          <span className="text-slate-500">Owner</span>
          <span className="text-cyan-400 font-mono text-xs">{nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}</span>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-slate-800/50 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <h3 className="text-lg font-medium text-white mb-1">No NFTs Yet</h3>
      <p className="text-slate-400 mb-4">Complete audits to mint your first NFT</p>
      <a href="#audit" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all">
        Start Audit
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
      </a>
    </div>
  );
}
