import React, { useState, useEffect } from 'react';
import { voiceService, VerificationResult } from '../../services/voiceService';
import { apiClient } from '../../services/apiService';
import { ScreenId, UserSession } from '../../types';
import { AudioWaveformVisualizer } from '../voice/AudioWaveformVisualizer';

interface HomeScreenProps {
  session: UserSession;
  onNavigate: (screen: ScreenId) => void;
  onAuthenticateSession: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  session,
  onNavigate,
  onAuthenticateSession,
}) => {
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [audioLevels, setAudioLevels] = useState<number[]>([
    0.2, 0.35, 0.5, 0.7, 0.85, 0.6, 0.45, 0.3, 0.25, 0.4, 0.65, 0.8, 0.55, 0.35, 0.2, 0.15
  ]);
  const [transcript, setTranscript] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [dbLevel, setDbLevel] = useState<number>(-42);

  useEffect(() => {
    return () => {
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  const handleStartVoice = async (overridePrompt?: string) => {
    setFeedbackError(null);
    setTranscript(overridePrompt || '');
    setResponse('');
    setConfidenceScore(null);
    setVoiceState('listening');
    setDbLevel(-18);

    const started = await voiceService.startListening((levels) => {
      // Expand 8 levels to 16-band spectrum
      const expanded = [...levels, ...levels.map((l) => Math.max(0.1, l * 0.85))];
      setAudioLevels(expanded);
      setDbLevel(Math.round(-40 + Math.max(...levels) * 35));
    });

    if (!started) {
      setFeedbackError('Microphone hardware stream was blocked. Fallback acoustic model active.');
    }

    setTimeout(async () => {
      voiceService.stopListening();
      setVoiceState('processing');
      setDbLevel(-55);

      try {
        const result: VerificationResult = await voiceService.verifyAndProcessVoiceQuery(overridePrompt);
        setTranscript(result.transcript);
        setResponse(result.responseMessage);
        setConfidenceScore(Math.round(result.confidence * 100));

        apiClient.addActivityLog({
          type: 'voice',
          title: 'Voice Command',
          details: result.transcript,
          securityLevel: 'verified',
          status: 'completed',
        });

        onAuthenticateSession();

        setVoiceState('speaking');
        voiceService.speak(result.responseMessage, () => {
          setVoiceState('idle');
        });
      } catch (err) {
        console.error(err);
        setFeedbackError('Voice command verification encountered an error. Please retry.');
        setVoiceState('idle');
      }
    }, 2800);
  };

  const handleStopVoice = () => {
    voiceService.stopListening();
    voiceService.stopSpeaking();
    setVoiceState('idle');
    setDbLevel(-55);
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn max-w-7xl mx-auto">
      {/* 1. Hero Voice Interaction Studio */}
      <section className="glass-panel p-6 sm:p-10 md:p-12 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden border border-[#334155]/70 shadow-2xl">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] bg-[#3b82f6]/12 rounded-full blur-3xl pointer-events-none"></div>

        {/* Ambient Grid Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none"></div>

        {/* Driver Clearance Badge at Top of Studio */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0d1524]/90 border border-[#334155]/80 text-xs font-mono mb-6 shadow-sm">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-[#16243d] shrink-0 border border-[#60a5fa]/40">
            <img
              src="/src/assets/images/driver_operator_logo_1791563331563.jpg"
              alt="Driver Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <span className="text-[#94a3b8]">OPERATOR:</span>
          <span className="font-bold text-[#f8fafc]">{session.userName}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
          <span className="text-[#10b981] font-semibold">{session.clearanceLevel}</span>
        </div>

        {/* Primary Interactive Microphone Orb */}
        <div className="relative mb-6">
          {voiceState === 'listening' && (
            <>
              <div className="absolute -inset-4 rounded-full bg-[#38bdf8]/25 animate-ping"></div>
              <div className="absolute -inset-8 rounded-full border border-[#38bdf8]/35 animate-pulse"></div>
            </>
          )}

          <button
            onClick={() => (voiceState === 'idle' ? handleStartVoice() : handleStopVoice())}
            aria-label={voiceState === 'idle' ? 'Start voice authentication' : 'Stop voice listening'}
            className={`w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 cursor-pointer shadow-2xl active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-[#2563eb] to-[#38bdf8] text-[#080e18] shadow-[0_0_45px_rgba(56,189,248,0.7)] scale-105'
                : voiceState === 'processing'
                ? 'bg-[#0d1524] border-2 border-[#f59e0b] text-[#f59e0b] animate-spin shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-[#10b981] to-[#38bdf8] text-[#080e18] shadow-[0_0_40px_rgba(16,185,129,0.6)]'
                : 'bg-[#0d1524] hover:bg-[#132038] border-2 border-[#60a5fa]/40 hover:border-[#38bdf8] text-[#60a5fa] shadow-[0_0_28px_rgba(59,130,246,0.25)]'
            }`}
          >
            <span className="material-symbols-outlined text-[48px] md:text-[54px]">
              {voiceState === 'processing'
                ? 'sync'
                : voiceState === 'speaking'
                ? 'volume_up'
                : 'mic'}
            </span>
          </button>
        </div>

        {/* Status Headings */}
        <div className="max-w-xl mx-auto space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d1524] border border-[#334155]/70 text-[11px] font-mono mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                voiceState === 'listening'
                  ? 'bg-[#38bdf8] animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-[#f59e0b]'
                  : voiceState === 'speaking'
                  ? 'bg-[#10b981]'
                  : 'bg-[#64748b]'
              }`}
            ></span>
            <span className="text-[#94a3b8] uppercase font-bold tracking-wider">
              {voiceState === 'listening'
                ? 'Acoustic Stream Active'
                : voiceState === 'processing'
                ? 'Neural Pipeline Decoding'
                : voiceState === 'speaking'
                ? 'Audio Response Playing'
                : 'Offline Voice Engine Ready'}
            </span>
          </div>

          <h2 className="font-display text-2xl md:text-3xl font-bold text-[#f8fafc] tracking-tight">
            {voiceState === 'listening'
              ? 'Listening to Audio Stream...'
              : voiceState === 'processing'
              ? 'Computing Resemblyzer d-vector...'
              : voiceState === 'speaking'
              ? 'Transmitting Spoken Guidance...'
              : 'Voice Command & Security Center'}
          </h2>
          <p className="text-xs md:text-sm text-[#94a3b8]">
            {voiceState === 'listening'
              ? 'Speak naturally: ask for routes, schedules, or driver clearance'
              : voiceState === 'processing'
              ? 'Whisper.cpp acoustic decode and liveness verification in progress'
              : voiceState === 'speaking'
              ? 'Synthesized via Piper TTS offline voice model'
              : 'Click the microphone or choose a suggested query below'}
          </p>
        </div>

        {/* Real-time Web Audio API Waveform & Spectral Visualizer */}
        <AudioWaveformVisualizer
          voiceState={voiceState}
          height={148}
          className="w-full max-w-2xl mb-6"
        />

        {/* Live Transcript & Spoken Response Card */}
        {(transcript || response) && (
          <div className="w-full max-w-2xl bg-[#0d1524] border border-[#60a5fa]/40 rounded-xl p-5 text-left mb-6 space-y-3.5 shadow-xl animate-fadeIn">
            {transcript && (
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-[#38bdf8] text-[20px] shrink-0 mt-0.5">
                  record_voice_over
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-mono text-[#64748b] uppercase font-bold">
                      Driver Command
                    </p>
                    {confidenceScore && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                        {confidenceScore}% Biometric Match
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#f8fafc] mt-0.5">
                    "{transcript}"
                  </p>
                </div>
              </div>
            )}

            {response && (
              <div className="pt-3 border-t border-[#334155]/60 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#10b981] text-[20px] shrink-0 mt-0.5">
                  smart_toy
                </span>
                <div className="flex-1">
                  <p className="text-[11px] font-mono text-[#64748b] uppercase font-bold">
                    TransitVoice Response (Piper TTS)
                  </p>
                  <p className="text-sm font-medium text-[#60a5fa] mt-0.5 leading-relaxed">
                    {response}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {feedbackError && (
          <div className="p-3 bg-[#ef4444]/15 border border-[#ef4444]/40 rounded-xl text-xs text-[#ef4444] mb-4">
            {feedbackError}
          </div>
        )}

        {/* Quick Query Trigger Chips */}
        <div className="w-full max-w-2xl">
          <p className="text-[11px] font-mono text-[#64748b] uppercase tracking-wider mb-2.5">
            Suggested Transit Queries
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Find fastest route to Central Station avoiding heavy traffic zones.',
              'When is the next 11A bus to Airport Terminal?',
              'Show my saved morning commute routes.',
              'What is the system status on Avinashi Road corridor?',
            ].map((phrase, idx) => (
              <button
                key={idx}
                onClick={() => handleStartVoice(phrase)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0d1524] hover:bg-[#132038] text-[#cbd5e1] hover:text-[#f8fafc] border border-[#334155]/70 hover:border-[#38bdf8]/60 text-xs transition-all text-left cursor-pointer active:scale-95"
              >
                "{phrase.slice(0, 42)}..."
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Grid: Transit Status & Security Modules */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Recent Inquiries List */}
        <div className="md:col-span-8 glass-panel p-6 rounded-2xl border border-[#334155]/60 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#334155]/40">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#38bdf8]">history</span>
              <h3 className="font-display text-base font-bold text-[#f8fafc]">
                Recent Inquiries &amp; Dispatches
              </h3>
            </div>
            <button
              onClick={() => onNavigate('activity')}
              className="text-xs font-semibold text-[#60a5fa] hover:underline cursor-pointer"
            >
              Full Audit Log &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              {
                query: 'Route to Tech Park via Avinashi Road',
                time: 'Today, 08:45 AM',
                tag: 'Route 12',
                status: 'Completed',
              },
              {
                query: 'When is the next 11A bus to Airport Terminal?',
                time: 'Yesterday, 18:30 PM',
                tag: 'Line 11A',
                status: 'Departed',
              },
              {
                query: 'Check biometric driver token expiration',
                time: 'Yesterday, 07:15 AM',
                tag: 'Security',
                status: 'Verified',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0d1524] hover:bg-[#132038] border border-[#334155]/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#16243d] flex items-center justify-center shrink-0 text-[#38bdf8]">
                    <span className="material-symbols-outlined text-[18px]">directions_bus</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#f8fafc] truncate">
                      "{item.query}"
                    </p>
                    <p className="text-[10px] text-[#64748b]">{item.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16243d] text-[#cbd5e1] border border-[#334155]/60">
                    {item.tag}
                  </span>
                  <span className="text-[10px] font-bold text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded-full">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Region & Security Cards */}
        <div className="md:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-[#334155]/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#64748b] uppercase">Current Region</span>
              <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
            </div>
            <h4 className="font-display text-xl font-bold text-[#f8fafc]">Coimbatore Grid</h4>
            <p className="text-xs text-[#94a3b8]">
              24 active routes · 142 live tracked fleet vehicles with dedicated bus priority.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[#0d1524] border border-[#334155]/50">
                <p className="text-[10px] text-[#64748b]">Active Lines</p>
                <p className="font-mono text-sm font-bold text-[#38bdf8]">24</p>
              </div>
              <div className="p-2 rounded-xl bg-[#0d1524] border border-[#334155]/50">
                <p className="text-[10px] text-[#64748b]">On-Time</p>
                <p className="font-mono text-sm font-bold text-[#10b981]">99.4%</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('navigation')}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-[#3b82f6]/15 hover:bg-[#3b82f6] text-[#60a5fa] hover:text-[#080e18] text-xs font-bold border border-[#3b82f6]/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              <span>Open Live Navigation Map</span>
            </button>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-[#334155]/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#64748b] uppercase">Biometric Security</span>
              <span
                className={`material-symbols-outlined text-[18px] ${
                  session.authenticated ? 'text-[#10b981]' : 'text-[#f59e0b]'
                }`}
              >
                {session.authenticated ? 'verified_user' : 'lock'}
              </span>
            </div>
            <p className="text-xs font-bold text-[#f8fafc]">
              {session.authenticated ? 'Driver Biometrics Verified' : 'Authentication Required'}
            </p>
            <p className="text-[11px] text-[#94a3b8]">
              {session.authenticated
                ? 'Resemblyzer d-vector active. Personal telemetry & encrypted routes unlocked.'
                : 'Execute verification challenge to unlock private routes.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
