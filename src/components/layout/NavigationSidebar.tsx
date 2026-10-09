import React from 'react';
import { ScreenId, UserSession } from '../../types';

interface NavigationSidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  session: UserSession;
  onLogout: () => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  currentScreen,
  onNavigate,
  session,
  onLogout,
}) => {
  const navItems: Array<{ id: ScreenId; label: string; icon: string; badge?: string }> = [
    { id: 'home', label: 'Voice Assistant', icon: 'mic' },
    { id: 'routes', label: 'Corridor Routes', icon: 'directions_bus' },
    { id: 'navigation', label: 'Live Navigation', icon: 'explore', badge: 'LIVE' },
    { id: 'personal', label: 'Personal Commute', icon: 'person' },
    { id: 'security', label: 'Security & Biometrics', icon: 'shield' },
    { id: 'activity', label: 'Audit Activity', icon: 'history' },
    { id: 'profile', label: 'Profile & Settings', icon: 'account_circle' },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen fixed left-0 top-0 w-64 border-r border-[#334155]/60 bg-[#08101e] z-40 select-none shadow-2xl">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-[#334155]/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#93c5fd]/40 shadow-[0_0_16px_rgba(59,130,246,0.3)] bg-[#111c30] flex items-center justify-center p-0.5">
          <img
            src="/src/assets/images/transitvoice_brand_emblem_1791559189963.jpg"
            alt="TransitVoice Emblem"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="material-symbols-outlined text-[#93c5fd] text-[22px] pointer-events-none">
            shield_with_heart
          </span>
        </div>
        <div>
          <h1 className="font-display text-[17px] font-bold text-[#f1f5f9] tracking-tight leading-none flex items-center gap-1.5">
            TransitVoice
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          </h1>
          <p className="text-[10px] font-mono text-[#93c5fd]/80 uppercase tracking-wider mt-1">
            Offline Transport OS
          </p>
        </div>
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer group ${
                isActive
                  ? 'text-[#93c5fd] bg-[#3b82f6]/15 border border-[#3b82f6]/40 shadow-[0_0_16px_rgba(59,130,246,0.15)] font-bold'
                  : 'text-[#cbd5e1] hover:text-[#f1f5f9] hover:bg-[#111c30]/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined text-[19px] transition-transform duration-150 group-hover:scale-110 ${
                    isActive ? 'text-[#93c5fd]' : 'text-[#64748b]'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge ? (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#3b82f6] text-[#070d18]">
                  {item.badge}
                </span>
              ) : item.id === 'security' ? (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    session.authenticated
                      ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                      : 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                  }`}
                >
                  {session.authenticated ? 'SEC' : 'REQ'}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Driver Footer Card & Session Control */}
      <div className="p-3.5 border-t border-[#334155]/50 bg-[#070d18]/90">
        <div className="glass-panel p-2.5 rounded-xl flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-[#93c5fd]/40 bg-[#111c30] p-0.5 shadow-sm">
              <img
                src="/src/assets/images/driver_operator_logo_1791563331563.jpg"
                alt="Transit Driver Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="material-symbols-outlined text-[#64748b] text-[18px] p-2">
                person
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#f1f5f9] truncate">
                {session.userName}
              </p>
              <p className="text-[10px] font-mono text-[#93c5fd]/90 truncate">
                {session.clearanceLevel}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-[11px] font-semibold text-[#cbd5e1] hover:text-[#ef4444] hover:bg-[#111c30] transition-colors border border-transparent hover:border-[#ef4444]/30 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">logout</span>
          <span>{session.authenticated ? 'Lock Session' : 'Authenticate Driver'}</span>
        </button>
      </div>
    </aside>
  );
};
