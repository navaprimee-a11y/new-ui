import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiService';
import { ActivityLogItem, UserSession, ScreenId } from '../../types';

interface ActivityHistoryScreenProps {
  session: UserSession;
  onNavigate: (screen: ScreenId) => void;
}

export const ActivityHistoryScreen: React.FC<ActivityHistoryScreenProps> = ({
  session,
  onNavigate,
}) => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSecurity, setSelectedSecurity] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.getPersonalHistory();
        setLogs(res.data as unknown as ActivityLogItem[]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesSec = selectedSecurity === 'all' || item.securityLevel === selectedSecurity;

    return matchesSearch && matchesType && matchesSec;
  });

  const handleExportLog = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transitvoice_audit_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // If user is unauthenticated, show security guard
  if (!session.authenticated) {
    return (
      <div className="glass-panel p-8 md:p-12 rounded-2xl max-w-xl mx-auto my-12 text-center space-y-4 border border-[#f87171]/40 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-[#f87171]/15 text-[#f87171] border border-[#f87171]/40 flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[36px]">lock</span>
        </div>
        <h3 className="font-display text-xl font-bold text-[#dbe2f7]">
          Access Denied: Voice Verification Required
        </h3>
        <p className="text-xs text-[#c3c6d4]/80">
          Protected activity history and driver command audit logs require active biometric voice security.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="mt-2 px-6 py-2.5 rounded-xl bg-[#5d8ef1] hover:bg-[#aec6ff] text-[#001a43] text-xs font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">mic</span>
          <span>Authenticate with Voice</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[#dbe2f7]">
            System Command &amp; Audit History
          </h3>
          <p className="text-xs text-[#8d909e]">
            Review recent voice commands, route requests, and security verifications
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8d909e] text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="bg-[#141c2a] border border-[#424752]/70 rounded-xl py-2 pl-9 pr-3 text-xs text-[#dbe2f7] placeholder-[#8d909e] outline-none focus:border-[#5d8ef1] w-48 sm:w-56"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#141c2a] border border-[#424752]/70 rounded-xl py-2 px-3 text-xs text-[#dbe2f7] outline-none focus:border-[#5d8ef1]"
          >
            <option value="all">Type: All</option>
            <option value="voice">Voice Commands</option>
            <option value="route">Route Inquiries</option>
            <option value="security">Security Checks</option>
            <option value="system">System Alerts</option>
          </select>

          {/* Export Action */}
          <button
            onClick={handleExportLog}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5d8ef1]/15 hover:bg-[#5d8ef1] text-[#aec6ff] hover:text-[#001a43] text-xs font-bold border border-[#5d8ef1]/30 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export Log</span>
          </button>
        </div>
      </div>

      {/* Bento Grid: Metrics + Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Metrics Cards (Col span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#424752]/60 shadow-xl space-y-4">
            <span className="text-[11px] font-mono text-[#8d909e] uppercase tracking-wider">
              Activity Volume (24h)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold text-[#aec6ff]">142</span>
              <span className="text-xs text-[#8d909e]">queries processed</span>
            </div>

            {/* Pure CSS Volume Bars */}
            <div className="flex items-end gap-1.5 h-16 pt-3 border-t border-[#424752]/40">
              {[35, 55, 45, 80, 100, 60, 40, 75, 90, 65].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: i === 4 ? '#5d8ef1' : '#222a39',
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#424752]/60 shadow-xl space-y-3">
            <span className="text-[11px] font-mono text-[#8d909e] uppercase tracking-wider">
              Verification Compliance
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                  <span className="text-[#dbe2f7]">Verified Requests</span>
                </div>
                <span className="font-mono text-[#10b981] font-bold">98.5%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-[#dbe2f7]">Anomalies Deflected</span>
                </div>
                <span className="font-mono text-[#f59e0b] font-bold">1.2%</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f87171]"></span>
                  <span className="text-[#dbe2f7]">Blocked Replays</span>
                </div>
                <span className="font-mono text-[#f87171] font-bold">0.3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Timeline (Col span 8) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-[#424752]/60 shadow-xl overflow-hidden flex flex-col h-[600px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-[#141c2a] border-b border-[#424752]/50 text-[11px] font-mono text-[#8d909e] uppercase sticky top-0 z-10">
            <div className="col-span-1">Type</div>
            <div className="col-span-3">Event</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2 text-right">Security</div>
          </div>

          {/* Table Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#424752]/30 p-2">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8d909e]">
                No activity records matched your filter criteria.
              </div>
            ) : (
              filteredLogs.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-3 px-4 py-3.5 hover:bg-[#141c2a]/70 rounded-xl transition-colors items-center text-xs"
                >
                  <div className="col-span-1 flex justify-center">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        item.type === 'voice'
                          ? 'text-[#aec6ff]'
                          : item.type === 'security'
                          ? 'text-[#10b981]'
                          : item.type === 'route'
                          ? 'text-[#5d8ef1]'
                          : 'text-[#f59e0b]'
                      }`}
                    >
                      {item.type === 'voice'
                        ? 'mic'
                        : item.type === 'security'
                        ? 'verified_user'
                        : item.type === 'route'
                        ? 'directions_bus'
                        : 'warning'}
                    </span>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="font-semibold text-[#dbe2f7] truncate">{item.title}</p>
                    <p className="text-[10px] font-mono text-[#8d909e] uppercase">{item.type}</p>
                  </div>

                  <div className="col-span-4 min-w-0">
                    <p className="text-[#c3c6d4] truncate" title={item.details}>
                      {item.details}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="font-mono text-[#aec6ff] text-[11px]">{item.timestamp}</p>
                    <p className="text-[10px] text-[#8d909e]">{item.relativeTime}</p>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                        item.securityLevel === 'verified'
                          ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                          : item.securityLevel === 'elevated'
                          ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/30'
                          : 'bg-[#5d8ef1]/15 text-[#aec6ff] border-[#5d8ef1]/30'
                      }`}
                    >
                      {item.securityLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
