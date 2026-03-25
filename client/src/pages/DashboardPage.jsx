import React from 'react';
import { Card, Badge, StatusDot, Skeleton } from '../components/ui';

/**
 * Dashboard Page
 */
export function DashboardPage({ status, loading }) {
  const stats = [
    { label: 'Total Models', value: status?.totalModels || 0, color: 'text-blue-600' },
    { label: 'Total Audits', value: status?.totalAudits || 0, color: 'text-emerald-600' },
    { label: 'IPFS Storage', value: status?.ipfsStorage || 'Connected', color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="text-center">
            {loading ? (
              <>
                <Skeleton className="h-4 w-20 mx-auto mb-2" />
                <Skeleton className="h-8 w-16 mx-auto" />
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </>
            )}
          </Card>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Status */}
        <Card title="Network Status">
          {loading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-3">
              {Object.entries(status?.chains || {}).map(([chain, info]) => (
                <div key={chain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusDot status={info.connected ? 'online' : 'offline'} />
                    <span className="font-medium capitalize">{chain}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Block #{info.blockNumber?.toLocaleString() || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {info.contractAddress || 'No contract'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="space-y-3">
            <QuickAction
              icon="M12 6v6m0 0v6m0-6h6m-6 0H6"
              title="Register New Model"
              description="Add your AI model to the blockchain"
              to="#register"
            />
            <QuickAction
              icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              title="Verify Model"
              description="Generate ZK proof for a model"
              to="#audit"
            />
            <QuickAction
              icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              title="View NFT Gallery"
              description="Browse verified model NFTs"
              to="#nft"
            />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="System Info">
        {loading ? (
          <Skeleton className="h-32" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem label="Server" value="Online" />
            <InfoItem label="API Version" value="v1.0.0" />
            <InfoItem label="ZK Circuit" value={status?.zkReady ? 'Ready' : 'Loading'} />
            <InfoItem label="Last Sync" value={new Date().toLocaleTimeString()} />
          </div>
        )}
      </Card>
    </div>
  );
}

function QuickAction({ icon, title, description, to }) {
  return (
    <a
      href={to}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </a>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="text-center p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
