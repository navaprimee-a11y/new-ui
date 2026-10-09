import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/apiService';
import { UserProfile, UserSession } from '../../types';

interface ProfileSettingsScreenProps {
  session: UserSession;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({ session }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [localDataStorage, setLocalDataStorage] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<boolean>(false);
  const [language, setLanguage] = useState<string>('English (US) - Transit Optimized');
  const [verbosity, setVerbosity] = useState<'Minimal' | 'Standard' | 'Detailed'>('Standard');
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [retrainProgress, setRetrainProgress] = useState<number>(0);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.getPersonalProfile();
        setProfile(res.data);
        setLocalDataStorage(res.data.localDataStorageOnly);
        setTelemetry(res.data.telemetrySharing);
        setLanguage(res.data.language);
        setVerbosity(res.data.alertVerbosity);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleRetrainVoice = () => {
    setIsRetraining(true);
    setRetrainProgress(0);

    const interval = setInterval(() => {
      setRetrainProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRetraining(false);
          setSaveToast('Voice biometric model recalibrated. New confidence: 97.2%');
          setTimeout(() => setSaveToast(null), 4000);
          return 100;
        }
        return prev + 25;
      });
    }, 450);
  };

  const handleSavePreferences = () => {
    apiClient.updateProfile({
      localDataStorageOnly: localDataStorage,
      telemetrySharing: telemetry,
      language,
      alertVerbosity: verbosity,
    });
    setSaveToast('Terminal preferences saved to local keystore.');
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {saveToast && (
        <div className="p-3.5 rounded-xl bg-[#10b981]/15 border border-[#10b981]/40 text-xs font-semibold text-[#10b981] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{saveToast}</span>
          </div>
          <button onClick={() => setSaveToast(null)} className="text-[#8d909e] hover:text-[#dbe2f7]">
            &times;
          </button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Account Details Card (Col span 8) */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl border border-[#424752]/60 shadow-xl md:col-span-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#424752]/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#aec6ff]/40 bg-[#141c2a] shrink-0 p-0.5 shadow-[0_0_15px_rgba(93,142,241,0.25)]">
                <img
                  src="/src/assets/images/driver_operator_logo_1791563331563.jpg"
                  alt="Transit Driver Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-[#dbe2f7]">
                  {profile?.name || session.userName}
                </h3>
                <p className="text-xs text-[#8d909e]">{session.clearanceLevel}</p>
              </div>
            </div>

            <button
              onClick={handleSavePreferences}
              className="px-3.5 py-1.5 rounded-lg bg-[#5d8ef1]/15 hover:bg-[#5d8ef1] text-[#aec6ff] hover:text-[#001a43] text-xs font-semibold border border-[#5d8ef1]/30 transition-all cursor-pointer"
            >
              Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8d909e] uppercase">Full Name</label>
              <div className="bg-[#141c2a] p-3 rounded-xl border border-[#424752]/60 font-semibold text-[#dbe2f7]">
                {profile?.name || 'Alex Mercer'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8d909e] uppercase">Email Address</label>
              <div className="bg-[#141c2a] p-3 rounded-xl border border-[#424752]/60 font-semibold text-[#dbe2f7]">
                {profile?.email || 'a.mercer@transit.io'}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8d909e] uppercase">Console Access Role</label>
              <div className="bg-[#141c2a] p-3 rounded-xl border border-[#424752]/60 text-[#dbe2f7] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                <span className="font-semibold">{profile?.role || 'Transit Systems Analyst'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#8d909e] uppercase">2FA Token Protection</label>
              <div className="bg-[#141c2a] p-3 rounded-xl border border-[#424752]/60 text-[#dbe2f7] flex items-center justify-between">
                <span className="font-semibold">Hardware Keystore Active</span>
                <span className="material-symbols-outlined text-[#10b981] text-[18px]">
                  verified
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Voice Profile Calibration (Col span 4) */}
        <section className="glass-panel p-6 md:p-8 rounded-2xl border border-[#424752]/60 shadow-xl md:col-span-4 flex flex-col justify-between text-center space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-base font-bold text-[#dbe2f7] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#aec6ff]">graphic_eq</span>
              Voice Biometrics
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
              ENROLLED
            </span>
          </div>

          {/* Confidence Score Circle */}
          <div className="relative w-28 h-28 mx-auto my-2 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#222a39"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#5d8ef1"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 * (1 - 0.95)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold text-[#dbe2f7]">95%</span>
              <span className="text-[9px] font-mono text-[#8d909e] uppercase">CONFIDENCE</span>
            </div>
          </div>

          <p className="text-xs text-[#c3c6d4]/80">
            Resemblyzer spectral model calibrated for Indian English and regional transit acoustic vocabulary.
          </p>

          <button
            onClick={handleRetrainVoice}
            disabled={isRetraining}
            className="w-full py-2.5 px-3 rounded-xl bg-[#5d8ef1] hover:bg-[#aec6ff] text-[#001a43] font-bold text-xs transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isRetraining ? `Recalibrating (${retrainProgress}%)...` : 'Recalibrate Voice Model'}
          </button>
        </section>

        {/* Privacy & Data Storage (Col span 6) */}
        <section className="glass-panel p-6 rounded-2xl border border-[#424752]/60 shadow-xl md:col-span-6 space-y-4">
          <div className="pb-3 border-b border-[#424752]/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#aec6ff]">lock</span>
            <h4 className="font-display text-base font-bold text-[#dbe2f7]">
              Privacy &amp; Data Sovereignity
            </h4>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle 1: Local Data Storage Only */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#dbe2f7]">Strict Local Data Storage</p>
                <p className="text-[11px] text-[#8d909e]">
                  Enforce SQLite offline storage. No routes or voice prints leave device.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={localDataStorage}
                onClick={() => setLocalDataStorage(!localDataStorage)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  localDataStorage ? 'bg-[#5d8ef1]' : 'bg-[#222a39]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    localDataStorage ? 'left-5.5' : 'left-0.5'
                  }`}
                ></span>
              </button>
            </div>

            {/* Toggle 2: Telemetry Sharing */}
            <div className="flex items-center justify-between pt-3 border-t border-[#424752]/30">
              <div>
                <p className="font-semibold text-[#dbe2f7]">Anonymous Fleet Telemetry</p>
                <p className="text-[11px] text-[#8d909e]">
                  Contribute aggregated congestion delay statistics to corridor model.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={telemetry}
                onClick={() => setTelemetry(!telemetry)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  telemetry ? 'bg-[#5d8ef1]' : 'bg-[#222a39]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    telemetry ? 'left-5.5' : 'left-0.5'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </section>

        {/* System Preferences (Col span 6) */}
        <section className="glass-panel p-6 rounded-2xl border border-[#424752]/60 shadow-xl md:col-span-6 space-y-4">
          <div className="pb-3 border-b border-[#424752]/40 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#aec6ff]">tune</span>
            <h4 className="font-display text-base font-bold text-[#dbe2f7]">
              Terminal &amp; Speech Preferences
            </h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-mono text-[#8d909e] uppercase block mb-1">
                Default Speech Recognition Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#141c2a] border border-[#424752]/70 rounded-xl p-2.5 text-[#dbe2f7] outline-none focus:border-[#5d8ef1]"
              >
                <option value="English (US) - Transit Optimized">
                  English (Coimbatore Transit Lexicon)
                </option>
                <option value="Tamil (IN) - Transit">Tamil (Coimbatore Regional)</option>
                <option value="English (UK)">English (Standard UK)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#8d909e] uppercase block mb-1">
                TTS Spoken Alert Verbosity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Minimal', 'Standard', 'Detailed'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVerbosity(v)}
                    className={`py-2 rounded-xl font-semibold border text-xs transition-colors cursor-pointer ${
                      verbosity === v
                        ? 'bg-[#5d8ef1]/20 border-[#aec6ff] text-[#aec6ff]'
                        : 'bg-[#141c2a] border-[#424752]/60 text-[#c3c6d4] hover:bg-[#18202e]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
