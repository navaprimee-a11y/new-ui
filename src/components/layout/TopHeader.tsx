import React from 'react';
import { ScreenId, UserSession } from '../../types';

interface TopHeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  session: UserSession;
  onOpenVoice: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentScreen,
  onNavigate,
  session,
  onOpenVoice,
}) => {
  const screenMeta: Record<ScreenId, { title: string; subtitle: string; category: string }> = {
    home: { category: 'Assistant', title: 'Voice Assistant Console', subtitle: 'Biometric offline transport intelligence' },
    routes: { category: 'Transport', title: 'Corridor Route Planner', subtitle: 'Metropolitan multimodal transit schedule' },
    navigation: { category: 'GIS', title: 'Live Navigation Engine', subtitle: 'High-fidelity corridor geospatial tracking' },
    personal: { category: 'Security', title: 'Personal Commute Vault', subtitle: 'Hardware-encrypted commuter waypoints' },
    security: { category: 'Verification', title: 'Security & Verification', subtitle: 'Resemblyzer & Whisper.cpp protection layer' },
    activity: { category: 'Audit', title: 'System Activity Audit Log', subtitle: 'Tamper-evident transport interaction history' },
    profile: { category: 'Preferences', title: 'Driver Profile & Settings', subtitle: 'Voiceprint confidence & storage options' },
  };

  const meta = screenMeta[currentScreen] || { category: 'Console', title: 'TransitVoice', subtitle: 'Operations' };

  return (
    <header className="sticky top-0 z-30 w-full h-16 border-b border-[#334155]/60 bg-[#070d18]/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="md:hidden flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#93c5fd]/40 bg-[#111c30] flex items-center justify-center p-0.5">
            <img
              src="/src/assets/images/transitvoice_brand_emblem_1791559189963.jpg"
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <span className="material-symbols-outlined text-[#93c5fd] text-[18px]">mic</span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#64748b] hidden sm:inline uppercase">
              {meta.category} /
            </span>
            <h2 className="font-display text-sm md:text-base font-bold text-[#f1f5f9] truncate">
              {meta.title}
            </h2>
          </div>
          <p className="text-[11px] text-[#94a3b8] hidden md:block truncate">
            {meta.subtitle}
          </p>
        </div>
      </div>

      {/* Zone 2: Mobile Navigation Pill Switcher */}
      <nav className="md:hidden flex items-center gap-1 overflow-x-auto py-1 max-w-[190px] sm:max-w-xs no-scrollbar">
        {(['home', 'routes', 'navigation', 'security'] as ScreenId[]).map((id) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`px-2 py-1 text-[11px] rounded-lg font-semibold whitespace-nowrap transition-colors ${
              currentScreen === id
                ? 'bg-[#3b82f6]/20 text-[#93c5fd] border border-[#3b82f6]/40'
                : 'text-[#cbd5e1] hover:bg-[#111c30]'
            }`}
          >
            {id === 'home' ? 'Voice' : id === 'routes' ? 'Routes' : id === 'navigation' ? 'Nav' : 'Security'}
          </button>
        ))}
      </nav>

      {/* Zone 3: Security & Primary Trigger */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#111c30] border border-[#334155]/60 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
          <span className="font-mono text-[#94a3b8]">COIMBATORE // OFFLINE READY</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
            session.authenticated
              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
              : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {session.authenticated ? 'verified_user' : 'lock'}
          </span>
          <span className="hidden sm:inline">
            {session.authenticated ? 'BIOMETRIC VERIFIED' : 'UNVERIFIED'}
          </span>
        </div>

        <button
          onClick={onOpenVoice}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-[#070d18] font-bold text-xs transition-all shadow-[0_0_16px_rgba(59,130,246,0.3)] cursor-pointer active:scale-95"
          title="Open Voice Console"
        >
          <span className="material-symbols-outlined text-[16px]">mic</span>
          <span className="hidden sm:inline">Voice Assistant</span>
        </button>
      </div>
    </header>
  );
};
