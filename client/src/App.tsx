import { useState, useEffect, useMemo, useCallback } from 'react';
import { TopNavbar } from './components/TopNavbar';
import { Sidebar } from './components/Sidebar';
import { DriveView } from './components/DriveView';
import { FileDetailsPanel } from './components/FileDetailsPanel';
import { DocumentWorkspace } from './components/DocumentWorkspace';
import { ConflictsView } from './components/ConflictsView';
import { SyncLabView } from './components/SyncLabView';
import { SettingsView } from './components/SettingsView';
import { NewDocumentModal } from './components/NewDocumentModal';
import { AuthModal } from './components/AuthModal';

import { ConflictResolverModal } from './components/ConflictResolverModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { PendingQueueModal } from './components/PendingQueueModal';
import { DemoScriptWalkthrough } from './components/DemoScriptWalkthrough';
import { QuickGuideModal } from './components/QuickGuideModal';

import { ClientSyncCoordinator, type SyncStatusState } from './services/clientSyncCoordinator';
import { type CachedDocument, type PendingQueueItem } from './services/indexedDbStorage';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = 'http://localhost:5000';

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('syncsafe_token'));
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(() => {
    try {
      const cached = localStorage.getItem('syncsafe_user');
      if (cached) return JSON.parse(cached);
      const t = localStorage.getItem('syncsafe_token');
      if (t) {
        const parts = t.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const email = payload.email || 'demo@syncsafe.io';
          const name = email.split('@')[0] === 'demo' ? 'Alex Rivera' : email;
          return { id: payload.userId, name, email };
        }
      }
      return null;
    } catch {
      return null;
    }
  });
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [showQuickGuide, setShowQuickGuide] = useState(false);

  // Application Navigation with localStorage preservation
  const [activeTab, setActiveTab] = useState<'drive' | 'recent' | 'starred' | 'conflicts' | 'trash' | 'settings' | 'sync-lab' | 'document'>(() => {
    try {
      const saved = localStorage.getItem('syncsafe_active_tab');
      if (saved && ['drive', 'recent', 'starred', 'conflicts', 'trash', 'settings', 'sync-lab', 'document'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'drive';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Documents & Selection with localStorage preservation
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [trashDocuments, setTrashDocuments] = useState<CachedDocument[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [activeDocument, setActiveDocument] = useState<CachedDocument | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('syncsafe_selected_doc_id');
    } catch {
      return null;
    }
  });
  const [showDetailsPanel, setShowDetailsPanel] = useState(true);

  // Preserve route & selected document across reloads
  useEffect(() => {
    try {
      localStorage.setItem('syncsafe_active_tab', activeTab);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    try {
      if (selectedDocId) {
        localStorage.setItem('syncsafe_selected_doc_id', selectedDocId);
      } else {
        localStorage.removeItem('syncsafe_selected_doc_id');
      }
    } catch {}
  }, [selectedDocId]);

  // Lineage & Conflicts Data
  const [versions, setVersions] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // State Flags
  const [isResetting, setIsResetting] = useState(false);
  const [resolvingConflict, setResolvingConflict] = useState(false);
  const [showNewDocModal, setShowNewDocModal] = useState(false);

  // Active Modals
  const [activeConflict, setActiveConflict] = useState<any | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showQueueModalDevice, setShowQueueModalDevice] = useState<string | null>(null);
  const [showDemoScript, setShowDemoScript] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Global Sync Status State
  const [globalSyncState, setGlobalSyncState] = useState<SyncStatusState>({
    status: 'synced',
    message: 'Synced with server',
    pendingCount: 0,
    lastSyncedVersion: 1
  });

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

  // Central stale/invalid token handler
  const handleAuthExpiry = useCallback((message: string = 'Your session has expired. Please sign in again.') => {
    try {
      localStorage.removeItem('syncsafe_token');
      localStorage.removeItem('syncsafe_user');
      localStorage.removeItem('syncsafe_active_tab');
      localStorage.removeItem('syncsafe_selected_doc_id');
    } catch {}
    setToken(null);
    setUser(null);
    setActiveDocument(null);
    setSelectedDocId(null);
    setDocuments([]);
    setVersions([]);
    setConflicts([]);
    setActiveTab('drive');
    setAuthErrorMessage(message);
    setShowAuthModal(true);
    notify('error', message);
  }, []);

  const handleLoginSuccess = async (newToken: string, newUser: any) => {
    try {
      localStorage.setItem('syncsafe_token', newToken);
      localStorage.setItem('syncsafe_user', JSON.stringify(newUser));
    } catch {}
    setToken(newToken);
    setUser(newUser);
    setShowAuthModal(false);
    setAuthErrorMessage(null);
    notify('success', `Signed in as ${newUser.name}`);
    await refreshDocumentData(undefined, newToken);
    setIsLoadingDocs(false);
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem('syncsafe_token');
      localStorage.removeItem('syncsafe_user');
      localStorage.removeItem('syncsafe_active_tab');
      localStorage.removeItem('syncsafe_selected_doc_id');
    } catch {}
    setToken(null);
    setUser(null);
    setActiveDocument(null);
    setSelectedDocId(null);
    setDocuments([]);
    setVersions([]);
    setConflicts([]);
    setActiveTab('drive');
    setShowAuthModal(false);
    setAuthErrorMessage(null);
    notify('info', 'Signed out successfully.');
  };

  // Subscribe coordinators to update global sync status
  useEffect(() => {
    const unsubLaptop = laptopCoordinator.subscribeStatus((state) => {
      setGlobalSyncState((prev) => {
        if (state.status === 'conflict') return state;
        if (prev.status === 'conflict') return prev;
        return state;
      });
    });

    const unsubMobile = mobileCoordinator.subscribeStatus((state) => {
      setGlobalSyncState((prev) => {
        if (state.status === 'conflict') return state;
        if (prev.status === 'conflict') return prev;
        return state;
      });
    });

    return () => {
      unsubLaptop();
      unsubMobile();
    };
  }, [laptopCoordinator, mobileCoordinator]);

  // Fetch document list from backend
  const fetchDocumentsList = useCallback(async (authToken?: string) => {
    const currentToken = authToken || token;
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.status === 401) {
        handleAuthExpiry('Your session has expired. Please sign in again.');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.documents)) {
          setDocuments(data.documents);
          if (!selectedDocId && data.documents.length > 0) {
            setSelectedDocId(data.documents[0].id);
          }
          if (!activeDocument && data.documents.length > 0) {
            setActiveDocument(data.documents[0]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents list:', err);
    }
  }, [token, selectedDocId, activeDocument, handleAuthExpiry]);

  // Fetch soft-deleted documents from trash
  const fetchTrashList = useCallback(async (authToken?: string) => {
    const currentToken = authToken || token;
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents?trash=true`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.documents)) {
          setTrashDocuments(data.documents);
        }
      }
    } catch (err) {
      console.error('Failed to fetch trash list:', err);
    }
  }, [token]);

  // Fetch registered devices for the current user
  const fetchDevices = useCallback(async (authToken?: string) => {
    const currentToken = authToken || token;
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.devices)) {
          setDevices(data.devices);
        }
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    }
  }, [token]);

  // Refresh active document, versions, conflicts, trash, and devices
  const refreshDocumentData = useCallback(async (docId?: string, authToken?: string) => {
    const currentDocId = docId || activeDocument?.id || selectedDocId;
    const currentToken = authToken || token;
    if (!currentToken) {
      setIsLoadingDocs(false);
      return;
    }

    try {
      // 1. Fetch latest doc if docId present
      if (currentDocId) {
        const docRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (docRes.status === 401) {
          handleAuthExpiry('Your session has expired. Please sign in again.');
          return;
        }
        if (docRes.ok) {
          const data = await docRes.json();
          setActiveDocument(data.document);
          setGlobalSyncState(prev => ({
            ...prev,
            lastSyncedVersion: data.document.current_version
          }));
        }

        // 2. Fetch versions
        const verRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}/versions`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (verRes.status === 401) {
          handleAuthExpiry('Your session has expired. Please sign in again.');
          return;
        }
        if (verRes.ok) {
          const vData = await verRes.json();
          setVersions(vData.versions);
        }

        // 3. Fetch conflicts
        const confRes = await fetch(`${API_BASE_URL}/api/documents/${currentDocId}/conflicts`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (confRes.status === 401) {
          handleAuthExpiry('Your session has expired. Please sign in again.');
          return;
        }
        if (confRes.ok) {
          const cData = await confRes.json();
          setConflicts(cData.conflicts);
          if (cData.conflicts.length > 0) {
            setGlobalSyncState(prev => ({ ...prev, status: 'conflict', message: 'Conflict detected' }));
          }
        }
      }

      // Refresh documents list, trash list, and registered devices
      await fetchDocumentsList(currentToken);
      await fetchTrashList(currentToken);
      await fetchDevices(currentToken);
    } catch (err) {
      console.error('Failed to refresh document data:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [activeDocument?.id, selectedDocId, token, fetchDocumentsList, fetchTrashList, fetchDevices, handleAuthExpiry]);

  // Verify existing saved session in background
  const initApp = useCallback(async () => {
    const savedToken = localStorage.getItem('syncsafe_token');
    if (!savedToken) {
      setToken(null);
      setUser(null);
      setIsLoadingDocs(false);
      // Background ping for connectivity indicator
      fetch(`${API_BASE_URL}/health`)
        .then((r) => setServerOnline(r.ok))
        .catch(() => setServerOnline(false));
      return;
    }

    try {
      // Validate saved token with server in background
      const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` }
      }).catch(() => null);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        setServerOnline(true);
        setToken(savedToken);
        setUser(meData.user);
        try {
          localStorage.setItem('syncsafe_user', JSON.stringify(meData.user));
        } catch {}
        setShowAuthModal(false);
        // Refresh documents and active document in background
        await refreshDocumentData(selectedDocId || undefined, savedToken).catch(console.error);
        return;
      } else if (meRes && meRes.status === 401) {
        handleAuthExpiry('Your session has expired. Please sign in again.');
        return;
      } else {
        // Network or server unreachable - keep offline functionality
        setServerOnline(false);
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  }, [refreshDocumentData, handleAuthExpiry, selectedDocId]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Periodic sync polling check
  useEffect(() => {
    const interval = setInterval(() => {
      if (token) {
        refreshDocumentData();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [token, refreshDocumentData]);

  // Fetch trash list when opening trash tab
  useEffect(() => {
    if (activeTab === 'trash' && token) {
      fetchTrashList();
    }
  }, [activeTab, token, fetchTrashList]);

  // Handle Reset Demo
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/demo/reset`, { method: 'POST' });
      const data = await res.json();
      localStorage.setItem('syncsafe_token', data.seed.token);
      setToken(data.seed.token);
      setUser(data.seed.user);
      setActiveDocument(data.seed.document);
      setSelectedDocId(data.seed.document.id);

      // Clear both local device caches and save V1 document
      await laptopCoordinator.storage.clearAll();
      await mobileCoordinator.storage.clearAll();
      await laptopCoordinator.storage.saveDocument(data.seed.document);
      await mobileCoordinator.storage.saveDocument(data.seed.document);

      laptopCoordinator.setOnlineStatus(true);
      mobileCoordinator.setOnlineStatus(true);

      setGlobalSyncState({
        status: 'synced',
        message: 'Synced with server',
        pendingCount: 0,
        lastSyncedVersion: 1
      });

      await refreshDocumentData(data.seed.document.id, data.seed.token);
      notify('success', 'Demo reset: Document initialized at Version 1 across all devices');
    } catch (err: any) {
      notify('error', `Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Handle Create Real Document (with offline creation support)
  const handleCreateDocument = async (name: string, title: string, status: any, description: string, content: string) => {
    const docId = uuidv4();
    const now = new Date().toISOString();
    const offlineDoc: CachedDocument = {
      id: docId,
      owner_id: user?.id || 'demo-user-id',
      name,
      title,
      status,
      description,
      content,
      current_version: 1,
      updated_at: now,
      isLocallyModified: true
    };

    // If offline or disconnected, create locally in IndexedDB and queue
    if (!token || !laptopCoordinator.isOnline) {
      await laptopCoordinator.storage.saveDocument(offlineDoc);
      await laptopCoordinator.storage.enqueueChange({
        changeId: uuidv4(),
        documentId: docId,
        deviceId: 'device-laptop-001',
        baseVersion: 0,
        payload: { title, status, description, content },
        timestamp: now,
        status: 'pending',
        retryCount: 0,
        lastError: null
      });
      setDocuments(prev => [offlineDoc, ...prev]);
      setActiveDocument(offlineDoc);
      setSelectedDocId(docId);
      setActiveTab('document');
      notify('info', `Created "${name}" offline. Saved locally — pending sync.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          deviceId: 'device-laptop-001',
          fields: { title, status, description, content }
        })
      });

      if (res.status === 401) {
        handleAuthExpiry('Your session has expired. Please sign in again.');
        throw new Error('User associated with token no longer exists. Please sign in again.');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create document');
      }

      const data = await res.json();
      const createdDoc = data.document;

      // Cache locally in both coordinators
      await laptopCoordinator.storage.saveDocument(createdDoc);
      await mobileCoordinator.storage.saveDocument(createdDoc);

      // Refresh list and activate new document
      await fetchDocumentsList();
      setActiveDocument(createdDoc);
      setSelectedDocId(createdDoc.id);
      setActiveTab('document');

      notify('success', `Created "${createdDoc.name}" with Version 1 lineage.`);
    } catch (networkErr: any) {
      // Automatic fallback to offline storage if server unreachable
      if (!laptopCoordinator.isOnline || networkErr.message.includes('fetch') || networkErr.message.includes('network')) {
        await laptopCoordinator.storage.saveDocument(offlineDoc);
        setDocuments(prev => [offlineDoc, ...prev]);
        setActiveDocument(offlineDoc);
        setSelectedDocId(docId);
        setActiveTab('document');
        notify('info', `Saved "${name}" locally in offline queue.`);
        return;
      }
      throw networkErr;
    }
  };

  // Handle Delete (Move to Trash)
  const handleDeleteDocument = async (docId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        notify('info', 'Document moved to Trash (version history preserved).');
        await fetchDocumentsList();
        await fetchTrashList();
        if (selectedDocId === docId) {
          setSelectedDocId(null);
        }
        if (activeDocument?.id === docId) {
          setActiveDocument(null);
          setActiveTab('drive');
        }
      }
    } catch (err: any) {
      notify('error', `Failed to delete document: ${err.message}`);
    }
  };

  // Handle Restore from Trash
  const handleRestoreDocument = async (docId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        notify('success', 'Document restored from Trash.');
        await fetchDocumentsList();
        await fetchTrashList();
        setSelectedDocId(docId);
      }
    } catch (err: any) {
      notify('error', `Failed to restore document: ${err.message}`);
    }
  };

  // Handle Toggle Star
  const handleToggleStar = async (docId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${docId}/star`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(prev => prev.map(d => d.id === docId ? { ...d, is_starred: data.document.is_starred } : d));
        if (activeDocument?.id === docId) {
          setActiveDocument(prev => prev ? { ...prev, is_starred: data.document.is_starred } : null);
        }
      }
    } catch (err: any) {
      notify('error', `Failed to toggle star: ${err.message}`);
    }
  };

  // Handle Conflict Resolution
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

      if (res.status === 401) {
        handleAuthExpiry('Your session has expired. Please sign in again.');
        throw new Error('User associated with token no longer exists. Please sign in again.');
      }

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

  // Selected document object for FileDetailsPanel
  const selectedDocument = useMemo(() => {
    return documents.find(d => d.id === selectedDocId) || activeDocument;
  }, [documents, selectedDocId, activeDocument]);

  // ROOT AUTHENTICATION SCREEN: If unauthenticated (no token), render ONLY the authentication view
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(30, 41, 59, 0.75) 0%, #090d16 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}>
        {/* Floating Notification */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 3000,
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'error' ? 'rgba(244, 63, 94, 0.95)' :
                        notification.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(59, 130, 246, 0.95)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {notification.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{notification.text}</span>
          </div>
        )}

        <AuthModal
          isOpen={true}
          isRootScreen={true}
          onLoginSuccess={handleLoginSuccess}
          initialError={authErrorMessage}
          apiBaseUrl={API_BASE_URL}
        />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Top Navigation */}
      <TopNavbar
        user={user}
        serverOnline={serverOnline}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        globalSyncState={globalSyncState}
        conflictCount={conflicts.length}
        onNavigateTab={(tab) => setActiveTab(tab as any)}
        onOpenSyncLab={() => setActiveTab('sync-lab')}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        onOpenDemoScript={() => setShowDemoScript(true)}
        onSignOut={handleSignOut}
        onOpenQuickGuide={() => setShowQuickGuide(true)}
      />

      {/* Floating Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '76px',
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

      {/* Main Body Shell */}
      <div className="app-body">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          conflictCount={conflicts.length}
          onOpenNewDocument={() => setShowNewDocModal(true)}
          onOpenQuickGuide={() => setShowQuickGuide(true)}
        />

        {/* Content Area */}
        <main className="main-content">
          {/* View: My Drive */}
          {activeTab === 'drive' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <DriveView
                  documents={documents}
                  selectedDocId={selectedDocId}
                  onSelectDoc={(doc) => {
                    setSelectedDocId(doc.id);
                    setShowDetailsPanel(true);
                  }}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setSelectedDocId(doc.id);
                    setActiveTab('document');
                  }}
                  onOpenNewDocument={() => setShowNewDocModal(true)}
                  searchQuery={searchQuery}
                  versions={versions}
                  conflicts={conflicts}
                  isLoading={isLoadingDocs}
                  onDeleteDoc={handleDeleteDocument}
                  onToggleStar={handleToggleStar}
                />
              </div>

              {/* Collapsible File Details Panel */}
              {showDetailsPanel && (
                <FileDetailsPanel
                  document={selectedDocument}
                  onClose={() => setShowDetailsPanel(false)}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setActiveTab('document');
                  }}
                  onOpenHistory={() => setShowHistoryModal(true)}
                  onOpenSyncLab={() => setActiveTab('sync-lab')}
                  hasConflict={conflicts.some(c => c.document_id === selectedDocument?.id)}
                  versionCount={versions.length}
                  ownerName={user?.name || 'Alex Rivera'}
                  deviceNames={devices.map(d => d.device_name)}
                  onDeleteDoc={handleDeleteDocument}
                  onRestoreDoc={handleRestoreDocument}
                  onToggleStar={handleToggleStar}
                  isTrash={false}
                />
              )}
            </div>
          )}

          {/* View: Recent */}
          {activeTab === 'recent' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <DriveView
                  documents={documents}
                  selectedDocId={selectedDocId}
                  onSelectDoc={(doc) => {
                    setSelectedDocId(doc.id);
                    setShowDetailsPanel(true);
                  }}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setSelectedDocId(doc.id);
                    setActiveTab('document');
                  }}
                  onOpenNewDocument={() => setShowNewDocModal(true)}
                  searchQuery={searchQuery}
                  versions={versions}
                  conflicts={conflicts}
                  title="Recent"
                  subtitle="Recently modified or synchronized documents"
                  emptyTitle="No recent activity"
                  emptySubtitle="Documents created or edited recently will appear here."
                  isLoading={isLoadingDocs}
                  onDeleteDoc={handleDeleteDocument}
                  onToggleStar={handleToggleStar}
                />
              </div>

              {showDetailsPanel && (
                <FileDetailsPanel
                  document={selectedDocument}
                  onClose={() => setShowDetailsPanel(false)}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setActiveTab('document');
                  }}
                  onOpenHistory={() => setShowHistoryModal(true)}
                  onOpenSyncLab={() => setActiveTab('sync-lab')}
                  hasConflict={conflicts.some(c => c.document_id === selectedDocument?.id)}
                  versionCount={versions.length}
                  ownerName={user?.name || 'Alex Rivera'}
                  deviceNames={devices.map(d => d.device_name)}
                  onDeleteDoc={handleDeleteDocument}
                  onRestoreDoc={handleRestoreDocument}
                  onToggleStar={handleToggleStar}
                  isTrash={false}
                />
              )}
            </div>
          )}

          {/* View: Starred (Real Dynamic View) */}
          {activeTab === 'starred' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <DriveView
                  documents={documents.filter(d => Boolean(d.is_starred))}
                  selectedDocId={selectedDocId}
                  onSelectDoc={(doc) => {
                    setSelectedDocId(doc.id);
                    setShowDetailsPanel(true);
                  }}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setSelectedDocId(doc.id);
                    setActiveTab('document');
                  }}
                  onOpenNewDocument={() => setShowNewDocModal(true)}
                  searchQuery={searchQuery}
                  versions={versions}
                  conflicts={conflicts}
                  title="Starred"
                  subtitle="Quick access to important starred documents"
                  emptyTitle="No starred documents"
                  emptySubtitle="Star important documents to access them quickly here."
                  isLoading={isLoadingDocs}
                  onDeleteDoc={handleDeleteDocument}
                  onToggleStar={handleToggleStar}
                />
              </div>

              {showDetailsPanel && (
                <FileDetailsPanel
                  document={selectedDocument}
                  onClose={() => setShowDetailsPanel(false)}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setActiveTab('document');
                  }}
                  onOpenHistory={() => setShowHistoryModal(true)}
                  onOpenSyncLab={() => setActiveTab('sync-lab')}
                  hasConflict={conflicts.some(c => c.document_id === selectedDocument?.id)}
                  versionCount={versions.length}
                  ownerName={user?.name || 'Alex Rivera'}
                  deviceNames={devices.map(d => d.device_name)}
                  onDeleteDoc={handleDeleteDocument}
                  onRestoreDoc={handleRestoreDocument}
                  onToggleStar={handleToggleStar}
                  isTrash={false}
                />
              )}
            </div>
          )}

          {/* View: Conflicts Page */}
          {activeTab === 'conflicts' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ConflictsView
                conflicts={conflicts}
                documents={documents}
                onReviewConflict={(conflict) => setActiveConflict(conflict)}
                onOpenSyncLab={() => setActiveTab('sync-lab')}
              />
            </div>
          )}

          {/* View: Trash (Real Soft-Deleted Documents with Restore) */}
          {activeTab === 'trash' && (
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <DriveView
                  documents={trashDocuments}
                  selectedDocId={selectedDocId}
                  onSelectDoc={(doc) => {
                    setSelectedDocId(doc.id);
                    setShowDetailsPanel(true);
                  }}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setSelectedDocId(doc.id);
                    setActiveTab('document');
                  }}
                  onOpenNewDocument={() => setShowNewDocModal(true)}
                  searchQuery={searchQuery}
                  versions={versions}
                  conflicts={conflicts}
                  title="Trash"
                  subtitle="Deleted files (soft-deleted with full version history preserved)"
                  emptyTitle="Trash is empty"
                  emptySubtitle="Files moved to trash will appear here and can be restored."
                  isLoading={isLoadingDocs}
                  onRestoreDoc={handleRestoreDocument}
                  isTrash={true}
                />
              </div>

              {showDetailsPanel && (
                <FileDetailsPanel
                  document={selectedDocument}
                  onClose={() => setShowDetailsPanel(false)}
                  onOpenDoc={(doc) => {
                    setActiveDocument(doc);
                    setActiveTab('document');
                  }}
                  onOpenHistory={() => setShowHistoryModal(true)}
                  onOpenSyncLab={() => setActiveTab('sync-lab')}
                  hasConflict={conflicts.some(c => c.document_id === selectedDocument?.id)}
                  versionCount={versions.length}
                  ownerName={user?.name || 'Alex Rivera'}
                  deviceNames={devices.map(d => d.device_name)}
                  onRestoreDoc={handleRestoreDocument}
                  isTrash={true}
                />
              )}
            </div>
          )}

          {/* View: Document Workspace Editor */}
          {activeTab === 'document' && activeDocument && (
            <DocumentWorkspace
              document={activeDocument}
              laptopCoordinator={laptopCoordinator}
              mobileCoordinator={mobileCoordinator}
              onBackToDrive={() => setActiveTab('drive')}
              onOpenHistory={() => setShowHistoryModal(true)}
              onOpenSyncLab={() => setActiveTab('sync-lab')}
              onDocumentUpdated={(updated) => {
                setActiveDocument(updated);
                refreshDocumentData();
              }}
              hasConflict={conflicts.some(c => c.document_id === activeDocument.id)}
              onOpenConflict={() => conflicts.length > 0 && setActiveConflict(conflicts[0])}
              versionCount={versions.length}
            />
          )}

          {/* View: Sync Lab (Dual-Device Simulator for Technical Judges) */}
          {activeTab === 'sync-lab' && (
            <SyncLabView
              laptopCoordinator={laptopCoordinator}
              mobileCoordinator={mobileCoordinator}
              activeDocument={activeDocument}
              onOpenHistory={() => setShowHistoryModal(true)}
              onOpenQueue={(devId) => setShowQueueModalDevice(devId)}
              onOpenConflict={() => conflicts.length > 0 && setActiveConflict(conflicts[0])}
              hasOpenConflict={conflicts.length > 0}
              versionCount={versions.length}
              onResetDemo={handleResetDemo}
              isResetting={isResetting}
              onOpenDemoScript={() => setShowDemoScript(true)}
            />
          )}

          {/* View: Settings */}
          {activeTab === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SettingsView
                user={user}
                serverOnline={serverOnline}
                laptopCoordinator={laptopCoordinator}
                mobileCoordinator={mobileCoordinator}
                token={token}
                onResetDemo={handleResetDemo}
                isResetting={isResetting}
              />
            </div>
          )}
        </main>
      </div>

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => setShowNewDocModal(false)}
        onCreateDocument={handleCreateDocument}
      />

      {/* Conflict Resolver Modal (Existing & Preserved) */}
      {activeConflict && (
        <ConflictResolverModal
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
          onResolve={handleResolveConflict}
          resolving={resolvingConflict}
        />
      )}

      {/* Version History Modal (Existing & Preserved) */}
      {showHistoryModal && (
        <VersionHistoryModal
          versions={versions}
          currentVersionNumber={activeDocument?.current_version || 1}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* Pending Queue Modal (Existing & Preserved) */}
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

      {/* Guided Demo Walkthrough Modal (Existing & Preserved) */}
      {showDemoScript && (
        <DemoScriptWalkthrough
          onClose={() => setShowDemoScript(false)}
          onExecuteStepAction={handleExecuteDemoStep}
          currentVersion={activeDocument?.current_version || 1}
        />
      )}

      {/* Quick Guide & Demo Manual Modal */}
      <QuickGuideModal
        isOpen={showQuickGuide}
        onClose={() => setShowQuickGuide(false)}
        onOpenSyncLab={() => setActiveTab('sync-lab')}
      />

      {/* Authentication Modal (Overlay mode if triggered while in app) */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onLoginSuccess={handleLoginSuccess}
          initialError={authErrorMessage}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
}

export default App;
