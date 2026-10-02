import React, { useState } from 'react';
import {
  Cpu,
  Laptop,
  Smartphone,
  Columns,
  RotateCcw,
  BookOpen,
  RefreshCw
} from 'lucide-react';
import { DeviceSimulator } from './DeviceSimulator';
import { ClientSyncCoordinator } from '../services/clientSyncCoordinator';
import { type CachedDocument } from '../services/indexedDbStorage';

interface SyncLabViewProps {
  laptopCoordinator: ClientSyncCoordinator;
  mobileCoordinator: ClientSyncCoordinator;
  activeDocument: CachedDocument | null;
  onOpenHistory: (deviceId: string) => void;
  onOpenQueue: (deviceId: string) => void;
  onOpenConflict: (deviceId: string) => void;
  hasOpenConflict: boolean;
  versionCount: number;
  onResetDemo: () => void;
  isResetting: boolean;
  onOpenDemoScript: () => void;
}

export const SyncLabView: React.FC<SyncLabViewProps> = ({
  laptopCoordinator,
  mobileCoordinator,
  activeDocument,
  onOpenHistory,
  onOpenQueue,
  onOpenConflict,
  hasOpenConflict,
  versionCount,
  onResetDemo,
  isResetting,
  onOpenDemoScript
}) => {
  const [viewMode, setViewMode] = useState<'dual' | 'laptop' | 'mobile'>('dual');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-app)',
      overflowY: 'auto'
    }}>
      {/* Top Banner / Controls */}
      <div style={{
        padding: '16px 28px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#c084fc" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Sync Lab
            </h1>
            <span style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(192, 132, 252, 0.2)',
              color: '#e9d5ff'
            }}>
              PS-13 Engine
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Simulate concurrent edits, durable offline queues, network chaos, 3-way auto-merge & conflict preservation.
          </p>
        </div>

        {/* Action Buttons & View Mode Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface-elevated)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.75rem'
          }}>
            <button
              onClick={() => setViewMode('dual')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'dual' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: viewMode === 'dual' ? '#60a5fa' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title="Show both devices simultaneously"
            >
              <Columns size={13} />
              <span>Dual View</span>
            </button>
            <button
              onClick={() => setViewMode('laptop')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'laptop' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: viewMode === 'laptop' ? '#60a5fa' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Laptop size={13} />
              <span>MacBook</span>
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: viewMode === 'mobile' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: viewMode === 'mobile' ? '#c084fc' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Smartphone size={13} />
              <span>Pixel 8</span>
            </button>
          </div>

          {/* Guided Demo Script Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onOpenDemoScript}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={14} color="#60a5fa" />
            <span>Guided Demo Script</span>
          </button>

          {/* Reset Demo Button */}
          <button
            className="btn btn-outline btn-sm"
            onClick={onResetDemo}
            disabled={isResetting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
          >
            {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            <span>{isResetting ? 'Resetting...' : 'Reset Demo (V1)'}</span>
          </button>
        </div>
      </div>

      {/* Main Dual Device Viewport */}
      <div style={{
        flex: 1,
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: viewMode === 'dual' ? '1fr 1fr' : '1fr',
        gap: '20px',
        maxWidth: viewMode === 'dual' ? '1600px' : '900px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Laptop Device Simulator */}
        {(viewMode === 'dual' || viewMode === 'laptop') && (
          <DeviceSimulator
            coordinator={laptopCoordinator}
            deviceType="laptop"
            initialDocument={activeDocument}
            onOpenHistory={onOpenHistory}
            onOpenQueue={onOpenQueue}
            onOpenConflict={onOpenConflict}
            hasOpenConflict={hasOpenConflict}
            versionCount={versionCount}
          />
        )}

        {/* Mobile Device Simulator */}
        {(viewMode === 'dual' || viewMode === 'mobile') && (
          <DeviceSimulator
            coordinator={mobileCoordinator}
            deviceType="mobile"
            initialDocument={activeDocument}
            onOpenHistory={onOpenHistory}
            onOpenQueue={onOpenQueue}
            onOpenConflict={onOpenConflict}
            hasOpenConflict={hasOpenConflict}
            versionCount={versionCount}
          />
        )}
      </div>
    </div>
  );
};
