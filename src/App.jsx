'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck,
  Home, 
  Users, 
  MapPin,
  CheckSquare, 
  Layers, 
  X,
  Compass,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Settings,
  Heart,
  Info,
  Wifi,
  WifiOff
} from 'lucide-react';

import OnboardingScreen from './components/OnboardingScreen';
import HomeDashboard from './components/HomeDashboard';
import SituationInput from './components/SituationInput';
import ReviewInput from './components/ReviewInput';
import SituationAssessment from './components/SituationAssessment';
import EmergencyMode from './components/EmergencyMode';
import FamilySafety from './components/FamilySafety';
import SafeRoute from './components/SafeRoute';
import EmergencyChecklist from './components/EmergencyChecklist';
import SafeConfirmation from './components/SafeConfirmation';
import GlobalSafetyMap from './components/GlobalSafetyMap';
import ShareStatus from './components/ShareStatus';
import AuthScreen from './components/AuthScreen';
import SarDashboard from './components/SarDashboard';
import SettingsScreen from './components/SettingsScreen';
import EmergencyIdentityCard from './components/EmergencyIdentityCard';
import GuardianShieldLogo from './components/GuardianShieldLogo';
import LandingPage from './components/LandingPage';

import { INITIAL_CHECKLIST, INITIAL_FAMILY } from './data/mockData';

