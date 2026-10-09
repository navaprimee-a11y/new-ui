import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiService';
import { PersonalSavedRoute, UserSession, ScreenId } from '../../types';

interface PersonalTransportScreenProps {
  session: UserSession;
  onNavigate: (screen: ScreenId) => void;
  onSelectRouteForNav: (routeId: string) => void;
}

export const PersonalTransportScreen: React.FC<PersonalTransportScreenProps> = ({
  session,
  onNavigate,
  onSelectRouteForNav,
}) => {
  const [savedRoutes, setSavedRoutes] = useState<PersonalSavedRoute[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const res = await apiClient.getPersonalRoutes();
        setSavedRoutes(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRoutes();
  }, []);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* Security Status Banner */}
      <section className="glass-panel p-6 rounded-2xl border-l-4 border-l-[#3b82f6] border border-[#334155]/70 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#3b82f6]/15 text-[#93c5fd] border border-[#3b82f6]/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {session.authenticated ? 'verified_user' : 'lock'}
            </span>
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#f1f5f9]">
              {session.authenticated
                ? `Driver Verified: ${session.userName} (${session.userId})`
                : 'Personal Data Protected & Hardware Encrypted'}
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              {session.authenticated
                ? 'Active biometric session confirmed. Saved personal routes and driver telemetry are unlocked.'
                : 'Your private commute history and saved home routes require biometric voice authentication.'}
            </p>
          </div>
        </div>

        {!session.authenticated ? (
          <button
            onClick={() => onNavigate('home')}
            className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-[#070d18] text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">mic</span>
            <span>Authenticate with Voice</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-3 py-1 rounded-full border border-[#10b981]/30 font-bold">
              HARDWARE KEYSTORE ACTIVE
            </span>
          </div>
        )}
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Saved Routes (Sensitive container) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-[#f1f5f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#93c5fd]">bookmark</span>
                Saved Commute Corridors
              </h3>
              <p className="text-xs text-[#64748b]">
                Pre-cached routes for instant offline dispatch
              </p>
            </div>
            <span className="text-xs font-mono text-[#93c5fd]">
              {savedRoutes.length} ENROLLED ROUTES
            </span>
          </div>

          {/* Sensitive Protected Container */}
          <div className="relative glass-panel rounded-2xl overflow-hidden border border-[#334155]/70 min-h-[260px]">
            {/* Masking overlay when unverified */}
            {!session.authenticated && (
              <div
                id="personal-verify-overlay"
                className="absolute inset-0 z-20 bg-[#070d18]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3"
              >
                <div className="w-13 h-13 rounded-full bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40 flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-[30px]">lock</span>
                </div>
                <h4 className="font-display text-base font-bold text-[#f1f5f9]">
                  Route Details Masked for Security
                </h4>
                <p className="text-xs text-[#94a3b8] max-w-sm">
                  Voice verification is required to unlock personal addresses, home-to-office travel patterns, and private departure times.
                </p>
                <button
                  onClick={() => onNavigate('home')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-[#070d18] text-xs font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                  <span>Verify with Voice Biometrics</span>
                </button>
              </div>
            )}

            {/* Content (Blurred if unverified) */}
            <div
              id="personal-sensitive-content"
              className={`p-4 space-y-3 ${!session.authenticated ? 'blur-sm select-none pointer-events-none' : ''}`}
            >
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="p-4 rounded-xl bg-[#0b1322] hover:bg-[#111c30] border border-[#334155]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#16243d] text-[#93c5fd] flex items-center justify-center shrink-0 border border-[#334155]/50">
                      <span className="material-symbols-outlined text-[20px]">directions_bus</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/15 text-[#93c5fd] font-bold">
                          {route.type}
                        </span>
                        <h4 className="font-display text-sm font-bold text-[#f1f5f9]">
                          {route.route_name}
                        </h4>
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">
                        Via: <span className="text-[#cbd5e1]">{route.via}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-mono text-[#64748b] uppercase">Departure</p>
                      <p className="font-mono text-xs font-bold text-[#10b981]">
                        {route.departureTime}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectRouteForNav('12');
                        onNavigate('navigation');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#3b82f6]/15 hover:bg-[#3b82f6] text-[#93c5fd] hover:text-[#070d18] text-xs font-semibold border border-[#3b82f6]/30 transition-all cursor-pointer"
                    >
                      Navigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frequent Commutes Bento Cards */}
          <div className="space-y-3 pt-1">
            <h4 className="font-display text-sm font-bold text-[#f1f5f9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#93c5fd]">repeat</span>
              Frequent Transit Habits
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-[#334155]/60 hover:border-[#93c5fd]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#93c5fd] font-bold">HIGH FREQUENCY</span>
                  <span className="material-symbols-outlined text-[#10b981] text-[18px]">bolt</span>
                </div>
                <h5 className="font-display text-sm font-bold text-[#f1f5f9]">
                  Downtown Express Corridor
                </h5>
                <p className="text-xs text-[#64748b] mt-1">
                  Average 24 mins · Departures every 6 minutes during morning peak.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-[#334155]/60 hover:border-[#93c5fd]/40 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-[#10b981] font-bold">ECO COMMUTE</span>
                  <span className="material-symbols-outlined text-[#10b981] text-[18px]">eco</span>
                </div>
                <h5 className="font-display text-sm font-bold text-[#f1f5f9]">
                  Peelamedu Electric Shuttle
                </h5>
                <p className="text-xs text-[#64748b] mt-1">
                  Zero-emission EV rapid transit with dedicated lane priority.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Destinations */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#334155]/70 space-y-4 shadow-xl">
            <div className="pb-3 border-b border-[#334155]/40 flex items-center justify-between">
              <h4 className="font-display text-sm font-bold text-[#f1f5f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#93c5fd]">location_on</span>
                Recent Visited Hubs
              </h4>
              <span className="text-[10px] font-mono text-[#64748b]">GPS LOG</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: 'TIDEL Park Coimbatore', sub: 'Sector 7 Tech Zone', time: 'Today, 2h ago' },
                { name: 'Gandhipuram Terminal', sub: 'Platform 3 Central', time: 'Yesterday' },
                { name: 'Coimbatore Airport Terminal', sub: 'Civil Aerodrome Road', time: '3 days ago' },
              ].map((dest, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#0b1322] hover:bg-[#111c30] border border-[#334155]/40 transition-colors"
                >
                  <p className="text-xs font-bold text-[#f1f5f9]">{dest.name}</p>
                  <p className="text-[11px] text-[#64748b]">{dest.sub}</p>
                  <p className="text-[10px] font-mono text-[#93c5fd]/80 mt-1">{dest.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#334155]/70 space-y-2">
            <span className="text-[10px] font-mono text-[#64748b] uppercase font-bold">
              Privacy Standard
            </span>
            <h5 className="font-display text-sm font-bold text-[#f1f5f9]">
              Zero Remote Telemetry Leaks
            </h5>
            <p className="text-xs text-[#94a3b8] leading-relaxed">
              Your commute waypoints are held strictly in local device memory. No unencrypted location trails ever leave this terminal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
