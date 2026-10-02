import React, { useState } from 'react';
import {
  Cpu,
  Laptop,
  Smartphone,
  Columns,
  RotateCcw,
  BookOpen,
  RefreshCw,
  ArrowLeftRight,
  Server
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
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={20} color="#7c3aed" />
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Sync Lab
            </h1>
            <span style={{
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '4px',
              background: 'rgba(124, 58, 237, 0.1)',
              color: '#7c3aed'
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
            background: '#ffffff',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-medium)',
            fontSize: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
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
                background: viewMode === 'dual' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                color: viewMode === 'dual' ? '#2563eb' : 'var(--text-secondary)',
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
                background: viewMode === 'laptop' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                color: viewMode === 'laptop' ? '#2563eb' : 'var(--text-secondary)',
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
                background: viewMode === 'mobile' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
                color: viewMode === 'mobile' ? '#7c3aed' : 'var(--text-secondary)',
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
            <BookOpen size={14} color="#2563eb" />
            <span>Guided Demo Script</span>
          </button>

          {/* Reset Demo Button */}
          <button
            className="btn btn-outline btn-sm"
            onClick={onResetDemo}
            disabled={isResetting}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            {isResetting ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            <span>{isResetting ? 'Resetting...' : 'Reset Demo (V1)'}</span>
          </button>
        </div>
      </div>

      {/* Sync Flow Indicator Strip */}
      {viewMode === 'dual' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '8px 24px',
          background: 'rgba(255, 255, 255, 0.65)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#2563eb', fontWeight: 600 }}>
            <Laptop size={14} />
            <span>MacBook Pro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <span style={{ height: '1px', width: '28px', background: 'var(--border-medium)' }} />
            <ArrowLeftRight size={13} color="#2563eb" />
            <span style={{ height: '1px', width: '28px', background: 'var(--border-medium)' }} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            color: '#2563eb',
            fontWeight: 700
          }}>
            <Server size={13} />
            <span>SQLite WAL · 3-Way Auto-Merge Consensus</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <span style={{ height: '1px', width: '28px', background: 'var(--border-medium)' }} />
            <ArrowLeftRight size={13} color="#7c3aed" />
            <span style={{ height: '1px', width: '28px', background: 'var(--border-medium)' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7c3aed', fontWeight: 600 }}>
            <Smartphone size={14} />
            <span>Pixel 8 Pro</span>
          </div>
        </div>
      )}

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
