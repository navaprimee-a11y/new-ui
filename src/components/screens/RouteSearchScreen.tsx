import React, { useState, useEffect } from 'react';
import { COIMBATORE_ROUTES } from '../../services/apiService';
import { TransitRoute, ScreenId } from '../../types';

interface RouteSearchScreenProps {
  onSelectRouteForNav: (routeId: string) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const RouteSearchScreen: React.FC<RouteSearchScreenProps> = ({
  onSelectRouteForNav,
  onNavigate,
}) => {
  const [source, setSource] = useState<string>('Coimbatore Junction');
  const [destination, setDestination] = useState<string>('TIDEL Park North');
  const [travelMode, setTravelMode] = useState<'all' | 'bus' | 'train' | 'walk' | 'bike'>('all');
  const [departTime, setDepartTime] = useState<string>('now');
  const [routesList, setRoutesList] = useState<TransitRoute[]>(COIMBATORE_ROUTES);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>('12');

  const handleSwapEndpoints = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      let filtered = [...COIMBATORE_ROUTES];
      if (travelMode !== 'all') {
        filtered = filtered.filter((r) => r.mode === travelMode);
      }
      setRoutesList(filtered);
      setIsSearching(false);
    }, 350);
  };

  useEffect(() => {
    handleSearch();
  }, [travelMode]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* 12-Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Journey Planning Configuration Form (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#334155]/70 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]/50">
              <h3 className="font-display text-base font-bold text-[#f1f5f9] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#93c5fd]">alt_route</span>
                Plan Transit Route
              </h3>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded border border-[#10b981]/30">
                SQLITE BACKED
              </span>
            </div>

            {/* Origin & Destination Inputs with Swap */}
            <div className="space-y-3 relative">
              {/* Origin */}
              <div className="relative">
                <label className="text-[10px] font-mono text-[#64748b] uppercase block mb-1 font-bold">
                  Origin (Starting Point)
                </label>
                <div className="flex items-center gap-2 bg-[#0b1322] border border-[#334155]/80 focus-within:border-[#3b82f6] rounded-xl px-3.5 py-2.5 transition-colors">
                  <span className="material-symbols-outlined text-[#10b981] text-[18px]">
                    trip_origin
                  </span>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Enter station, street, or landmark"
                    className="w-full bg-transparent text-xs text-[#f1f5f9] placeholder-[#64748b] outline-none"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-end -my-1 pr-3 relative z-10">
                <button
                  type="button"
                  onClick={handleSwapEndpoints}
                  className="w-7 h-7 rounded-full bg-[#16243d] hover:bg-[#3b82f6]/20 border border-[#334155] hover:border-[#3b82f6] flex items-center justify-center text-[#93c5fd] transition-all cursor-pointer shadow-md"
                  title="Swap Origin and Destination"
                >
                  <span className="material-symbols-outlined text-[15px]">swap_vert</span>
                </button>
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="text-[10px] font-mono text-[#64748b] uppercase block mb-1 font-bold">
                  Destination (Arrival Point)
                </label>
                <div className="flex items-center gap-2 bg-[#0b1322] border border-[#334155]/80 focus-within:border-[#3b82f6] rounded-xl px-3.5 py-2.5 transition-colors">
                  <span className="material-symbols-outlined text-[#93c5fd] text-[18px]">
                    location_on
                  </span>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Enter destination stop"
                    className="w-full bg-transparent text-xs text-[#f1f5f9] placeholder-[#64748b] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Travel Mode Selector */}
            <div>
              <label className="text-[10px] font-mono text-[#64748b] uppercase block mb-2 font-bold">
                Travel Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'all', label: 'All', icon: 'sync_alt' },
                  { id: 'bus', label: 'Bus', icon: 'directions_bus' },
                  { id: 'train', label: 'Rail', icon: 'train' },
                  { id: 'walk', label: 'Walk', icon: 'directions_walk' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTravelMode(mode.id as typeof travelMode)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      travelMode === mode.id
                        ? 'bg-[#3b82f6]/20 border-[#93c5fd] text-[#93c5fd] shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                        : 'bg-[#0b1322] border-[#334155]/60 text-[#cbd5e1] hover:bg-[#16243d]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[17px] mb-0.5">
                      {mode.icon}
                    </span>
                    <span>{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selector */}
            <div>
              <label className="text-[10px] font-mono text-[#64748b] uppercase block mb-1 font-bold">
                Departure Time
              </label>
              <select
                value={departTime}
                onChange={(e) => setDepartTime(e.target.value)}
                className="w-full bg-[#0b1322] border border-[#334155]/80 text-xs text-[#f1f5f9] rounded-xl px-3 py-2.5 outline-none focus:border-[#3b82f6]"
              >
                <option value="now">Leave Now (Immediate Dispatch)</option>
                <option value="morning">Morning Peak (08:30 AM)</option>
                <option value="evening">Evening Return (05:30 PM)</option>
                <option value="late">Night Transit (10:00 PM)</option>
              </select>
            </div>

            {/* Search Action */}
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full py-2.5 px-4 rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-[#070d18] font-bold text-xs transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[17px]">
                {isSearching ? 'refresh' : 'search'}
              </span>
              <span>{isSearching ? 'Calculating Routes...' : 'Search Available Corridors'}</span>
            </button>
          </div>

          {/* Transportation Terminal Visual Showcase Card */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-[#334155]/70 relative shadow-xl">
            <div className="h-40 w-full relative overflow-hidden bg-[#111c30]">
              <img
                src="/src/assets/images/transit_terminal_hub_1791559230485.jpg"
                alt="Coimbatore Smart Transit Terminal"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070d18] via-transparent to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-[10px] font-mono text-[#93c5fd] uppercase tracking-wider font-bold">
                  Terminal Telemetry
                </p>
                <h4 className="font-display text-sm font-bold text-[#ffffff]">
                  Gandhipuram Central Hub
                </h4>
              </div>
            </div>
            <div className="p-3 text-[11px] text-[#94a3b8] flex items-center justify-between">
              <span>Next departures from Platform 4: Every 8 mins</span>
              <span className="font-mono text-[#10b981] font-bold">Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Search Results List (Col span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <div>
              <h3 className="font-display text-base font-bold text-[#f1f5f9]">
                Available Corridor Routes
              </h3>
              <p className="text-xs text-[#64748b]">
                Found {routesList.length} verified transit options for your destination
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#64748b]">
              <span className="font-mono text-[10px] text-[#93c5fd]">Sorted by Duration</span>
            </div>
          </div>

          {routesList.map((route) => {
            const isExpanded = expandedRouteId === route.id;
            return (
              <div
                key={route.id}
                className="glass-panel p-5 rounded-2xl border border-[#334155]/60 hover:border-[#93c5fd]/50 transition-all space-y-4 shadow-xl"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#16243d] border border-[#3b82f6]/30 flex items-center justify-center text-[#93c5fd] shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-[22px]">
                        {route.mode === 'train' ? 'train' : 'directions_bus'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-[#3b82f6] text-[#070d18]">
                          {route.code}
                        </span>
                        <h4 className="font-display text-sm font-bold text-[#f1f5f9]">
                          {route.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-[#cbd5e1]">
                        <span className="font-mono text-[#93c5fd] font-semibold">
                          {route.departureTime}
                        </span>
                        <span className="material-symbols-outlined text-[13px] text-[#64748b]">
                          arrow_forward
                        </span>
                        <span className="font-mono text-[#93c5fd] font-semibold">
                          {route.arrivalTime}
                        </span>
                        <span className="text-[#64748b]">·</span>
                        <span className="font-semibold text-[#10b981]">{route.duration}</span>
                        <span className="text-[#64748b]">·</span>
                        <span className="text-[11px] text-[#94a3b8]">{route.distance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Badges */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                    {route.fastest && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                        FASTEST
                      </span>
                    )}
                    {route.ecoChoice && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#3b82f6]/15 text-[#93c5fd] border border-[#3b82f6]/30">
                        ECO CHOICE
                      </span>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => setExpandedRouteId(isExpanded ? null : route.id)}
                        className="text-xs text-[#94a3b8] hover:text-[#f1f5f9] underline cursor-pointer"
                      >
                        {isExpanded ? 'Hide Stops' : 'View Stops'}
                      </button>

                      <button
                        onClick={() => {
                          onSelectRouteForNav(route.id);
                          onNavigate('navigation');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#3b82f6] hover:bg-[#60a5fa] text-[#070d18] text-xs font-bold transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <span>Start Nav</span>
                        <span className="material-symbols-outlined text-[14px]">explore</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Intermediate Stops Timeline (Collapsible) */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#334155]/40 space-y-2 animate-fadeIn">
                    <p className="text-[10px] font-mono text-[#64748b] uppercase font-bold">
                      Scheduled Stops ({route.stops.length} Waypoints)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {route.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#0b1322] border border-[#334155]/40"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                            <span className="text-[#f1f5f9] font-medium text-[11px]">{stop.name}</span>
                          </div>
                          <span className="font-mono text-[#93c5fd] text-[10px]">
                            {stop.nextArrival}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
