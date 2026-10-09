import React, { useEffect, useRef, useState } from 'react';
import { voiceService } from '../../services/voiceService';

export type VisualizerMode = 'waveform' | 'spectrum' | 'hybrid';

interface AudioWaveformVisualizerProps {
  voiceState: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
  height?: number;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  voiceState,
  className = '',
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('hybrid');
  const [metrics, setMetrics] = useState<{
    peakDb: number;
    rms: number;
    sampleRate: number;
    hasHardwareMic: boolean;
  }>({
    peakDb: -48,
    rms: 0.08,
    sampleRate: 48000,
    hasHardwareMic: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const fftSize = 512;
    const timeData = new Uint8Array(fftSize);
    const freqData = new Uint8Array(fftSize / 2);

    // Peak holding for spectrum bars
    const peakHold = new Float32Array(64).fill(0);

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let lastMetricsUpdate = 0;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!canvas || !containerRef.current) return;
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const h = canvas.height / dpr;

      // Fetch time and frequency domain buffers
      voiceService.getTimeDomainData(timeData);
      voiceService.getFrequencyData(freqData);

      // Compute RMS and peak dB
      let sumSquares = 0;
      let maxDev = 0;
      for (let i = 0; i < timeData.length; i++) {
        const norm = (timeData[i] - 128) / 128; // -1 to 1
        sumSquares += norm * norm;
        const absDev = Math.abs(norm);
        if (absDev > maxDev) maxDev = absDev;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const peakDb = maxDev > 0.001 ? Math.max(-60, Math.round(20 * Math.log10(maxDev))) : -60;

      // Throttle React state updates to ~10fps to avoid rendering overhead
      if (time - lastMetricsUpdate > 100) {
        lastMetricsUpdate = time;
        const audioCtx = voiceService.getAudioContext();
        setMetrics({
          peakDb,
          rms: Math.round(rms * 100) / 100,
          sampleRate: audioCtx ? audioCtx.sampleRate : 48000,
          hasHardwareMic: !!audioCtx,
        });
      }

      // Clear canvas with subtle gradient dark fill
      ctx.clearRect(0, 0, width, h);

      // Subtle horizontal center guide
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Palette determination based on voice state
      let colorPrimary = '#38bdf8'; // electric cyan
      let colorSecondary = '#60a5fa'; // neon blue
      let colorAccent = '#34d399'; // emerald
      if (voiceState === 'processing') {
        colorPrimary = '#f59e0b';
        colorSecondary = '#fbbf24';
        colorAccent = '#f97316';
      } else if (voiceState === 'speaking') {
        colorPrimary = '#10b981';
        colorSecondary = '#34d399';
        colorAccent = '#38bdf8';
      } else if (voiceState === 'idle') {
        colorPrimary = '#3b82f6';
        colorSecondary = '#60a5fa';
        colorAccent = '#94a3b8';
      }

      // 1. RENDER SPECTRUM BARS (if mode is 'spectrum' or 'hybrid')
      if (mode === 'spectrum' || mode === 'hybrid') {
        const barCount = 48;
        const gap = 3;
        const barWidth = (width - gap * (barCount - 1)) / barCount;
        const step = Math.floor(freqData.length / barCount);

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += freqData[i * step + j] || 0;
          }
          const avg = sum / step;
          const normalized = avg / 255;
          const barHeight = Math.max(3, normalized * (h * 0.78));

          // Update peak decay
          if (barHeight > peakHold[i]) {
            peakHold[i] = barHeight;
          } else {
            peakHold[i] = Math.max(3, peakHold[i] - 1.2);
          }

          const x = i * (barWidth + gap);
          const y = h / 2 - barHeight / 2;

          // Gradient for bar
          const barGrad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (mode === 'hybrid') {
            barGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
            barGrad.addColorStop(0.5, 'rgba(96, 165, 250, 0.35)');
            barGrad.addColorStop(1, 'rgba(56, 189, 248, 0.22)');
          } else {
            barGrad.addColorStop(0, colorAccent);
            barGrad.addColorStop(0.5, colorPrimary);
            barGrad.addColorStop(1, colorSecondary);
          }

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();

          // Peak dot
          if (mode === 'spectrum') {
            ctx.fillStyle = colorAccent;
            ctx.fillRect(x, h / 2 - peakHold[i] / 2 - 2, barWidth, 2);
          }
        }
      }

