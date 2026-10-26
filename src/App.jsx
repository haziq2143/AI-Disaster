'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  ShieldAlert, 
  Home, 
  Users, 
  MapPin,
  CheckSquare, 
  Layers, 
  X
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
  // Navigation states: 12 screens according to PRD 7.2
  const [currentScreen, setCurrentScreen] = useState('home');
  const [authUser, setAuthUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
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
  const currentFamilyRef = useRef({ familyMembers, familyPlan });
  const lastSyncedFamilyRef = useRef(null);
  const familySyncReadyRef = useRef(false);
  const loadedAccountIdRef = useRef(null);

  currentFamilyRef.current = { familyMembers, familyPlan };

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store', credentials: 'same-origin' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Sesi akun gagal dimuat.');
        if (active) {
          setAuthUser(result.user);
          setAuthError('');
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

  // PRD Screen Index mapping for demo reviewer
  const screenList = [
    { id: 'onboarding', num: '01', name: 'Onboarding' },
    { id: 'home', num: '02', name: 'Home Dashboard' },
    { id: 'input', num: '03', name: 'Situation Input' },
    { id: 'review', num: '04', name: 'Review Input' },
    { id: 'assessment', num: '05', name: 'Panduan Skenario' },
    { id: 'emergency', num: '06', name: 'Panduan Darurat', highlight: true },
    { id: 'family', num: '07', name: 'Family Safety' },
    { id: 'route', num: '08', name: 'Safe Route' },
    { id: 'checklist', num: '09', name: 'Emergency Checklist' },
    { id: 'confirm_safe', num: '10', name: 'Safe Confirmation' },
    { id: 'safety_map', num: '11', name: 'Global Safety Map' },
    { id: 'share_status', num: '12', name: 'Share Status & Report Abuse' },
    ...(authUser?.role === 'sar' ? [{ id: 'sar_dashboard', num: '13', name: 'Panel Tim SAR' }] : [])
  ];

  const primaryNavigation = [
    { id: 'home', label: 'Beranda', icon: Home },
    { id: 'family', label: 'Keluarga', icon: Users },
    { id: 'safety_map', label: 'Peta', icon: MapPin },
    { id: 'checklist', label: 'Tas Siaga', icon: CheckSquare },
  ];

  const secondaryScreens = screenList.filter(screen => (
    !primaryNavigation.some(item => item.id === screen.id) && screen.id !== 'emergency'
  ));

  const isMoreScreen = secondaryScreens.some(screen => screen.id === currentScreen)
    || currentScreen === 'emergency';

  if (!authReady) {
    return <main className="flex min-h-dvh items-center justify-center text-sm font-semibold text-slate-600">Memeriksa sesi akun…</main>;
  }
  if (!authUser) {
    return (
      <AuthScreen
        onAuthenticated={user => { setAuthUser(user); setAuthError(''); }}
        onContinueGuest={() => {
          setAuthUser({ id: 'guest-local', name: 'Pengguna tamu', role: 'user', canManageRoles: false, isGuest: true });
          setAuthError('');
        }}
        initialError={authError}
      />
    );
  }

  return (
    <div className="app-shell min-h-dvh text-slate-800 flex flex-col font-sans">
      {/* Top Demo Bar / Screen Switcher Pill for UI/UX Evaluation */}
      <div className="demo-bar text-white text-xs px-4 py-2 border-b border-[#2196F3]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]">
            </span>
            <span className="font-extrabold tracking-[0.14em] uppercase text-[10px] text-blue-100">
              Prototype interaktif · Data simulasi
            </span>
          </div>
          <span className="hidden sm:inline text-[10px] font-medium text-blue-200">Informasi pada prototype bukan data real-time</span>
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-[#0D47A1] to-[#2196F3] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[#0D47A1] tracking-tight">
                  AI Disaster
                </span>
                <span className="hidden text-[10px] font-bold px-1.5 py-0.2 bg-[#E3F2FD] text-[#0D47A1] rounded border border-[#90CAF9] min-[400px]:inline">
                  ASSISTANT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Keputusan & Evakuasi Cepat Terstruktur</p>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {authUser.role === 'sar' && (
              <button onClick={() => setCurrentScreen('sar_dashboard')} className="hidden rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-[#0D47A1] sm:block">
                Panel SAR
              </button>
            )}
            <div className="hidden text-right md:block">
              <p className="max-w-36 truncate text-xs font-bold text-slate-800">{authUser.name}</p>
              <p className="text-[10px] text-slate-500">{authUser.role === 'sar' ? 'Tim SAR' : 'Pengguna'}</p>
            </div>
            <button type="button" onClick={handleSignOut} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 sm:px-2.5">
              {authUser.isGuest ? 'Masuk' : 'Keluar'}
            </button>
            <button
              onClick={() => setCurrentScreen('emergency')}
              className="emergency-header-action"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span className="hidden sm:inline">Mode Darurat</span>
              <span className="sm:hidden">Darurat</span>
            </button>
          </div>
        </div>
      </header>

      {/* Screen Render Switcher */}
      <main className={`app-main flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 ${currentScreen === 'emergency' ? 'pb-8' : 'pb-32 sm:pb-36'}`}>
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

        {currentScreen === 'route' && (
          <SafeRoute
            hazardData={hazardData}
            familyMembers={familyMembers}
            navigationTarget={navigationTarget}
            setNavigationTarget={setNavigationTarget}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
          />
        )}

        {currentScreen === 'checklist' && (
          <EmergencyChecklist
            hazardData={hazardData}
            items={checklistItems}
            setItems={setChecklistItems}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
          />
        )}

        {currentScreen === 'confirm_safe' && (
          <SafeConfirmation
            hazardData={hazardData}
            familyMembers={familyMembers}
            onResetFlow={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
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
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
            onNavigateRoute={(target) => {
              setNavigationTarget(target);
              setCurrentScreen('route');
            }}
          />
        )}

        {currentScreen === 'sar_dashboard' && authUser.role === 'sar' && (
          <SarDashboard currentUser={authUser} />
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
      </main>

      {currentScreen !== 'emergency' && (
        <div className="bottom-dock-wrap">
          {isMoreMenuOpen && (
            <div className="dock-more-menu animate-fadeIn" role="menu" aria-label="Layar prototype lainnya">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200/70">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">Layar lainnya</span>
                <button type="button" className="dock-close" onClick={() => setIsMoreMenuOpen(false)} aria-label="Tutup menu layar lainnya">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-2">
                {secondaryScreens.map(screen => (
                  <button
                    key={screen.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCurrentScreen(screen.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`dock-more-item ${screen.id === currentScreen ? 'dock-more-item-active' : ''}`}
                  >
                    <span className="text-[10px] font-extrabold text-blue-500">{screen.num}</span>
                    <span>{screen.name}</span>
                  </button>
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

      {/* Footer conforming to PRD Principles & Transparency */}
      <footer className="app-footer border-t border-white/70 py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <p className="font-bold text-[#0D47A1]">
              AI Disaster Assistant — Prototype Lomba UI/UX
            </p>
            <p className="text-[11px] text-slate-400">
              Palet: #0D47A1 (Navy) · #2196F3 (Electric) · #90CAF9 (Sky) · #E3F2FD (Ice Light)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-slate-600 font-medium sm:justify-end sm:text-left">
            <button onClick={() => setCurrentScreen('onboarding')} className="hover:text-[#0D47A1] cursor-pointer">
              PRD & Metrik
            </button>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => setCurrentScreen('family')} className="hover:text-[#0D47A1] cursor-pointer">
              Family Safety
            </button>
            <span className="hidden sm:inline">•</span>
            <button onClick={() => setCurrentScreen('route')} className="hover:text-[#0D47A1] cursor-pointer">
              Safe Route
            </button>
            <button onClick={() => setCurrentScreen('safety_map')} className="hover:text-[#0D47A1] cursor-pointer">
              Global Safety Map
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
