import React, { useState, useEffect, useMemo, useRef } from 'react';
import { COIMBATORE_ROUTES } from '../../services/apiService';
import { voiceService } from '../../services/voiceService';
import { TransitRoute, TransitStop } from '../../types';

interface NavigationScreenProps {
  initialRouteId?: string;
}

// Geometric waypoint definitions for each route in the 1200 x 800 realistic map coordinate space
interface RouteGeometry {
  pathD: string;
  points: Array<{ x: number; y: number }>;
  stops: Array<{ id: string; name: string; x: number; y: number; time: string; type: 'origin' | 'stop' | 'terminus' }>;
}

const ROUTE_MAP_GEOMETRIES: Record<string, RouteGeometry> = {
  // Line 12: Central Station -> Gandhipuram -> Nava India -> Peelamedu -> TIDEL Park
  '12': {
    pathD: 'M 340 520 L 430 390 L 550 345 L 680 310 L 840 235',
    points: [
      { x: 340, y: 520 },
      { x: 430, y: 390 },
      { x: 550, y: 345 },
      { x: 680, y: 310 },
      { x: 840, y: 235 },
    ],
    stops: [
      { id: 's1', name: 'Coimbatore Junction', x: 340, y: 520, time: '08:45 AM', type: 'origin' },
      { id: 's2', name: 'Gandhipuram Central', x: 430, y: 390, time: '08:54 AM', type: 'stop' },
      { id: 's3', name: 'Nava India', x: 550, y: 345, time: '09:01 AM', type: 'stop' },
      { id: 's4', name: 'Peelamedu Tech Junction', x: 680, y: 310, time: '09:07 AM', type: 'stop' },
      { id: 's5', name: 'TIDEL Park North', x: 840, y: 235, time: '09:12 AM', type: 'terminus' },
    ],
  },
  // Line 11A: Ukkadam -> Town Hall -> Gandhipuram -> Hopes College -> Airport
  '11A': {
    pathD: 'M 260 620 L 320 540 L 430 390 L 550 345 L 750 275 L 950 210',
    points: [
      { x: 260, y: 620 },
      { x: 320, y: 540 },
      { x: 430, y: 390 },
      { x: 550, y: 345 },
      { x: 750, y: 275 },
      { x: 950, y: 210 },
    ],
    stops: [
      { id: 'u1', name: 'Ukkadam Hub', x: 260, y: 620, time: '08:50 AM', type: 'origin' },
      { id: 'u2', name: 'Town Hall', x: 320, y: 540, time: '08:56 AM', type: 'stop' },
      { id: 'u3', name: 'Gandhipuram Central', x: 430, y: 390, time: '09:05 AM', type: 'stop' },
      { id: 'u4', name: 'Hopes College', x: 750, y: 275, time: '09:16 AM', type: 'stop' },
      { id: 'u5', name: 'Coimbatore Airport Terminal', x: 950, y: 210, time: '09:24 AM', type: 'terminus' },
    ],
  },
  // Line 4: Town Hall -> Gandhipuram -> Ganapathy -> Saravanampatti Tech Zone (Sathy Rd Corridor)
  '4': {
    pathD: 'M 320 540 L 430 390 L 430 260 L 430 110',
    points: [
      { x: 320, y: 540 },
      { x: 430, y: 390 },
      { x: 430, y: 260 },
      { x: 430, y: 110 },
    ],
    stops: [
      { id: 't1', name: 'Town Hall Hub', x: 320, y: 540, time: '09:05 AM', type: 'origin' },
      { id: 't2', name: 'Gandhipuram Central', x: 430, y: 390, time: '09:14 AM', type: 'stop' },
      { id: 't3', name: 'Ganapathy Station', x: 430, y: 260, time: '09:26 AM', type: 'stop' },
      { id: 't4', name: 'Saravanampatti Tech Zone', x: 430, y: 110, time: '09:43 AM', type: 'terminus' },
    ],
  },
  // Line T1: Commuter Rail - Junction -> North Station -> Peelamedu Halt
  'T1': {
    pathD: 'M 340 520 L 370 370 L 690 270',
    points: [
      { x: 340, y: 520 },
      { x: 370, y: 370 },
      { x: 690, y: 270 },
    ],
    stops: [
      { id: 'tr1', name: 'Coimbatore Main Junction', x: 340, y: 520, time: '08:52 AM', type: 'origin' },
      { id: 'tr2', name: 'Coimbatore North Station', x: 370, y: 370, time: '09:01 AM', type: 'stop' },
      { id: 'tr3', name: 'Peelamedu Railway Halt', x: 690, y: 270, time: '09:13 AM', type: 'terminus' },
    ],
  },
};