      // 2. RENDER TIME-DOMAIN OSCILLOSCOPE WAVEFORM (if mode is 'waveform' or 'hybrid')
      if (mode === 'waveform' || mode === 'hybrid') {
        ctx.beginPath();
        const sliceWidth = width / (timeData.length - 1);

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0; // 0.0 to 2.0 (1.0 = center)
          const y = (v * (h / 2));
          const x = i * sliceWidth;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Cubic bezier smoothing between points
            const prevX = (i - 1) * sliceWidth;
            const prevV = timeData[i - 1] / 128.0;
            const prevY = prevV * (h / 2);
            const cpX = (prevX + x) / 2;
            ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
          }
        }

        // Waveform neon glow stroke
        ctx.strokeStyle = colorPrimary;
        ctx.lineWidth = mode === 'hybrid' ? 2.5 : 3;
        ctx.shadowColor = colorPrimary;
        ctx.shadowBlur = voiceState === 'listening' ? 14 : 6;
        ctx.stroke();

        // Reset shadow for next operations
        ctx.shadowBlur = 0;

        // Waveform fill under the curve (soft gradient)
        ctx.lineTo(width, h / 2);
        ctx.lineTo(0, h / 2);
        ctx.closePath();

        const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
        fillGrad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
        fillGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.03)');
        fillGrad.addColorStop(1, 'rgba(56, 189, 248, 0.12)');
        ctx.fillStyle = fillGrad;
        ctx.fill();
      }

      // Ambient scan-line sweep when listening
      if (voiceState === 'listening') {
        const sweepX = ((time * 0.25) % (width + 60)) - 30;
        const sweepGrad = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 20, 0);
        sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
        sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = sweepGrad;
        ctx.fillRect(sweepX - 20, 0, 40, h);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mode, voiceState, height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden bg-[#070e19] border border-[#334155]/80 shadow-2xl ${className}`}
    >
      {/* Top Header Controls & Live Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-[#334155]/60 bg-[#0d1524]/90 text-[11px] font-mono select-none">
        {/* Left: Input Status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              voiceState === 'listening'
                ? 'bg-[#38bdf8] animate-ping'
                : voiceState === 'processing'
                ? 'bg-[#f59e0b] animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-[#10b981]'
                : 'bg-[#64748b]'
            }`}
          />
          <span className="font-bold text-[#f8fafc] uppercase tracking-wider">
            Web Audio Visualizer
          </span>
          <span className="text-[#64748b]">|</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              metrics.hasHardwareMic
                ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                : 'bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30'
            }`}
          >
            {metrics.hasHardwareMic ? 'HARDWARE MIC' : 'SYNTH ACOUSTIC'}
          </span>
        </div>

        {/* Center: Live Acoustic Telemetry */}
        <div className="hidden sm:flex items-center gap-3 text-[#94a3b8] text-[10px]">
          <div>
            PEAK: <span className="font-bold text-[#f8fafc]">{metrics.peakDb} dB</span>
          </div>
          <div>
            RMS: <span className="font-bold text-[#38bdf8]">{metrics.rms}</span>
          </div>
          <div>
            SAMPLE: <span className="font-bold text-[#f8fafc]">{(metrics.sampleRate / 1000).toFixed(1)} kHz</span>
          </div>
        </div>

        {/* Right: Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#121c2e] p-0.5 rounded-lg border border-[#334155]/80">
          {(
            [
              { id: 'hybrid', label: 'Hybrid', icon: 'auto_graph' },
              { id: 'waveform', label: 'Wave', icon: 'graphic_eq' },
              { id: 'spectrum', label: 'Spectrum', icon: 'equalizer' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-all cursor-pointer font-medium ${
                mode === m.id
                  ? 'bg-[#38bdf8] text-[#080e18] font-bold shadow-sm'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
              title={`Switch visualizer to ${m.label} mode`}
            >
              <span className="material-symbols-outlined text-[13px]">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Canvas Element */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: `${height}px` }}
        />

        {/* Subtle grid background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_0.8px,transparent_0.8px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />

        {/* Corner Decibel Scale Overlay */}
        <div className="absolute top-2 left-3 pointer-events-none text-[9px] font-mono text-[#64748b]">
          0 dB
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 left-3 pointer-events-none text-[9px] font-mono text-[#64748b]">
          -18 dB
        </div>
        <div className="absolute bottom-2 left-3 pointer-events-none text-[9px] font-mono text-[#64748b]">
          -60 dB
        </div>
      </div>

      {/* Bottom Sub-status Bar */}
      <div className="px-4 py-1.5 border-t border-[#334155]/50 bg-[#0d1524]/80 flex items-center justify-between text-[10px] font-mono text-[#64748b]">
        <span>FFT: 512 BINS · ZERO-LATENCY DIRECT PIPELINE</span>
        <span className="text-[#38bdf8]">
          {voiceState === 'listening'
            ? 'STREAMING ACTIVE MICROPHONE SIGNAL...'
            : voiceState === 'processing'
            ? 'DECODING ACOUSTIC FRAMES...'
            : voiceState === 'speaking'
            ? 'PIPER TTS SPEECH AUDIO OUTPUT'
            : 'READY FOR VOICE INPUT'}
        </span>
      </div>
    </div>
  );
};