function readLocalState(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Gagal membaca data lokal "${key}":`, error);
    return fallback;
  }
}

function accountStorageKey(userId, key) {
  return `ai-disaster-account-${userId}-${key}`;
}

const DEFAULT_FAMILY_PLAN = {
  meetingPoint: '',
  meetingArea: '',
  backupContacts: ['', ''],
  localEmergencyName: '',
  localEmergencyNumber: '',
  localEmergencySource: '',
  localEmergencyCheckedAt: ''
};
const OFFLINE_EMERGENCY_CARD_KEY = 'ai-disaster-offline-emergency-card';

async function requestFamilyApi(url, { method = 'GET', body, accessToken } = {}) {
  const response = await fetch(url, {
    method,
    cache: 'no-store',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Sinkronisasi keluarga gagal. Coba lagi.');
  }
  return result.data;
}

function familySnapshot(members, plan) {
  return JSON.stringify({ members, plan });
}

export default function App() {
  // Manajemen layar & navigasi alur tanggap darurat
  const [currentScreen, setCurrentScreen] = useState('home');

  const handleNavigateScreen = useCallback((screenName) => {
    const aliasMap = {
      'safe_route': 'route',
      'posko': 'route',
      'map': 'safety_map',
      'safetymap': 'safety_map',
      'emergency_mode': 'emergency',
      'family_safety': 'family',
      'emergency_checklist': 'checklist'
    };
    const resolvedScreen = aliasMap[screenName] || screenName;
    setCurrentScreen(resolvedScreen);
  }, []);
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [authModalState, setAuthModalState] = useState({ isOpen: false, mode: 'login' });
  const [offlineEmergencyCard, setOfflineEmergencyCard] = useState(null);
  const [showOfflineEmergencyCard, setShowOfflineEmergencyCard] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isSafetyShareActive, setIsSafetyShareActive] = useState(false);
  const [safetyShareDetails, setSafetyShareDetails] = useState({
    status: 'checking',
    area: 'Kelurahan Sukajadi',
    visibility: 'public',
    expiresIn: '6 jam'
  });

  // App-wide workflow state
  const [hazardData, setHazardData] = useState({
    type: 'banjir',
    description: 'Air banjir di depan pekarangan sudah setinggi 40 cm dan mengalir deras. Kami di rumah ada 3 orang termasuk Ibu lansia yang butuh kursi roda dan anak balita.',
    location: 'Kelurahan Sukajadi, RT 02 / RW 04',
    waterElectricity: 'cut_off',
    hasVulnerable: 'yes',
    mobilitySafe: 'partial'
  });

  const [familyMembers, setFamilyMembers] = useState(INITIAL_FAMILY);
  const [familyPlan, setFamilyPlan] = useState(DEFAULT_FAMILY_PLAN);
  const [checklistItems, setChecklistItems] = useState(INITIAL_CHECKLIST);
  const [isLocalStateLoaded, setIsLocalStateLoaded] = useState(false);
  const [loadedAccountId, setLoadedAccountId] = useState(null);
  const [familyAccess, setFamilyAccess] = useState(null);
  const [isFamilyAccessLoaded, setIsFamilyAccessLoaded] = useState(false);
  const [familySyncStatus, setFamilySyncStatus] = useState('local');
  const [familySyncError, setFamilySyncError] = useState('');
  const [familyInvite, setFamilyInvite] = useState(null);
  const [isFamilySyncBusy, setIsFamilySyncBusy] = useState(false);
  const [pendingFamilyInvite, setPendingFamilyInvite] = useState('');
  const [navigationTarget, setNavigationTarget] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);
  const currentFamilyRef = useRef({ familyMembers, familyPlan });
  const lastSyncedFamilyRef = useRef(null);
  const familySyncReadyRef = useRef(false);
  const loadedAccountIdRef = useRef(null);

  currentFamilyRef.current = { familyMembers, familyPlan };

  useEffect(() => {
    let active = true;
    setOfflineEmergencyCard(readLocalState(OFFLINE_EMERGENCY_CARD_KEY, null));
    fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Sesi akun gagal dimuat.');
        if (active) {
          setAuthUser(result.user);
          setAuthError('');
          if (result.user?.role === 'sar') {
            setCurrentScreen('sar_dashboard');
          }
        }
      })
      .catch(error => {
        if (active) setAuthError(error.message || 'Sesi akun gagal dimuat.');
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authUser) {
      loadedAccountIdRef.current = null;
      setLoadedAccountId(null);
      setIsLocalStateLoaded(false);
      setIsFamilyAccessLoaded(false);
      setFamilyAccess(null);
      return;
    }
    loadedAccountIdRef.current = null;
    setLoadedAccountId(null);
    setIsLocalStateLoaded(false);
    setIsFamilyAccessLoaded(false);
    const prefix = `ai-disaster-account-${authUser.id}-`;
    const migrationKey = `${prefix}legacy-data-migrated`;
    try {
      if (authUser.isGuest && window.localStorage.getItem(migrationKey)) {
        const legacyKeys = [
          ['ai-disaster-family', 'family'],
          ['ai-disaster-family-plan', 'family-plan'],
          ['ai-disaster-checklist', 'checklist'],
          ['ai-disaster-family-access', 'family-access']
        ];
        legacyKeys.forEach(([oldKey, newKey]) => {
          const guestKey = `${prefix}${newKey}`;
          const guestValue = window.localStorage.getItem(guestKey);
          if (guestValue !== null && window.localStorage.getItem(oldKey) === null) {
            window.localStorage.setItem(oldKey, guestValue);
          }
          window.localStorage.removeItem(guestKey);
        });
        window.localStorage.removeItem(migrationKey);
      }
      if (!authUser.isGuest && !window.localStorage.getItem(migrationKey)) {
        const legacyKeys = [
          ['ai-disaster-family', 'family'],
          ['ai-disaster-family-plan', 'family-plan'],
          ['ai-disaster-checklist', 'checklist'],
          ['ai-disaster-family-access', 'family-access']
        ];
        legacyKeys.forEach(([oldKey, newKey]) => {
          const oldValue = window.localStorage.getItem(oldKey);
          const newKeyName = `${prefix}${newKey}`;
          if (oldValue !== null && window.localStorage.getItem(newKeyName) === null) {
            window.localStorage.setItem(newKeyName, oldValue);
          }
          window.localStorage.removeItem(oldKey);
        });
        window.localStorage.setItem(migrationKey, 'true');
      }
    } catch (error) {
      console.warn('Gagal memisahkan data lokal per akun:', error);
    }

    const savedFamily = readLocalState(accountStorageKey(authUser.id, 'family'), INITIAL_FAMILY);
    const savedPlan = readLocalState(accountStorageKey(authUser.id, 'family-plan'), DEFAULT_FAMILY_PLAN) || DEFAULT_FAMILY_PLAN;
    const savedChecklist = readLocalState(accountStorageKey(authUser.id, 'checklist'), INITIAL_CHECKLIST);
    const savedAccess = authUser.isGuest ? null : readLocalState(accountStorageKey(authUser.id, 'family-access'), null);
    setFamilyMembers(Array.isArray(savedFamily) ? savedFamily : INITIAL_FAMILY);
    setFamilyPlan({
      ...DEFAULT_FAMILY_PLAN,
      ...savedPlan,
      backupContacts: Array.isArray(savedPlan.backupContacts) ? savedPlan.backupContacts : DEFAULT_FAMILY_PLAN.backupContacts
    });
    setChecklistItems(Array.isArray(savedChecklist) ? savedChecklist : INITIAL_CHECKLIST);
    setFamilyAccess(savedAccess && typeof savedAccess.groupId === 'string' && typeof savedAccess.accessToken === 'string' ? savedAccess : null);
    loadedAccountIdRef.current = authUser.id;
    setLoadedAccountId(authUser.id);
    lastSyncedFamilyRef.current = null;
    familySyncReadyRef.current = false;
    const inviteToken = new URLSearchParams(window.location.search).get('familyInvite');
    if (inviteToken) {
      setPendingFamilyInvite(inviteToken);
      setCurrentScreen('family');
    }
    setIsFamilyAccessLoaded(true);
    setIsLocalStateLoaded(true);
  }, [authUser]);

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id) return;
    setFamilyMembers(current => current.map(member => (
      member.id === 'f1'
        ? { ...member, name: `${authUser.name} (Anda)`, relationship: 'Akun Saya' }
        : member
    )));
  }, [authUser, loadedAccountId]);

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id) return;
    try {
      window.localStorage.setItem(accountStorageKey(authUser.id, 'family'), JSON.stringify(familyMembers));
    } catch (error) {
      console.warn('Gagal menyimpan profil keluarga di perangkat:', error);
    }
  }, [familyMembers, loadedAccountId, authUser]);

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id) return;
    try {
      window.localStorage.setItem(accountStorageKey(authUser.id, 'family-plan'), JSON.stringify(familyPlan));
    } catch (error) {
      console.warn('Gagal menyimpan rencana keluarga di perangkat:', error);
    }
  }, [familyPlan, loadedAccountId, authUser]);

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id || !isFamilyAccessLoaded) return;
    try {
      if (familyAccess) {
        window.localStorage.setItem(accountStorageKey(authUser.id, 'family-access'), JSON.stringify(familyAccess));
      } else {
        window.localStorage.removeItem(accountStorageKey(authUser.id, 'family-access'));
      }
    } catch (error) {
      console.warn('Gagal menyimpan akses grup keluarga di perangkat:', error);
      setFamilySyncError('Akses grup tidak dapat disimpan di perangkat ini.');
    }
  }, [familyAccess, isFamilyAccessLoaded, loadedAccountId, authUser]);

  useEffect(() => {
    if (!authUser || authUser.isGuest || loadedAccountId !== authUser.id || loadedAccountIdRef.current !== authUser.id || !isLocalStateLoaded || !isFamilyAccessLoaded || !familyAccess) {
      familySyncReadyRef.current = false;
      return undefined;
    }

    let active = true;
    let isLoading = false;
    const syncFromServer = async () => {
      if (isLoading) return;
      isLoading = true;
      try {
        const remote = await requestFamilyApi(`/api/family/group/${encodeURIComponent(familyAccess.groupId)}`, {
          accessToken: familyAccess.accessToken
        });
        if (!active) return;

        const remoteSnapshot = familySnapshot(remote.members, remote.familyPlan);
        const currentSnapshot = familySnapshot(currentFamilyRef.current.familyMembers, currentFamilyRef.current.familyPlan);
        if (lastSyncedFamilyRef.current === null || currentSnapshot === lastSyncedFamilyRef.current) {
          lastSyncedFamilyRef.current = remoteSnapshot;
          setFamilyMembers(remote.members);
          setFamilyPlan(remote.familyPlan);
        }
        familySyncReadyRef.current = true;
        setFamilySyncStatus('synced');
        setFamilySyncError('');
      } catch (error) {
        if (!active) return;
        setFamilySyncStatus('error');
        setFamilySyncError(error.message);
      } finally {
        isLoading = false;
      }
    };

    syncFromServer();
    const intervalId = window.setInterval(syncFromServer, 5000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
      familySyncReadyRef.current = false;
    };
  }, [authUser, familyAccess, isFamilyAccessLoaded, isLocalStateLoaded, loadedAccountId]);

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id || loadedAccountIdRef.current !== authUser.id || !familyAccess || !familySyncReadyRef.current) return undefined;
    const snapshot = familySnapshot(familyMembers, familyPlan);
    if (snapshot === lastSyncedFamilyRef.current) return undefined;

    const timeoutId = window.setTimeout(async () => {
      try {
        const remote = await requestFamilyApi(`/api/family/group/${encodeURIComponent(familyAccess.groupId)}`, {
          method: 'PUT',
          accessToken: familyAccess.accessToken,
          body: { familyMembers, familyPlan }
        });
        lastSyncedFamilyRef.current = familySnapshot(remote.members, remote.familyPlan);
        setFamilySyncStatus('synced');
        setFamilySyncError('');
      } catch (error) {
        setFamilySyncStatus('error');
        setFamilySyncError(error.message);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [authUser, familyAccess, familyMembers, familyPlan, loadedAccountId]);

  const handleCreateFamilyInvite = async () => {
    setIsFamilySyncBusy(true);
    setFamilySyncError('');
    try {
      let access = familyAccess;
      if (!access) {
        const group = await requestFamilyApi('/api/family/group', {
          method: 'POST',
          body: { familyMembers, familyPlan }
        });
        access = { groupId: group.id, accessToken: group.accessToken };
        lastSyncedFamilyRef.current = familySnapshot(group.members, group.familyPlan);
        setFamilyMembers(group.members);
        setFamilyPlan(group.familyPlan);
        setFamilyAccess(access);
        familySyncReadyRef.current = true;
      }

      const invite = await requestFamilyApi('/api/family/invites', {
        method: 'POST',
        accessToken: access.accessToken,
        body: { groupId: access.groupId }
      });
      const inviteUrl = new URL(window.location.href);
      inviteUrl.search = '';
      inviteUrl.searchParams.set('familyInvite', invite.token);
      setFamilyInvite({ ...invite, url: inviteUrl.toString() });
      setFamilySyncStatus('synced');
      return true;
    } catch (error) {
      setFamilySyncStatus('error');
      setFamilySyncError(error.message);
      return null;
    } finally {
      setIsFamilySyncBusy(false);
    }
  };

  const handleJoinFamilyInvite = async (inviteToken, member) => {
    setIsFamilySyncBusy(true);
    setFamilySyncError('');
    try {
      const joined = await requestFamilyApi('/api/family/join', {
        method: 'POST',
        body: { inviteToken, member }
      });
      const access = { groupId: joined.id, accessToken: joined.accessToken };
      lastSyncedFamilyRef.current = familySnapshot(joined.members, joined.familyPlan);
      setFamilyAccess(access);
      setFamilyMembers(joined.members);
      setFamilyPlan(joined.familyPlan);
      setPendingFamilyInvite('');
      setFamilySyncStatus('synced');
      familySyncReadyRef.current = true;
      return true;
    } catch (error) {
      setFamilySyncStatus('error');
      setFamilySyncError(error.message);
      return null;
    } finally {
      setIsFamilySyncBusy(false);
    }
  };

  useEffect(() => {
    if (!authUser || loadedAccountId !== authUser.id) return;
    try {
      window.localStorage.setItem(accountStorageKey(authUser.id, 'checklist'), JSON.stringify(checklistItems));
    } catch (error) {
      console.warn('Gagal menyimpan checklist di perangkat:', error);
    }
  }, [checklistItems, loadedAccountId, authUser]);

  useEffect(() => {
    if (!authUser) return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Gagal mendaftarkan dukungan offline:', error);
    });
  }, [authUser]);

  const handleSignOut = async () => {
    if (authUser?.isGuest) {
      setAuthUser(null);
      setCurrentScreen('home');
      return;
    }
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Gagal keluar dari akun.');
      setAuthUser(null);
      setCurrentScreen('home');
      setFamilyAccess(null);
      setFamilyInvite(null);
      setPendingFamilyInvite('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleProfileUpdated = useCallback(user => {
    setAuthUser(current => current ? { ...current, ...user } : current);
  }, []);

  const handleSaveOfflineEmergencyCard = card => {
    window.localStorage.setItem(OFFLINE_EMERGENCY_CARD_KEY, JSON.stringify(card));
    setOfflineEmergencyCard(card);
  };

  const handleClearOfflineEmergencyCard = () => {
    try {
      window.localStorage.removeItem(OFFLINE_EMERGENCY_CARD_KEY);
      setOfflineEmergencyCard(null);
      setShowOfflineEmergencyCard(false);
      setCurrentScreen('settings');
    } catch (error) {
      console.error('Gagal menghapus kartu identitas darurat offline:', error);
      setAuthError('Salinan offline tidak dapat dihapus. Coba lagi dari pengaturan browser.');
    }
  };

  // Modular Screen Categories for Modern Navigation Drawer
  const secondaryGroups = [
    {
      category: 'Alur Panduan Evakuasi',
      items: [
        { id: 'assessment', name: 'Panduan Skenario', desc: 'Instruksi terstruktur sesuai jenis bahaya', icon: Compass },
        { id: 'route', name: 'Rute Aman & Posko', desc: 'Navigasi jalan riil bebas rintangan', icon: Navigation },
        { id: 'input', name: 'Input Situasi Bahaya', desc: 'Asesmen awal kondisi rumah & keluarga', icon: AlertTriangle },
        { id: 'review', name: 'Tinjau Rincian Bahaya', desc: 'Periksa formulir dan data yang dikirim', icon: CheckSquare },
        { id: 'confirm_safe', name: 'Konfirmasi Selamat', desc: 'Tandai status Anda dan keluarga aman', icon: CheckCircle2 }
      ]
    },
    {
      category: 'Operasi & Alat Pendukung',
      items: [
        ...(authUser?.role === 'sar' ? [{ id: 'sar_dashboard', name: 'Panel Komando SAR', desc: 'Radar triase korban & penetapan zona bencana', icon: ShieldAlert, highlight: true }] : []),
        { id: 'share_status', name: 'Bagikan Status Warga', desc: 'Siarkan kondisi terkini ke warga sekitar', icon: Radio },
        { id: 'settings', name: 'Pengaturan Profil', desc: 'Kelola akun, kontak darurat & data lokal', icon: Settings },
        ...(offlineEmergencyCard ? [{ id: 'emergency_card', name: 'Kartu Medis Offline', desc: 'Identitas medis darurat tanpa internet', icon: Heart }] : []),
        { id: 'onboarding', name: 'Panduan Penggunaan', desc: 'Pengenalan alur aplikasi Evacu8', icon: Info }
      ]
    }
  ];

  const primaryNavigation = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'family', label: 'Keluarga', icon: Users },
    { id: 'safety_map', label: 'Peta', icon: MapPin },
    { id: 'checklist', label: 'Tas Siaga', icon: CheckSquare },
  ];

  const secondaryScreens = secondaryGroups.flatMap(group => group.items);

  const isMoreScreen = secondaryScreens.some(screen => screen.id === currentScreen)
    || currentScreen === 'emergency';

  if (showOfflineEmergencyCard) {
    return (
      <EmergencyIdentityCard
        card={offlineEmergencyCard}
        onBack={() => setShowOfflineEmergencyCard(false)}
        onClear={handleClearOfflineEmergencyCard}
      />
    );
  }

  // JIKA BELUM KLIK MASUK KE APLIKASI (Belum lewat Landing Page)
  if (!hasEnteredApp && !authUser) {
    if (authModalState.isOpen) {
      return (
        <AuthScreen
          initialMode={authModalState.mode}
          onAuthenticated={user => {
            setAuthUser(user);
            setAuthError('');
            setHasEnteredApp(true);
            setAuthModalState({ isOpen: false, mode: 'login' });
            if (user?.role === 'sar') {
              setCurrentScreen('sar_dashboard');
            } else {
              setCurrentScreen('home');
            }
          }}
          onContinueGuest={() => {
            setAuthUser({ id: 'guest-local', name: 'Pengguna tamu', role: 'user', canManageRoles: false, isGuest: true });
            setAuthError('');
            setHasEnteredApp(true);
            setAuthModalState({ isOpen: false, mode: 'login' });
          }}
          onContinueGuestSar={() => {
            setAuthUser({
              id: 'guest-sar-demo',
              name: 'Petugas SAR (Demo)',
              role: 'sar',
              canManageRoles: true,
              isGuest: true
            });
            setAuthError('');
            setHasEnteredApp(true);
            setAuthModalState({ isOpen: false, mode: 'login' });
            setCurrentScreen('sar_dashboard');
          }}
          onBackToLanding={() => setAuthModalState({ isOpen: false, mode: 'login' })}
          offlineCardAvailable={Boolean(offlineEmergencyCard)}
          onOpenOfflineCard={() => setShowOfflineEmergencyCard(true)}
          initialError={authError}
        />
      );
    }

    return (
      <LandingPage
        onEnterApp={() => {
          setAuthUser({ id: 'guest-local', name: 'Pengguna tamu', role: 'user', canManageRoles: false, isGuest: true });
          setHasEnteredApp(true);
          setCurrentScreen('home');
        }}
        onQuickExplore={() => {
          setAuthUser({ id: 'guest-local', name: 'Pengguna tamu', role: 'user', canManageRoles: false, isGuest: true });
          setHasEnteredApp(true);
          setCurrentScreen('input');
        }}
        onLoginClick={() => setAuthModalState({ isOpen: true, mode: 'login' })}
        onRegisterClick={() => setAuthModalState({ isOpen: true, mode: 'register' })}
        onSarDemoClick={() => {
          setAuthUser({
            id: 'guest-sar-demo',
            name: 'Petugas SAR (Demo)',
            role: 'sar',
            canManageRoles: true,
            isGuest: true
          });
          setHasEnteredApp(true);
          setCurrentScreen('sar_dashboard');
        }}
      />
    );
  }

  if (!authReady) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0D47A1] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Memeriksa sesi akun…</p>
        </div>
      </main>
    );
  }

  if (!authUser) {
    return (
      <AuthScreen
        onAuthenticated={user => {
          setAuthUser(user);
          setAuthError('');
          setHasEnteredApp(true);
          if (user?.role === 'sar') {
            setCurrentScreen('sar_dashboard');
          } else {
            setCurrentScreen('home');
          }
        }}
        onContinueGuest={() => {
          setAuthUser({ id: 'guest-local', name: 'Pengguna tamu', role: 'user', canManageRoles: false, isGuest: true });
          setAuthError('');
          setHasEnteredApp(true);
        }}
        onContinueGuestSar={() => {
          setAuthUser({
            id: 'guest-sar-demo',
            name: 'Petugas SAR (Demo)',
            role: 'sar',
            canManageRoles: true,
            isGuest: true
          });
          setAuthError('');
          setHasEnteredApp(true);
          setCurrentScreen('sar_dashboard');
        }}
        offlineCardAvailable={Boolean(offlineEmergencyCard)}
        onOpenOfflineCard={() => setShowOfflineEmergencyCard(true)}
        initialError={authError}
      />
    );
  }

  // TAMPILAN FULL-SCREEN KETIKA ROLE SAR MEMBUKA DASHBOARD (100vw, 100vh)
  if (currentScreen === 'sar_dashboard' && authUser?.role === 'sar') {
    return (
      <SarDashboard
        currentUser={authUser}
        onSwitchToCitizenView={() => setCurrentScreen('home')}
      />
    );
  }

  return (
    <div className="app-shell min-h-dvh text-slate-800 flex flex-col font-sans">
      {/* Top Live Connectivity & Disaster Network Status Bar */}
      <div className={`text-white text-xs px-4 py-2 border-b transition-colors ${
        isOnline ? 'bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 border-blue-700/50' : 'bg-slate-900 border-amber-500/50'
      }`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`}>
            </span>
            <span className="font-black tracking-wider uppercase text-[10px] text-blue-100">
              {isOnline ? 'Sistem Siaga Bencana Terpadu' : 'Mode Mandiri Aktif (PWA Terisolasi)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-blue-200">
                <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="hidden sm:inline">Sensor BMKG & Jaringan SAR Terhubung</span>
                <span className="sm:hidden">Online Siaga</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Offline · Database Lokal Aktif</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Compact brand header; primary navigation lives in the bottom dock. */}
      <header className="app-header sticky top-0 z-40 backdrop-blur-xl border-b border-white/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[4.5rem] flex items-center justify-between">
          {/* Brand */}
          <button 
            onClick={() => setCurrentScreen('home')}
            className="flex min-w-0 items-center gap-2.5 text-left cursor-pointer group sm:gap-3"
          >
            <GuardianShieldLogo className="h-9 w-9 shrink-0 transition-transform group-hover:scale-105 sm:h-10 sm:w-10" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[#0D47A1] tracking-tight">
                  Evacu8
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Keputusan & Evakuasi Cepat Terstruktur</p>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {authUser.isGuest && (
              <button
                type="button"
                onClick={() => {
                  const nextRole = authUser.role === 'sar' ? 'user' : 'sar';
                  setAuthUser(curr => ({
                    ...curr,
                    role: nextRole,
                    name: nextRole === 'sar' ? 'Petugas SAR Wilayah' : 'Warga Terdaftar'
                  }));
                  if (nextRole === 'sar') {
                    setCurrentScreen('sar_dashboard');
                  } else if (currentScreen === 'sar_dashboard') {
                    setCurrentScreen('home');
                  }
                }}
                className={`rounded-xl border px-2 sm:px-2.5 py-1.5 text-[11px] font-extrabold transition-all shadow-xs cursor-pointer ${
                  authUser.role === 'sar'
                    ? 'border-blue-600 bg-blue-50 text-[#0D47A1] hover:bg-blue-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Beralih peran antara Tim SAR dan Warga"
              >
                <span className="hidden sm:inline-flex items-center gap-1">
                  {authUser.role === 'sar' ? <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> : <Users className="w-3.5 h-3.5 text-slate-300" />}
                  <span>{authUser.role === 'sar' ? 'Mode: Tim SAR' : 'Mode: Warga'}</span>
                </span>
                <span className="sm:hidden inline-flex items-center gap-1">
                  {authUser.role === 'sar' ? <ShieldCheck className="w-3 h-3 text-blue-300" /> : <Users className="w-3 h-3 text-slate-300" />}
                  <span>{authUser.role === 'sar' ? 'SAR' : 'Warga'}</span>
                </span>
              </button>
            )}
            {authUser.role === 'sar' && currentScreen !== 'sar_dashboard' && (
              <button
                type="button"
                onClick={() => setCurrentScreen('sar_dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#0D47A1] hover:bg-blue-800 text-white px-2.5 sm:px-3 py-1.5 text-xs font-black shadow-md shadow-blue-900/20 transition-all cursor-pointer shrink-0"
                title="Buka Dashboard Komando SAR Full-Screen"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>Dashboard SAR</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>
            )}
            <div className="hidden text-right md:block">
              <p className="max-w-36 truncate text-xs font-bold text-slate-800">{authUser.name}</p>
              <p className="text-[10px] text-slate-500">{authUser.role === 'sar' ? 'Tim SAR' : 'Pengguna'}</p>
            </div>
            <button type="button" onClick={handleSignOut} className="hidden sm:inline-flex rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50">
              {authUser.isGuest ? 'Masuk' : 'Keluar'}
            </button>
            <button
              onClick={() => setCurrentScreen('emergency')}
              className="emergency-header-action shrink-0"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Mode Darurat</span>
              <span className="sm:hidden">Darurat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Screen Render Switcher with Fluid Fade Transition */}
      <main className={`app-main flex-1 ${currentScreen === 'sar_dashboard' ? 'max-w-[1400px]' : 'max-w-6xl'} w-full mx-auto p-4 sm:p-6 lg:p-8 ${currentScreen === 'emergency' ? 'pb-8' : 'pb-32 sm:pb-36'}`}>
        <div key={currentScreen} className="animate-fadeIn w-full">
        {currentScreen === 'onboarding' && (
          <OnboardingScreen 
            onStartApp={() => setCurrentScreen('home')}
            onQuickExplore={() => setCurrentScreen('input')}
          />
        )}

        {currentScreen === 'home' && (
          <HomeDashboard
            onSelectFlow={(flow) => setCurrentScreen('input')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
            hazardData={hazardData}
            setHazardData={setHazardData}
          />
        )}

        {currentScreen === 'input' && (
          <SituationInput
            hazardData={hazardData}
            setHazardData={setHazardData}
            onNext={() => setCurrentScreen('review')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'review' && (
          <ReviewInput
            hazardData={hazardData}
            setHazardData={setHazardData}
            onNext={() => setCurrentScreen('assessment')}
            onBack={() => setCurrentScreen('input')}
          />
        )}

        {currentScreen === 'assessment' && (
          <SituationAssessment
            hazardData={hazardData}
            onEnterEmergencyMode={() => setCurrentScreen('emergency')}
            onBack={() => setCurrentScreen('review')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
          />
        )}

        {currentScreen === 'emergency' && (
          <EmergencyMode
            hazardData={hazardData}
            onExitEmergencyMode={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
            onDoneStep={() => setCurrentScreen('confirm_safe')}
          />
        )}

        {currentScreen === 'family' && (
          <FamilySafety
            currentUser={authUser}
            onRequireAccount={() => setAuthUser(null)}
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            familyPlan={familyPlan}
            setFamilyPlan={setFamilyPlan}
            checklistItems={checklistItems}
            familyAccess={familyAccess}
            familySyncStatus={familySyncStatus}
            familySyncError={familySyncError}
            familyInvite={familyInvite}
            isFamilySyncBusy={isFamilySyncBusy}
            initialInviteToken={pendingFamilyInvite}
            onCreateFamilyInvite={handleCreateFamilyInvite}
            onJoinFamilyInvite={handleJoinFamilyInvite}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
            onNavigateRoute={(target) => {
              setNavigationTarget(target);
              setCurrentScreen('route');
            }}
          />
        )}

        {(currentScreen === 'route' || currentScreen === 'safe_route' || currentScreen === 'posko') && (
          <SafeRoute
            hazardData={hazardData}
            familyMembers={familyMembers}
            navigationTarget={navigationTarget}
            setNavigationTarget={setNavigationTarget}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={handleNavigateScreen}
          />
        )}

        {(currentScreen === 'checklist' || currentScreen === 'emergency_checklist') && (
          <EmergencyChecklist
            hazardData={hazardData}
            items={checklistItems}
            setItems={setChecklistItems}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={handleNavigateScreen}
          />
        )}

        {currentScreen === 'confirm_safe' && (
          <SafeConfirmation
            hazardData={hazardData}
            familyMembers={familyMembers}
            onResetFlow={() => setCurrentScreen('home')}
            onNavigateScreen={handleNavigateScreen}
          />
        )}

        {currentScreen === 'safety_map' && (
          <GlobalSafetyMap
            currentUser={authUser}
            isShareActive={isSafetyShareActive}
            setIsShareActive={setIsSafetyShareActive}
            safetyShareDetails={safetyShareDetails}
            setSafetyShareDetails={setSafetyShareDetails}
            hazardData={hazardData}
            onNavigateScreen={handleNavigateScreen}
            onNavigateRoute={(target) => {
              setNavigationTarget(target);
              setCurrentScreen('route');
            }}
          />
        )}

        {currentScreen === 'sar_dashboard' && authUser.role === 'sar' && (
          <SarDashboard
            currentUser={authUser}
            onSwitchToCitizenView={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'share_status' && (
          <ShareStatus
            isShareActive={isSafetyShareActive}
            setIsShareActive={setIsSafetyShareActive}
            safetyShareDetails={safetyShareDetails}
            setSafetyShareDetails={setSafetyShareDetails}
            onBack={() => setCurrentScreen('safety_map')}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            currentUser={authUser}
            onSignOut={handleSignOut}
            onBack={() => setCurrentScreen('home')}
            onProfileUpdated={handleProfileUpdated}
            savedOfflineCard={offlineEmergencyCard}
            onSaveOfflineCard={handleSaveOfflineEmergencyCard}
            onOpenEmergencyCard={() => setCurrentScreen('emergency_card')}
          />
        )}

        {currentScreen === 'emergency_card' && (
          <EmergencyIdentityCard
            card={offlineEmergencyCard}
            onBack={() => setCurrentScreen('settings')}
            onClear={handleClearOfflineEmergencyCard}
          />
        )}

        {/* Fallback Graceful Safety: Mencegah layar blank jika screen state tidak dikenali */}
        {![
          'onboarding', 'home', 'input', 'review', 'assessment', 'emergency',
          'family', 'route', 'safe_route', 'posko', 'checklist', 'emergency_checklist',
          'confirm_safe', 'safety_map', 'sar_dashboard', 'share_status', 'settings', 'emergency_card'
        ].includes(currentScreen) && (
          <HomeDashboard
            onSelectFlow={() => setCurrentScreen('input')}
            onNavigateScreen={handleNavigateScreen}
            hazardData={hazardData}
            setHazardData={setHazardData}
          />
        )}
        </div>
      </main>

      {currentScreen !== 'emergency' && (
        <div className="bottom-dock-wrap">
          {isMoreMenuOpen && (
            <div className="dock-more-menu animate-fadeIn max-h-[75vh] overflow-y-auto" role="menu" aria-label="Layar dan fitur lainnya">
              {/* Mobile Bottom Sheet Drag Handle */}
              <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto my-1 sm:hidden" />
              <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-between px-2 pb-2.5 border-b border-slate-200">
                <div>
                  <span className="text-xs font-black text-slate-800">Menu & Fitur Evacu8</span>
                  <p className="text-[10px] text-slate-500">Pilih panduan evakuasi atau alat pendukung</p>
                </div>
                <button type="button" className="dock-close" onClick={() => setIsMoreMenuOpen(false)} aria-label="Tutup menu">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 pt-3 pb-2">
                {secondaryGroups.map(group => (
                  <div key={group.category} className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
                      {group.category}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {group.items.map(item => {
                        const IconComponent = item.icon || Layers;
                        const isActive = currentScreen === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setCurrentScreen(item.id);
                              setIsMoreMenuOpen(false);
                            }}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                              isActive
                                ? 'bg-blue-50 border-blue-300 text-[#0D47A1] shadow-xs'
                                : item.highlight
                                  ? 'bg-rose-50/70 border-rose-200 text-rose-950 hover:bg-rose-100/70'
                                  : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`p-1.5 rounded-lg shrink-0 ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : item.highlight
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <nav className="bottom-dock" aria-label="Navigasi utama">
            {primaryNavigation.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setCurrentScreen(id);
                  setIsMoreMenuOpen(false);
                }}
                aria-current={currentScreen === id ? 'page' : undefined}
                className={`dock-item ${currentScreen === id ? 'dock-item-active' : ''}`}
              >
                <span className="dock-icon-wrap"><Icon className="w-[18px] h-[18px]" /></span>
                <span className="dock-label">{label}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(open => !open)}
              aria-expanded={isMoreMenuOpen}
              aria-current={isMoreScreen ? 'page' : undefined}
              className={`dock-item ${isMoreScreen ? 'dock-item-active' : ''}`}
            >
              <span className="dock-icon-wrap"><Layers className="w-[18px] h-[18px]" /></span>
              <span className="dock-label">Lainnya</span>
            </button>
          </nav>
        </div>
      )}

      {/* Footer (Ample Bottom Clearance to Prevent Dock Collision) */}
      <footer className="app-footer border-t border-slate-200/80 bg-white/90 backdrop-blur-md pt-8 pb-32 sm:pb-36 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-[#0D47A1] text-sm">
              Evacu8 — Sistem Respon & Panduan Bencana Cepat
            </p>
            <p className="text-[11px] text-slate-500">
              Dirancang untuk keselamatan warga, panduan terarah, dan koordinasi tanggap darurat saat krisis.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-slate-600 font-medium sm:justify-end sm:text-left">
            <button onClick={() => setCurrentScreen('onboarding')} className="hover:text-[#0D47A1] transition-colors cursor-pointer">
              Panduan & Edukasi
            </button>
            <span className="hidden sm:inline text-slate-300">•</span>
            <button onClick={() => setCurrentScreen('family')} className="hover:text-[#0D47A1] transition-colors cursor-pointer">
              Status Keluarga
            </button>
            <span className="hidden sm:inline text-slate-300">•</span>
            <button onClick={() => setCurrentScreen('route')} className="hover:text-[#0D47A1] transition-colors cursor-pointer">
              Jalur Evakuasi
            </button>
            <span className="hidden sm:inline text-slate-300">•</span>
            <button onClick={() => setCurrentScreen('safety_map')} className="hover:text-[#0D47A1] transition-colors cursor-pointer">
              Radar Keselamatan
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
