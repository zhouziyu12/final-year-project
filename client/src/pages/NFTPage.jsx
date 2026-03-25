import React from 'react';
import { Card, Badge, Skeleton } from '../components/ui';

/**
 * NFT Page
 */
export function NFTPage({ nfts, loading }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card title="Model NFTs" subtitle="Verified AI model certificates on blockchain">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : nfts && nfts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nfts.map((nft, i) => (
              <NFTCard key={i} nft={nft} />
            ))}
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
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-lg">
      {/* NFT Image */}
      <div className="aspect-square bg-gradient-to-br from-blue-500 to-purple-600 relative flex items-center justify-center">
        <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="absolute top-3 right-3">
          <Badge variant="success">Verified</Badge>
        </div>
      </div>
      
      {/* NFT Info */}
      <div className="p-4">
        <h4 className="text-white font-semibold truncate mb-1">{nft.name || 'Model NFT'}</h4>
        <p className="text-gray-400 text-xs font-mono mb-3 truncate">#{nft.tokenId || nft.id}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Owner</span>
            <span className="text-gray-300 font-mono text-xs">{nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Model</span>
            <span className="text-gray-300 font-mono text-xs truncate ml-2">{nft.modelId?.slice(0, 8)}...</span>
          </div>
        </div>
        
        <a 
          href={`https://testnet.bscscan.com/token/${nft.contractAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full py-2 text-center text-sm text-blue-400 hover:text-blue-300 border border-blue-500/50 rounded-lg transition-colors"
        >
          View on Explorer
        </a>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-1">No NFTs Yet</h3>
      <p className="text-gray-500 mb-4">Complete model audits to mint your first NFT</p>
      <a 
        href="#audit"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Start Audit
        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </a>
    </div>
  );
}
