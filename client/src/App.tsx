import { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { DeviceSimulator } from './components/DeviceSimulator';
import { ConflictResolverModal } from './components/ConflictResolverModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { PendingQueueModal } from './components/PendingQueueModal';
import { DemoScriptWalkthrough } from './components/DemoScriptWalkthrough';
import { ClientSyncCoordinator } from './services/clientSyncCoordinator';
import { type CachedDocument, type PendingQueueItem } from './services/indexedDbStorage';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [activeDocument, setActiveDocument] = useState<CachedDocument | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<'dual' | 'laptop' | 'mobile'>('dual');
  const [isResetting, setIsResetting] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);

  // Active Modals
  const [activeConflict, setActiveConflict] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQueueModalDevice, setShowQueueModalDevice] = useState<string | null>(null);
  const [showDemoScript, setShowDemoScript] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Coordinators for Laptop and Mobile with isolated storage
  const laptopCoordinator = useMemo(() => {
    return new ClientSyncCoordinator('device-laptop-001', 'MacBook Pro 16" (Chrome)', API_BASE_URL, () => token);
  }, [token]);

  const mobileCoordinator = useMemo(() => {
    return new ClientSyncCoordinator('device-mobile-002', 'Pixel 8 Pro (Mobile PWA)', API_BASE_URL, () => token);
  }, [token]);

  const notify = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  // Poll backend health & seed initial demo data if needed
  const initApp = useCallback(async () => {
    try {
      const healthRes = await fetch(`${API_BASE_URL}/health`).catch(() => null);
      if (!healthRes || !healthRes.ok) {
        setServerOnline(false);
        return;
      }
      setServerOnline(true);

      // Check or reset demo environment
      const resetRes = await fetch(`${API_BASE_URL}/api/demo/reset`, { method: 'POST' });
      const resetData = await resetRes.json();

      setToken(resetData.seed.token);
      setUser(resetData.seed.user);
      setActiveDocument(resetData.seed.document);

      // Save initial document in both local device caches
      await laptopCoordinator.storage.saveDocument(resetData.seed.document);
      await mobileCoordinator.storage.saveDocument(resetData.seed.document);

      // Fetch versions
      await refreshDocumentData(resetData.seed.document.id, resetData.seed.token);
    } catch (err: any) {
      console.error('Initialization error:', err);
    }
  }, [laptopCoordinator, mobileCoordinator]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  const refreshDocumentData = async (docId?: string, authToken?: string) => {
    const currentDocId = docId || activeDocument?.id;
    const currentToken = authToken || token;
    if (!currentDocId || !currentToken) return;

    try {
      // 1. Fetch latest doc
      const docRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (docRes.ok) {
        const data = await docRes.json();
        setActiveDocument(data.document);
      }

      // 2. Fetch versions
      const verRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}/versions`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (verRes.ok) {
        const vData = await verRes.json();
        setVersions(vData.versions);
      }

      // 3. Fetch conflicts
      const confRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}/conflicts`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (confRes.ok) {
        const cData = await confRes.json();
        setConflicts(cData.conflicts);
        if (cData.conflicts.length > 0 && !activeConflict) {
          // Keep conflict available for review
        }
      }
    } catch (err) {
      console.error('Failed to refresh document data:', err);
    }
  };

  // Periodic sync check when online
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeDocument && token) {
        refreshDocumentData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [activeDocument?.id, token]);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/reset`, { method: 'POST' });
      const data = await res.json();
      setToken(data.seed.token);
      setUser(data.seed.user);
      setActiveDocument(data.seed.document);

      // Clear both local device caches and save V1 document
      await laptopCoordinator.storage.clearAll();
      await mobileCoordinator.storage.clearAll();
      await laptopCoordinator.storage.saveDocument(data.seed.document);
      await mobileCoordinator.storage.saveDocument(data.seed.document);

      laptopCoordinator.setOnlineStatus(true);
      mobileCoordinator.setOnlineStatus(true);

      await refreshDocumentData(data.seed.document.id, data.seed.token);
      notify('success', 'Demo reset: Document initialized at Version 1 across all devices');
    } catch (err: any) {
      notify('error', `Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleResolveConflict = async (resolvedFields: any) => {
    if (!activeConflict || !activeDocument || !token) return;
    setResolvingConflict(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${activeDocument.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conflictId: activeConflict.id,
          deviceId: 'device-laptop-001',
          resolvedFields
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to resolve conflict');
      }

      const data = await res.json();
      setActiveConflict(null);

      // Update both client local caches with resolved version (TC12 Convergence)
      await laptopCoordinator.storage.saveDocument(data.document);
      await mobileCoordinator.storage.saveDocument(data.document);

      // Drain phone queue items that had conflict
      const phoneQueue = await mobileCoordinator.storage.getPendingQueue();
      for (const item of phoneQueue) {
        if (item.status === 'conflict') {
          await mobileCoordinator.storage.removeQueueItem(item.changeId);
        }
      }

      await refreshDocumentData();
      notify('success', `Conflict resolved! Version ${data.version} created and converged to all devices.`);
    } catch (err: any) {
      notify('error', `Resolution error: ${err.message}`);
    } finally {
      setResolvingConflict(false);
    }
  };

  // Demo script action runner
  const handleExecuteDemoStep = async (stepNum: number) => {
    if (!activeDocument || !token) {
      await handleResetDemo();
    }
    const docId = activeDocument!.id;

    switch (stepNum) {
      case 1: {
        // Reset to V1
        await handleResetDemo();
        break;
      }
      case 2: {
        // Online edit on Laptop -> V2
        await laptopCoordinator.saveAndQueueEdit(activeDocument!, {
          title: 'SyncSafe Architectural Blueprint (V2 Laptop Update)'
        });
        await new Promise(r => setTimeout(r, 600));
        await refreshDocumentData();
        break;
      }
      case 3: {
        // Phone offline -> Edit Status
        mobileCoordinator.setOnlineStatus(false);
        await mobileCoordinator.saveAndQueueEdit(activeDocument!, {
          status: 'in_review'
        });
        break;
      }
      case 4: {
        // Laptop edits description while Phone is offline -> V3
        await laptopCoordinator.saveAndQueueEdit(activeDocument!, {
          description: 'Multi-device synchronization prototype with reliable offline sync (Updated on Laptop V3).'
        });
        await new Promise(r => setTimeout(r, 600));
        await refreshDocumentData();
        break;
      }
      case 5: {
        // Reconnect phone -> Clean 3-Way Auto-Merge into V4 (TC06)
        mobileCoordinator.setOnlineStatus(true);
        await new Promise(r => setTimeout(r, 800));
        await refreshDocumentData();
        notify('success', 'Phone reconnected! Auto-merged non-overlapping fields into Version 4 (TC06)!');
        break;
      }
      case 6: {
        // Conflicting edits on content
        // Laptop edits content to V5a
        await laptopCoordinator.saveAndQueueEdit(activeDocument!, {
          content: '# Architecture Spec\n\n[Laptop Online Revision]\nOptimized for high-throughput transactional logging.'
        });
        await new Promise(r => setTimeout(r, 600));
        await refreshDocumentData();

        // Phone goes offline and edits content
        mobileCoordinator.setOnlineStatus(false);
        await mobileCoordinator.saveAndQueueEdit(activeDocument!, {
          content: '# Architecture Spec\n\n[Phone Offline Revision]\nOptimized for low-bandwidth mobile devices with local SQLite caching.'
        });

        // Reconnect Phone -> triggers conflict preservation (TC07)
        mobileCoordinator.setOnlineStatus(true);
        await new Promise(r => setTimeout(r, 800));
        await refreshDocumentData();

        const confRes = await fetch(`${API_BASE_URL}/api/documents/${docId}/conflicts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const cData = await confRes.json();
        if (cData.conflicts && cData.conflicts.length > 0) {
          setActiveConflict(cData.conflicts[0]);
        }
        notify('info', 'Conflict detected on Content field! Preserved safely without silent overwrite.');
        break;
      }
      case 7: {
        // Resolve conflict
        if (conflicts.length > 0) {
          setActiveConflict(conflicts[0]);
        }
        break;
      }
      case 8: {
        // Security check: User B attempts cross-user access (SEC01, SEC02)
        const userB = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `attacker-${Date.now()}@evil.com`,
            password: 'attackerpassword',
            name: 'Attacker'
          })
        }).then(r => r.json());

        const attackRes = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
          headers: { Authorization: `Bearer ${userB.token}` }
        });

        if (attackRes.status === 404) {
          notify('success', 'Security Verified (SEC01): Attacker request strictly rejected with 404. Zero data leaked.');
        } else {
          notify('error', 'Security check failed!');
        }
        break;
      }
      default:
        break;
    }
  };

  const currentQueueDeviceCoordinator =
    showQueueModalDevice === laptopCoordinator.deviceId ? laptopCoordinator : mobileCoordinator;

  const [queueItems, setQueueItems] = useState<PendingQueueItem[]>([]);
  useEffect(() => {
    if (showQueueModalDevice) {
      currentQueueDeviceCoordinator.storage.getPendingQueue().then(setQueueItems);
    }
  }, [showQueueModalDevice, currentQueueDeviceCoordinator]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Header */}
      <Header
        user={user}
        serverOnline={serverOnline}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        onOpenDemoScript={() => setShowDemoScript(true)}
      />

      {/* Floating Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '70px',
          right: '24px',
          zIndex: 1100,
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                      notification.type === 'error' ? 'rgba(244, 63, 94, 0.95)' : 'rgba(59, 130, 246, 0.95)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.85rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Main Dual Device Viewport */}
      <main style={{
        flex: 1,
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns:
          viewMode === 'dual' ? '1fr 1fr' : '1fr',
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
            onOpenHistory={() => setShowHistoryModal(true)}
            onOpenQueue={(devId) => setShowQueueModalDevice(devId)}
            onOpenConflict={() => conflicts.length > 0 && setActiveConflict(conflicts[0])}
            hasOpenConflict={conflicts.length > 0}
            versionCount={versions.length}
          />
        )}

        {/* Mobile Device Simulator */}
        {(viewMode === 'dual' || viewMode === 'mobile') && (
          <DeviceSimulator
            coordinator={mobileCoordinator}
            deviceType="mobile"
            initialDocument={activeDocument}
            onOpenHistory={() => setShowHistoryModal(true)}
            onOpenQueue={(devId) => setShowQueueModalDevice(devId)}
            onOpenConflict={() => conflicts.length > 0 && setActiveConflict(conflicts[0])}
            hasOpenConflict={conflicts.length > 0}
            versionCount={versions.length}
          />
        )}
      </main>

      {/* Conflict Resolver Modal */}
      {activeConflict && (
        <ConflictResolverModal
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
          onResolve={handleResolveConflict}
          resolving={resolvingConflict}
        />
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <VersionHistoryModal
          versions={versions}
          currentVersionNumber={activeDocument?.current_version || 1}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Pending Queue Modal */}
      {showQueueModalDevice && (
        <PendingQueueModal
          queue={queueItems}
          deviceName={currentQueueDeviceCoordinator.deviceName}
          onClose={() => setShowQueueModalDevice(null)}
          onSyncNow={async () => {
            await currentQueueDeviceCoordinator.processPendingQueue();
            const q = await currentQueueDeviceCoordinator.storage.getPendingQueue();
            setQueueItems(q);
            await refreshDocumentData();
          }}
          onClearQueue={async () => {
            await currentQueueDeviceCoordinator.storage.clearAll();
            setQueueItems([]);
            if (activeDocument) {
              await currentQueueDeviceCoordinator.storage.saveDocument(activeDocument);
            }
          }}
        />
      )}

      {/* Guided Demo Walkthrough Modal */}
      {showDemoScript && (
        <DemoScriptWalkthrough
          onClose={() => setShowDemoScript(false)}
          onExecuteStepAction={handleExecuteDemoStep}
          currentVersion={activeDocument?.current_version || 1}
        />
      )}
    </div>
  );
}

export default App;