export const NavigationScreen: React.FC<NavigationScreenProps> = ({
  initialRouteId = '12',
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(initialRouteId);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute>(
    COIMBATORE_ROUTES.find((r) => r.id === initialRouteId) || COIMBATORE_ROUTES[0]
  );

  // Active geometry for the selected route
  const currentGeometry = useMemo(() => {
    return ROUTE_MAP_GEOMETRIES[selectedRouteId] || ROUTE_MAP_GEOMETRIES['12'];
  }, [selectedRouteId]);

  // Navigation & Cruise Simulation State
  const [isGuidanceActive, setIsGuidanceActive] = useState<boolean>(true);
  const [currentSpeed, setCurrentSpeed] = useState<number>(42);
  const [vehicleProgress, setVehicleProgress] = useState<number>(0.35); // 0.0 to 1.0 along route
  const [simMultiplier, setSimMultiplier] = useState<number>(1);
  const [voiceGuidanceMuted, setVoiceGuidanceMuted] = useState<boolean>(false);
  const [selectedStopDetail, setSelectedStopDetail] = useState<TransitStop | null>(null);
  const [showSafetyRadar, setShowSafetyRadar] = useState<boolean>(false);
  const [showStepsDrawer, setShowStepsDrawer] = useState<boolean>(false);
  const [is3DTilt, setIs3DTilt] = useState<boolean>(true);
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  // Pan & Zoom states for interactive real vector map
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update route metadata
  useEffect(() => {
    const route = COIMBATORE_ROUTES.find((r) => r.id === selectedRouteId) || COIMBATORE_ROUTES[0];
    setSelectedRoute(route);
    setVehicleProgress(0.2); // Reset vehicle smoothly to start of selected route
  }, [selectedRouteId]);

  // Cruise simulation loop
  useEffect(() => {
    if (!isGuidanceActive) return;

    const intervalTime = Math.max(200, 1400 / simMultiplier);
    const interval = setInterval(() => {
      setVehicleProgress((prev) => {
        const increment = 0.012 * simMultiplier;
        return prev >= 0.98 ? 0.02 : prev + increment;
      });

      setCurrentSpeed(Math.floor(38 + Math.random() * 10));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isGuidanceActive, simMultiplier]);

  // Compute interpolated vehicle position and angle along the active route points
  const vehicleState = useMemo(() => {
    const pts = currentGeometry.points;
    if (!pts || pts.length < 2) return { x: 430, y: 390, angle: 0 };

    const totalSegments = pts.length - 1;
    const progress = Math.max(0, Math.min(0.999, vehicleProgress));
    const segmentIndex = Math.floor(progress * totalSegments);
    const segmentT = (progress * totalSegments) - segmentIndex;

    const pA = pts[segmentIndex];
    const pB = pts[Math.min(pts.length - 1, segmentIndex + 1)];

    const x = pA.x + (pB.x - pA.x) * segmentT;
    const y = pA.y + (pB.y - pA.y) * segmentT;

    const dx = pB.x - pA.x;
    const dy = pB.y - pA.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return { x, y, angle };
  }, [currentGeometry, vehicleProgress]);

  // Turn-by-turn guidance instruction based on vehicle progress
  const currentTurnInstruction = useMemo(() => {
    const stops = currentGeometry.stops;
    if (vehicleProgress < 0.28) {
      return {
        instruction: `In 350m, Depart from ${stops[0]?.name}`,
        sub: `Heading towards ${stops[1]?.name || 'Next Station'}`,
        icon: 'turn_slight_right',
        laneActive: 2,
      };
    } else if (vehicleProgress < 0.65) {
      return {
        instruction: `Continue Along Main Corridor to ${stops[2]?.name || stops[1]?.name}`,
        sub: 'Optimal speed · Dedicated Transit Priority active',
        icon: 'straight',
        laneActive: 1,
      };
    } else if (vehicleProgress < 0.88) {
      return {
        instruction: `Prepare to Stop: ${stops[stops.length - 2]?.name || 'Approaching Stop'}`,
        sub: 'Platform Bay 1 deceleration zone',
        icon: 'place',
        laneActive: 0,
      };
    } else {
      return {
        instruction: `Arrive at Terminus: ${stops[stops.length - 1]?.name}`,
        sub: 'Final destination on-time arrival',
        icon: 'flag',
        laneActive: 1,
      };
    }
  }, [currentGeometry, vehicleProgress]);

  // Voice guidance helper
  const triggerVoicePrompt = (text: string) => {
    if (voiceGuidanceMuted) return;
    voiceService.speak(text);
  };

  // Pan and Zoom Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(2.4, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.65, prev - 0.2));
  };

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomScale(1.0);
  };

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-[#424752]/70 shadow-2xl flex flex-col bg-[#070e19] select-none">
      {/* 1. TOP HEADER: CORRIDOR CONTEXT & TELEMETRY */}
      <div className="z-20 bg-[#0e1829]/95 backdrop-blur-md px-4 py-2.5 border-b border-[#424752]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Corridor Identity & Driver Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg overflow-hidden border border-[#60a5fa]/50 bg-[#141c2a] shrink-0 p-0.5 shadow-sm">
            <img
              src="/src/assets/images/driver_operator_logo_1791563331563.jpg"
              alt="Driver Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
            <span className="font-bold text-[#f8fafc] tracking-tight">
              Coimbatore GIS Grid // Line {selectedRoute.code}: {selectedRoute.name.split('(')[0]}
            </span>
          </div>

          <span className="text-[#8d909e] hidden md:inline">|</span>

          <span className="text-[#38bdf8] font-mono text-[11px] hidden sm:inline">
            {selectedRoute.stops[0]?.name} &rarr; {selectedRoute.stops[selectedRoute.stops.length - 1]?.name}
          </span>
        </div>

        {/* Right: Telemetry Chips */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-lg border border-[#10b981]/30">
            <span className="material-symbols-outlined text-[14px]">battery_charging_full</span>
            78% EV SoC
          </span>

          <span className="hidden lg:flex items-center gap-1 text-[#aec6ff] bg-[#141c2a] px-2.5 py-1 rounded-lg border border-[#424752]/50">
            <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
            L5 Dual-Band GPS
          </span>

          <button
            onClick={() => setIs3DTilt(!is3DTilt)}
            className={`px-2 py-0.5 rounded border text-[10px] font-mono cursor-pointer ${
              is3DTilt ? 'bg-[#5d8ef1]/20 border-[#aec6ff] text-[#aec6ff]' : 'bg-[#141c2a] border-[#424752] text-[#8d909e]'
            }`}
          >
            {is3DTilt ? '3D PITCH' : '2D OVERVIEW'}
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP VIEWPORT CANVAS (DEDICATED REALISTIC DEMO MAP) */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden bg-[#070e19] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Interactive Map Transform Layer */}
        <div
          className="absolute inset-0 w-full h-full transition-transform duration-200"
          style={{
            transform: is3DTilt
              ? `perspective(1000px) rotateX(24deg) translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`
              : `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
            transformOrigin: '50% 60%',
          }}
        >
          <svg
            className="w-full h-full min-w-[1200px] min-h-[800px]"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Urban Grid Patterns */}
              <pattern id="urbanGridMin" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(35, 52, 78, 0.28)" strokeWidth="0.5" />
              </pattern>
              <pattern id="urbanGridMaj" width="120" height="120" patternUnits="userSpaceOnUse">
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(50, 75, 110, 0.45)" strokeWidth="0.8" />
              </pattern>

              {/* Glow filter */}
              <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Headlight beam */}
              <filter id="headlightBeam" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Noyyal River gradient */}
              <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#08182b" />
                <stop offset="50%" stopColor="#0d2b4d" />
                <stop offset="100%" stopColor="#0a2039" />
              </linearGradient>

              {/* Park green gradient */}
              <linearGradient id="parkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(20, 55, 35, 0.7)" />
                <stop offset="100%" stopColor="rgba(14, 40, 25, 0.85)" />
              </linearGradient>

              {/* Railway track pattern */}
              <pattern id="railTie" width="12" height="12" patternUnits="userSpaceOnUse">
                <line x1="0" y1="6" x2="12" y2="6" stroke="#424752" strokeWidth="2" />
              </pattern>
            </defs>

            {/* Base Terrain Fill */}
            <rect width="100%" height="100%" fill="#070e19" />
            <rect width="100%" height="100%" fill="url(#urbanGridMin)" />
            <rect width="100%" height="100%" fill="url(#urbanGridMaj)" />

            {/* Noyyal River Water Basin */}
            <path
              d="M -50 680 C 150 670, 300 690, 480 660 C 650 630, 800 660, 950 630 C 1100 600, 1250 620, 1300 610 L 1300 750 L -50 750 Z"
              fill="url(#riverGrad)"
              stroke="#1e4e7d"
              strokeWidth="1.5"
            />
            <text x="680" y="665" fill="#4a90e2" opacity="0.6" fontSize="11" fontFamily="Inter, sans-serif" letterSpacing="3">
              NOYYAL RIVER BASIN
            </text>

            {/* Singanallur Wetland Lake */}
            <ellipse cx="980" cy="540" rx="90" ry="45" fill="url(#riverGrad)" stroke="#1e4e7d" strokeWidth="1.2" />
            <text x="980" y="545" textAnchor="middle" fill="#4a90e2" opacity="0.5" fontSize="10" fontFamily="Inter, sans-serif" letterSpacing="2">
              SINGANALLUR LAKE
            </text>

            {/* Parks and Protected Green Spaces */}
            <rect x="220" y="240" width="110" height="90" rx="8" fill="url(#parkGrad)" stroke="rgba(35, 95, 55, 0.6)" strokeWidth="1" />
            <text x="275" y="290" textAnchor="middle" fill="#52c41a" opacity="0.75" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600">
              VOC PARK &amp; STADIUM
            </text>

            <rect x="740" y="140" width="120" height="80" rx="8" fill="url(#parkGrad)" stroke="rgba(35, 95, 55, 0.6)" strokeWidth="1" />
            <text x="800" y="185" textAnchor="middle" fill="#52c41a" opacity="0.7" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600">
              PEELAMEDU TECH PARK
            </text>

            {/* 3D Extruded Building Parcels */}
            {[
              { x: 320, y: 340, w: 50, h: 40 },
              { x: 380, y: 330, w: 35, h: 45 },
              { x: 440, y: 310, w: 45, h: 35 },
              { x: 310, y: 440, w: 55, h: 45 },
              { x: 375, y: 450, w: 40, h: 35 },
              { x: 490, y: 280, w: 60, h: 50 },
              { x: 570, y: 260, w: 50, h: 60 },
              { x: 640, y: 240, w: 55, h: 50 },
              { x: 720, y: 220, w: 70, h: 55 },
              { x: 810, y: 170, w: 85, h: 60 },
              { x: 910, y: 180, w: 65, h: 50 },
              { x: 620, y: 370, w: 50, h: 45 },
              { x: 685, y: 360, w: 60, h: 40 },
              { x: 760, y: 340, w: 55, h: 45 },
              { x: 420, y: 520, w: 60, h: 45 },
              { x: 495, y: 510, w: 50, h: 40 },
              { x: 560, y: 490, w: 65, h: 50 },
            ].map((b, idx) => (
              <g key={idx}>
                <rect x={b.x + 3} y={b.y + 4} width={b.w} height={b.h} rx="3" fill="rgba(0, 0, 0, 0.45)" />
                <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="3" fill="#141f30" stroke="#25354b" strokeWidth="0.8" />
                <circle cx={b.x + 8} cy={b.y + 8} r="1.5" fill="#5d8ef1" opacity="0.6" />
                <circle cx={b.x + 18} cy={b.y + 8} r="1.5" fill="#aec6ff" opacity="0.5" />
                {b.w > 50 && <circle cx={b.x + 28} cy={b.y + 8} r="1.5" fill="#5d8ef1" opacity="0.7" />}
              </g>
            ))}

            {/* Urban Street Grid (Secondary & Local Roads) */}
            <g stroke="rgba(38, 54, 78, 0.45)" strokeWidth="2.5" fill="none">
              <line x1="100" y1="200" x2="1100" y2="200" />
              <line x1="100" y1="480" x2="1100" y2="480" />
              <line x1="100" y1="580" x2="1100" y2="580" />
              <line x1="200" y1="80" x2="200" y2="720" />
              <line x1="480" y1="80" x2="480" y2="720" />
              <line x1="720" y1="80" x2="720" y2="720" />
              <line x1="950" y1="80" x2="950" y2="720" />
            </g>

            {/* Railway Corridor (for T1 Line and City Rail) */}
            <line x1="340" y1="520" x2="370" y2="370" stroke="#374f70" strokeWidth="8" />
            <line x1="370" y1="370" x2="690" y2="270" stroke="#374f70" strokeWidth="8" />
            <line x1="340" y1="520" x2="370" y2="370" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" opacity="0.6" />
            <line x1="370" y1="370" x2="690" y2="270" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="4,6" opacity="0.6" />

            {/* SATHY ROAD (NH 948 Corridor) */}
            <line x1="430" y1="80" x2="430" y2="720" stroke="#1d2d42" strokeWidth="14" strokeLinecap="round" />
            <line x1="430" y1="80" x2="430" y2="720" stroke="#324968" strokeWidth="7" strokeLinecap="round" />
            <line x1="430" y1="80" x2="430" y2="720" stroke="#aec6ff" strokeWidth="0.8" strokeDasharray="6,8" opacity="0.4" />

            {/* TRICHY ROAD (SH 162 Corridor) */}
            <line x1="100" y1="560" x2="1100" y2="560" stroke="#1d2d42" strokeWidth="14" strokeLinecap="round" />
            <line x1="100" y1="560" x2="1100" y2="560" stroke="#324968" strokeWidth="7" strokeLinecap="round" />
            <line x1="100" y1="560" x2="1100" y2="560" stroke="#aec6ff" strokeWidth="0.8" strokeDasharray="6,8" opacity="0.4" />

            {/* AVINASHI ROAD (NH 544 6-Lane Expressway Corridor) */}
            <path
              d="M 120 620 L 320 540 L 430 390 L 550 345 L 680 310 L 840 235 L 1100 160"
              stroke="#1b283b"
              strokeWidth="22"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 120 620 L 320 540 L 430 390 L 550 345 L 680 310 L 840 235 L 1100 160"
              stroke="#324968"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M 120 620 L 320 540 L 430 390 L 550 345 L 680 310 L 840 235 L 1100 160"
              stroke="#aec6ff"
              strokeWidth="1"
              strokeDasharray="8,10"
              opacity="0.5"
              fill="none"
            />

            {/* Road Shields */}
            <g transform="translate(620, 290)">
              <rect x="-30" y="-10" width="60" height="20" rx="4" fill="#00275e" stroke="#5d8ef1" strokeWidth="1.2" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">
                NH 544
              </text>
            </g>
            <g transform="translate(430, 180)">
              <rect x="-30" y="-10" width="60" height="20" rx="4" fill="#00275e" stroke="#5d8ef1" strokeWidth="1.2" />
              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">
                NH 948
              </text>
            </g>

            {/* Live Traffic Overlay */}
            <g fill="none" opacity="0.85">
              <path d="M 120 620 L 320 540" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <path d="M 320 540 L 430 390" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
              <path d="M 430 390 L 680 310" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
              <path d="M 680 310 L 840 235" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
            </g>

            {/* DYNAMIC ROUTE POLYLINE (SPECIFIC TO SELECTED ROUTE) */}
            <path
              d={currentGeometry.pathD}
              fill="none"
              stroke="#5d8ef1"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
              filter="url(#routeGlow)"
            />
            <path
              d={currentGeometry.pathD}
              fill="none"
              stroke="#aec6ff"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={currentGeometry.pathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* PERMANENT STOPPING NAMES MARKED EXPLICITLY ON THE MAP */}
            {currentGeometry.stops.map((stop) => {
              const isOrigin = stop.type === 'origin';
              const isTerminus = stop.type === 'terminus';

              return (
                <g
                  key={stop.id}
                  transform={`translate(${stop.x}, ${stop.y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    const matched = selectedRoute.stops.find((s) => s.id === stop.id) || {
                      id: stop.id,
                      name: stop.name,
                      coordinates: [11.0183, 76.9658],
                      nextArrival: stop.time,
                    };
                    setSelectedStopDetail(matched);
                  }}
                >
                  {/* Pin Dot Terminal */}
                  <circle
                    r={isOrigin || isTerminus ? 9 : 6.5}
                    fill={isOrigin ? '#10b981' : isTerminus ? '#5d8ef1' : '#141c2a'}
                    stroke={isOrigin || isTerminus ? '#ffffff' : '#aec6ff'}
                    strokeWidth="2.5"
                  />
                  {(isOrigin || isTerminus) && <circle r="3" fill="#ffffff" />}

                  {/* Stop Name Badge (Permanently Legible, Offset Top) */}
                  <g transform="translate(0, -18)">
                    {/* Shadow box */}
                    <rect
                      x={-75}
                      y={-24}
                      width={150}
                      height={26}
                      rx="6"
                      fill="#09121f"
                      stroke={isOrigin ? '#10b981' : isTerminus ? '#aec6ff' : 'rgba(93, 142, 241, 0.7)'}
                      strokeWidth="1.2"
                      opacity="0.96"
                      filter="drop-shadow(0 4px 10px rgba(0, 0, 0, 0.6))"
                    />
                    {/* Status dot */}
                    <circle cx={-62} cy={-11} r={3} fill={isOrigin ? '#10b981' : isTerminus ? '#aec6ff' : '#5d8ef1'} />
                    {/* Stop Name Text */}
                    <text
                      x={-52}
                      y={-14}
                      fill="#dbe2f7"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {stop.name.length > 17 ? stop.name.slice(0, 16) + '..' : stop.name}
                    </text>
                    {/* Stop Time Text */}
                    <text
                      x={-52}
                      y={-3}
                      fill={isOrigin ? '#10b981' : '#aec6ff'}
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {isOrigin ? 'Start · ' : isTerminus ? 'End · ' : 'Stop · '}{stop.time}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* LIVE MOVING FLEET TRANSIT VEHICLE */}
            <g transform={`translate(${vehicleState.x}, ${vehicleState.y}) rotate(${vehicleState.angle})`}>
              {/* Forward Headlight Lighting Beam */}
              <path
                d="M 0 0 L 110 -35 L 110 35 Z"
                fill="url(#headlightBeam)"
                fillOpacity="0.22"
                className="pointer-events-none"
              />
              <circle r="22" fill="rgba(93, 142, 241, 0.2)" className="animate-ping" />
              <circle r="14" fill="rgba(93, 142, 241, 0.4)" />
              <circle r="10" fill="#5d8ef1" stroke="#ffffff" strokeWidth="2.5" />
              <polygon points="8,0 -4,-5 -2,0 -4,5" fill="#001a43" />
            </g>

            {/* Floating Live Vehicle Indicator Label */}
            <g transform={`translate(${vehicleState.x + 18}, ${vehicleState.y - 14})`}>
              <rect x="0" y="0" width="130" height="24" rx="6" fill="#0b1321" stroke="#5d8ef1" strokeWidth="1.2" />
              <text x="8" y="15" fill="#aec6ff" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                Unit #204 · {currentSpeed} km/h
              </text>
            </g>
          </svg>
        </div>

        {/* 3. HEADS-UP NAVIGATION CARD — RIGHT SIDE WITH COLLAPSIBLE MINIMIZE TOGGLE */}
        {isHudMinimized ? (
          <button
            onClick={() => setIsHudMinimized(false)}
            className="absolute top-4 right-4 z-20 glass-panel px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-xs border border-[#38bdf8]/50 shadow-2xl hover:bg-[#132038] transition-all cursor-pointer group animate-fadeIn"
            title="Expand Full Guidance Card"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
            <span className="material-symbols-outlined text-[#38bdf8] text-[20px]">
              {currentTurnInstruction.icon}
            </span>
            <div className="text-left">
              <p className="font-bold text-[#f8fafc] text-xs leading-none">{currentTurnInstruction.instruction}</p>
              <p className="font-mono text-[10px] text-[#38bdf8] mt-0.5">
                {currentSpeed} km/h · Lane {currentTurnInstruction.laneActive === 0 ? 'Left' : currentTurnInstruction.laneActive === 1 ? 'Thru' : 'Right'}
              </p>
            </div>
            <span className="material-symbols-outlined text-[16px] text-[#94a3b8] group-hover:text-[#38bdf8] ml-1">
              open_in_full
            </span>
          </button>
        ) : (
          <div
            className="absolute top-4 right-4 z-20 glass-panel p-4 md:p-5 w-80 sm:w-88 md:w-92 shadow-2xl border border-[#424752]/80 space-y-3.5 animate-fadeIn"
            style={{ backdropFilter: 'blur(16px)' }}
          >
            {/* Header row with minimize button */}
            <div className="flex items-center justify-between pb-1 -mt-1">
              <span className="text-[10px] font-mono text-[#38bdf8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></span>
                Active Guidance HUD
              </span>
              <button
                onClick={() => setIsHudMinimized(true)}
                className="text-[#94a3b8] hover:text-[#f8fafc] p-1 rounded-lg hover:bg-[#16243d] transition-colors cursor-pointer text-xs flex items-center gap-1"
                title="Minimize Card to Uncover Map"
              >
                <span className="text-[10px] font-mono">Minimize</span>
                <span className="material-symbols-outlined text-[15px]">close_fullscreen</span>
              </button>
            </div>

            {/* Turn-by-Turn Instruction Banner */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#141c2a] to-[#1e2a3c] border border-[#5d8ef1]/40 shadow-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5d8ef1] text-[#001a43] flex items-center justify-center shrink-0 font-bold shadow-md">
                  <span className="material-symbols-outlined text-[24px]">
                    {currentTurnInstruction.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono text-[#aec6ff] uppercase tracking-wider font-bold">
                    Next Maneuver
                  </p>
                  <h4 className="font-display text-sm font-bold text-[#ffffff] truncate">
                    {currentTurnInstruction.instruction}
                  </h4>
                  <p className="text-[11px] text-[#8d909e] truncate">
                    {currentTurnInstruction.sub}
                  </p>
                </div>
              </div>

              {/* Visual 3-Lane Guidance Assist Indicator */}
              <div className="pt-2 border-t border-[#424752]/40 flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8d909e]">Lane Assist:</span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((laneIdx) => {
                    const isActiveLane = currentTurnInstruction.laneActive === laneIdx;
                    return (
                      <div
                        key={laneIdx}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          isActiveLane
                            ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : 'bg-[#141c2a] border-[#424752]/40 text-[#8d909e]'
                        }`}
                      >
                        {laneIdx === 0 ? 'Left' : laneIdx === 1 ? 'Thru' : 'Right Turn'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Speedometer & Route Destination */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-[#5d8ef1] text-[#001a43]">
                    {selectedRoute.code}
                  </span>
                  <span className="text-xs font-semibold text-[#aec6ff]">
                    Rapid Corridor
                  </span>
                </div>
                <h4 className="font-display text-sm font-bold text-[#dbe2f7] truncate max-w-[190px]">
                  {selectedRoute.name.split('(')[0]}
                </h4>
                <p className="text-[11px] text-[#8d909e]">
                  Passing Peelamedu · Free Flow
                </p>
              </div>

              {/* Speedometer Badge */}
              <div className="text-center px-3 py-1.5 rounded-xl bg-[#141c2a] border border-[#424752]/60">
                <span className="font-display text-lg font-bold text-[#10b981] leading-none block">
                  {currentSpeed}
                </span>
                <span className="text-[9px] font-mono text-[#8d909e] uppercase">
                  KM/H (50 MAX)
                </span>
              </div>
            </div>

            {/* Tri-Metric Row: ETA | Distance | Next Stop */}
            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#424752]/40 text-center">
              <div className="p-2 rounded-lg bg-[#141c2a]">
                <p className="text-[10px] font-mono text-[#8d909e] uppercase">ETA</p>
                <p className="font-display text-xs font-bold text-[#dbe2f7]">
                  {selectedRoute.duration}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[#141c2a]">
                <p className="text-[10px] font-mono text-[#8d909e] uppercase">Remaining</p>
                <p className="font-display text-xs font-bold text-[#aec6ff]">
                  {selectedRoute.distance}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-[#141c2a]">
                <p className="text-[10px] font-mono text-[#8d909e] uppercase">Next Stop</p>
                <p className="font-display text-xs font-bold text-[#10b981] truncate mt-0.5">
                  {currentGeometry.stops[1]?.name.split(' ')[0] || 'En route'}
                </p>
              </div>
            </div>

            {/* Voice Co-Pilot & Guidance Controls */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setVoiceGuidanceMuted(!voiceGuidanceMuted);
                  if (voiceGuidanceMuted) {
                    triggerVoicePrompt(currentTurnInstruction.instruction);
                  }
                }}
                className={`p-2.5 rounded-xl border text-xs flex items-center justify-center transition-colors cursor-pointer ${
                  voiceGuidanceMuted
                    ? 'bg-[#141c2a] text-[#8d909e] border-[#424752]/60'
                    : 'bg-[#5d8ef1]/20 text-[#aec6ff] border-[#aec6ff]/40 shadow-sm'
                }`}
                title={voiceGuidanceMuted ? 'Unmute Piper TTS Spoken Guidance' : 'Mute Piper TTS Spoken Guidance'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {voiceGuidanceMuted ? 'volume_off' : 'volume_up'}
                </span>
              </button>

              <button
                onClick={() => setIsGuidanceActive(!isGuidanceActive)}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                  isGuidanceActive
                    ? 'bg-[#5d8ef1] text-[#001a43] hover:bg-[#aec6ff]'
                    : 'bg-[#141c2a] text-[#c3c6d4] border border-[#424752]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isGuidanceActive ? 'near_me' : 'play_arrow'}
                </span>
                <span>{isGuidanceActive ? 'Active Navigation' : 'Resume Guidance'}</span>
              </button>

              <button
                onClick={() => setShowStepsDrawer(!showStepsDrawer)}
                className="py-2 px-3 rounded-xl bg-[#141c2a] hover:bg-[#222a39] text-[#aec6ff] border border-[#424752]/60 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">list</span>
                <span>Stops</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. MAP CONTROL CLUSTER (Top-Left, Clean Non-Overlapping Spacing) */}
        <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-2.5">
          <div className="glass-panel rounded-xl overflow-hidden flex flex-col border border-[#424752]/70 shadow-2xl">
            <button
              onClick={handleZoomIn}
              className="p-3 text-[#dbe2f7] hover:text-[#aec6ff] hover:bg-[#222a39] border-b border-[#424752]/50 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Zoom In"
              title="Zoom In"
            >
              <span className="material-symbols-outlined text-[19px]">add</span>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-3 text-[#dbe2f7] hover:text-[#aec6ff] hover:bg-[#222a39] border-b border-[#424752]/50 transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Zoom Out"
              title="Zoom Out"
            >
              <span className="material-symbols-outlined text-[19px]">remove</span>
            </button>
            <button
              onClick={handleRecenter}
              className="p-3 text-[#aec6ff] hover:text-[#ffffff] hover:bg-[#222a39] transition-colors cursor-pointer flex items-center justify-center"
              title="Recenter Map View"
            >
              <span className="material-symbols-outlined text-[19px]">my_location</span>
            </button>
          </div>

          {/* Cyber Safety Radar Trigger */}
          <button
            onClick={() => setShowSafetyRadar(!showSafetyRadar)}
            className={`glass-panel p-2.5 rounded-xl border shadow-2xl flex items-center justify-center transition-all cursor-pointer ${
              showSafetyRadar
                ? 'bg-[#10b981]/20 border-[#10b981] text-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-[#424752]/70 text-[#aec6ff] hover:text-[#ffffff]'
            }`}
            title="Inspect Road Safety & Cyber Radar"
          >
            <span className="material-symbols-outlined text-[20px]">security</span>
          </button>
        </div>

        {/* 5. BOTTOM FLOATING CRUISE CONTROLLER & ROUTE SELECTOR DOCK (Bottom-Left) */}
        <div className="absolute bottom-6 left-4 z-20 max-w-lg w-full glass-panel p-3.5 rounded-2xl shadow-2xl border border-[#424752]/80 space-y-2.5">
          <div className="flex items-center justify-between">
            {/* Route selector pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {COIMBATORE_ROUTES.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedRouteId === route.id
                      ? 'bg-[#5d8ef1] text-[#001a43] shadow-md font-bold'
                      : 'bg-[#141c2a] text-[#c3c6d4] hover:bg-[#222a39] border border-[#424752]/50'
                  }`}
                >
                  {route.code}
                </button>
              ))}
            </div>

            {/* Sim speed multipliers */}
            <div className="flex items-center gap-1 bg-[#141c2a] p-0.5 rounded-lg border border-[#424752]/60 text-[10px] font-mono">
              {[1, 2, 4].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setSimMultiplier(mult)}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    simMultiplier === mult ? 'bg-[#5d8ef1] text-[#001a43] font-bold' : 'text-[#8d909e]'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>

          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8d909e]">
              <span>Trip Progress: {Math.round(vehicleProgress * 100)}%</span>
              <span className="text-[#aec6ff]">
                {(vehicleProgress * parseFloat(selectedRoute.distance)).toFixed(1)} km / {selectedRoute.distance}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={vehicleProgress}
              onChange={(e) => setVehicleProgress(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#222a39] rounded-lg appearance-none cursor-pointer accent-[#5d8ef1]"
            />
          </div>

          {/* Voice readout action */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#424752]/40">
            <span className="text-[11px] text-[#8d909e] font-mono">
              Drag to pan map · Scroll to zoom
            </span>

            <button
              onClick={() => triggerVoicePrompt(currentTurnInstruction.instruction)}
              className="text-[#aec6ff] hover:underline text-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">volume_up</span>
              <span>Speak Instruction</span>
            </button>
          </div>
        </div>

        {/* 6. CYBER SAFETY & ROAD INCIDENT RADAR MODAL */}
        {showSafetyRadar && (
          <div className="absolute top-18 left-4 z-30 glass-panel p-4 md:p-5 rounded-2xl max-w-sm w-full border border-[#424752]/80 shadow-2xl space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#424752]/50">
              <h4 className="font-display text-sm font-bold text-[#dbe2f7] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#10b981] text-[18px]">
                  verified_user
                </span>
                Corridor Safety &amp; Cyber Radar
              </h4>
              <button
                onClick={() => setShowSafetyRadar(false)}
                className="text-[#8d909e] hover:text-[#dbe2f7] text-xs cursor-pointer"
              >
                &times; Close
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#141c2a] border border-[#10b981]/30">
                <p className="text-[10px] font-mono text-[#10b981] uppercase font-bold">
                  GNSS Spoofing Protection
                </p>
                <p className="font-bold text-[#dbe2f7] mt-0.5">L5 Encrypted Satellite Beacon</p>
                <p className="text-[#8d909e] text-[11px] mt-0.5">
                  Dead reckoning inertial sensor fusion active. Spoofing risk: 0.00%.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#141c2a] border border-[#424752]/40">
                <p className="text-[10px] font-mono text-[#aec6ff] uppercase font-bold">
                  Corridor Clearance Status
                </p>
                <p className="font-bold text-[#dbe2f7] mt-0.5">Dedicated Bus Lane Open</p>
                <p className="text-[#8d909e] text-[11px] mt-0.5">
                  Signal prioritization confirmed for Transit Unit #204.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7. INTERACTIVE TRANSIT STOP POI DETAILS MODAL */}
        {selectedStopDetail && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 glass-panel p-6 rounded-2xl max-w-sm w-full border border-[#5d8ef1]/50 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#aec6ff] uppercase font-bold">
                  Station Telemetry
                </span>
                <h4 className="font-display text-base font-bold text-[#dbe2f7] mt-0.5">
                  {selectedStopDetail.name}
                </h4>
                <p className="text-xs text-[#8d909e]">Platform Bay 1 · Verified Stop</p>
              </div>
              <button
                onClick={() => setSelectedStopDetail(null)}
                className="text-[#8d909e] hover:text-[#dbe2f7] text-base cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#141c2a] border border-[#424752]/50 grid grid-cols-2 gap-2 text-center text-xs">
              <div>
                <p className="text-[10px] font-mono text-[#8d909e] uppercase">Next Arrival</p>
                <p className="font-display text-sm font-bold text-[#10b981] mt-0.5">
                  {selectedStopDetail.nextArrival}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-[#8d909e] uppercase">Occupancy</p>
                <p className="font-display text-sm font-bold text-[#aec6ff] mt-0.5">
                  42% (Seats Free)
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <p className="text-[11px] font-mono text-[#8d909e] uppercase">Station Accessibility</p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2 py-0.5 rounded bg-[#222a39] text-[#c3c6d4] text-[11px]">
                  ♿ Low-Floor EV Ramp
                </span>
                <span className="px-2 py-0.5 rounded bg-[#222a39] text-[#c3c6d4] text-[11px]">
                  📶 Offline Mesh Link
                </span>
                <span className="px-2 py-0.5 rounded bg-[#222a39] text-[#c3c6d4] text-[11px]">
                  🔋 EV Charging Node
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerVoicePrompt(
                  `Approaching ${selectedStopDetail.name}. Scheduled arrival at ${selectedStopDetail.nextArrival}.`
                );
                setSelectedStopDetail(null);
              }}
              className="w-full py-2.5 rounded-xl bg-[#5d8ef1] hover:bg-[#aec6ff] text-[#001a43] font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              Announce Station via Piper TTS
            </button>
          </div>
        )}

        {/* 8. COLLAPSIBLE WAYPOINTS SCHEDULE DRAWER */}
        {showStepsDrawer && (
          <div className="absolute top-20 right-4 z-30 glass-panel p-4 rounded-xl max-w-sm w-full border border-[#424752]/80 shadow-2xl max-h-80 overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-[#424752]/50 mb-3">
              <h4 className="text-xs font-bold font-mono text-[#aec6ff] uppercase">
                Line {selectedRoute.code} Scheduled Stops
              </h4>
              <button
                onClick={() => setShowStepsDrawer(false)}
                className="text-[#8d909e] hover:text-[#dbe2f7] text-xs cursor-pointer"
              >
                &times; Close
              </button>
            </div>
            <div className="space-y-2.5">
              {currentGeometry.stops.map((stop, i) => (
                <div
                  key={stop.id}
                  onClick={() => {
                    const matched = selectedRoute.stops.find((s) => s.id === stop.id) || {
                      id: stop.id,
                      name: stop.name,
                      coordinates: [11.0183, 76.9658],
                      nextArrival: stop.time,
                    };
                    setSelectedStopDetail(matched);
                  }}
                  className="flex items-start gap-2.5 text-xs p-1.5 rounded-lg hover:bg-[#141c2a] transition-colors cursor-pointer"
                >
                  <div className="flex flex-col items-center mt-0.5">
                    <span
                      className={`w-3 h-3 rounded-full border-2 ${
                        stop.type === 'origin'
                          ? 'bg-[#10b981] border-[#ffffff]'
                          : stop.type === 'terminus'
                          ? 'bg-[#5d8ef1] border-[#aec6ff]'
                          : 'bg-[#141c2a] border-[#8d909e]'
                      }`}
                    ></span>
                    {i !== currentGeometry.stops.length - 1 && (
                      <span className="w-0.5 h-4 bg-[#424752]/60 my-0.5"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#dbe2f7] truncate">{stop.name}</p>
                    <p className="text-[10px] text-[#8d909e]">
                      Arrival: <span className="font-mono text-[#aec6ff]">{stop.time}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
