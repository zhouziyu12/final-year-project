import React from 'react';
import { useDevice } from '../hooks';

export function NFTPage({ nfts, loading }) {
  const { isMobile } = useDevice();

  if (isMobile) {
    // =========================================
    // MOBILE: Vertical list
    // =========================================
    return (
      <div className="space-y-4 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-white">NFTs</h1>
          <p className="text-zinc-400 text-sm">Ownership records</p>
        </div>

        {nfts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
              </svg>
            </div>
            <p className="text-zinc-400">No NFTs yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nfts.map((nft, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <h3 className="font-semibold text-white truncate">{nft.name || 'NFT'}</h3>
                <p className="text-zinc-500 text-sm">{nft.tokenId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================
  // DESKTOP: Grid gallery
  // =========================================
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">NFT Gallery</h1>
        <p className="text-zinc-400">Ownership records and provenance</p>
      </div>

      {nfts.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-zinc-800/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
            </svg>
          </div>
          <p className="text-zinc-400">No NFTs minted yet</p>
          <p className="text-zinc-500 text-sm mt-1">Register a model to mint its NFT</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {nfts.map((nft, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
              <div className="aspect-square rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 mb-3" />
              <h3 className="font-semibold text-white truncate">{nft.name || 'NFT'}</h3>
              <p className="text-zinc-500 text-sm font-mono">#{nft.tokenId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
