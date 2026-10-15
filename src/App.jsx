import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Home, 
  Users, 
  MapPin, 
  CheckSquare, 
  Sparkles, 
  LifeBuoy, 
  Layers, 
  PhoneCall, 
  Eye, 
  Sun, 
  Moon,
  ChevronRight,
  Menu,
  X,
  Radio,
  FileText
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

import { INITIAL_FAMILY } from './data/mockData';

export default function App() {
  // Navigation states: 12 screens according to PRD 7.2
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  // PRD Screen Index mapping for demo reviewer
  const screenList = [
    { id: 'onboarding', num: '01', name: 'Onboarding' },
    { id: 'home', num: '02', name: 'Home Dashboard' },
    { id: 'input', num: '03', name: 'Situation Input' },
    { id: 'review', num: '04', name: 'Review Input' },
    { id: 'assessment', num: '05', name: 'AI Assessment' },
    { id: 'emergency', num: '06', name: 'AI Emergency Mode', highlight: true },
    { id: 'family', num: '07', name: 'Family Safety' },
    { id: 'route', num: '08', name: 'Safe Route' },
    { id: 'checklist', num: '09', name: 'Emergency Checklist' },
    { id: 'confirm_safe', num: '10', name: 'Safe Confirmation' },
    { id: 'safety_map', num: '11', name: 'Global Safety Map' },
    { id: 'share_status', num: '12', name: 'Share Status & Report Abuse' },
  ];

  const handleStartEmergencyFlow = (target) => {
    setCurrentScreen('input');
  };

  return (
    <div className="app-shell min-h-screen text-slate-800 flex flex-col font-sans">
      {/* Top Demo Bar / Screen Switcher Pill for UI/UX Evaluation */}
      <div className="demo-bar text-white text-xs px-4 py-2 border-b border-[#2196F3]/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#2196F3] text-white rounded text-[10px] font-extrabold tracking-wider uppercase">
              12 SCREEN PROTOTYPE
            </span>
            <span className="hidden sm:inline text-blue-200">
              PRD AI Disaster Assistant (Sesuai Spesifikasi Lomba)
            </span>
          </div>

          {/* Quick Screen Jump Selector */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] text-[#90CAF9] whitespace-nowrap hidden md:inline">Lompat Layar:</span>
            <select
              value={currentScreen}
              onChange={(e) => setCurrentScreen(e.target.value)}
              className="bg-[#1565C0] text-white text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#90CAF9]/40 outline-none cursor-pointer"
            >
              {screenList.map(s => (
                <option key={s.id} value={s.id}>
                  Screen {s.num}: {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="app-header sticky top-0 z-40 backdrop-blur-xl border-b border-white/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <button 
            onClick={() => setCurrentScreen('home')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0D47A1] to-[#2196F3] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-[#0D47A1] tracking-tight">
                  AI Disaster
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#E3F2FD] text-[#0D47A1] rounded border border-[#90CAF9]">
                  ASSISTANT
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">Keputusan & Evakuasi Cepat Terstruktur</p>
            </div>
          </button>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'home' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setCurrentScreen('family')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'family' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Family Safety
            </button>
            <button
              onClick={() => setCurrentScreen('route')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'route' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Safe Route
            </button>
            <button
              onClick={() => setCurrentScreen('safety_map')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'safety_map' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Safety Map
            </button>
            <button
              onClick={() => setCurrentScreen('checklist')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'checklist' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Tas Siaga
            </button>
            <button
              onClick={() => setCurrentScreen('onboarding')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                currentScreen === 'onboarding' ? 'text-[#0D47A1] bg-[#E3F2FD]' : 'text-slate-600 hover:text-[#0D47A1]'
              }`}
            >
              Tentang Produk
            </button>
          </nav>

          {/* Right Action: Emergency Fast Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentScreen('emergency')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 hover:shadow-lg transition-all cursor-pointer pulse-emergency"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>Emergency Mode</span>
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-2 animate-fadeIn">
            {screenList.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setCurrentScreen(s.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                  currentScreen === s.id ? 'bg-[#E3F2FD] text-[#0D47A1]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Screen {s.num}: {s.name}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Screen Render Switcher */}
      <main className="app-main flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
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
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
          />
        )}

        {currentScreen === 'route' && (
          <SafeRoute
            hazardData={hazardData}
            onBack={() => setCurrentScreen('home')}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
          />
        )}

        {currentScreen === 'checklist' && (
          <EmergencyChecklist
            hazardData={hazardData}
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
            isShareActive={isSafetyShareActive}
            safetyShareDetails={safetyShareDetails}
            onNavigateScreen={(scr) => setCurrentScreen(scr)}
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
      </main>

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

          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <button onClick={() => setCurrentScreen('onboarding')} className="hover:text-[#0D47A1] cursor-pointer">
              PRD & Metrik
            </button>
            <span>•</span>
            <button onClick={() => setCurrentScreen('family')} className="hover:text-[#0D47A1] cursor-pointer">
              Family Safety
            </button>
            <span>•</span>
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
