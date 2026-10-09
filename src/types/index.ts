export type ScreenId =
  | 'home'
  | 'routes'
  | 'navigation'
  | 'personal'
  | 'security'
  | 'activity'
  | 'profile';

export interface UserSession {
  authenticated: boolean;
  userId: string;
  userName: string;
  email: string;
  role: string;
  clearanceLevel: string;
  token?: string;
  lastVerifiedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  type: 'voice' | 'route' | 'security' | 'profile' | 'system';
  title: string;
  details: string;
  timestamp: string;
  relativeTime: string;
  securityLevel: 'verified' | 'standard' | 'elevated' | 'secure';
  status: 'completed' | 'dismissed' | 'active';
}

export interface TransitStop {
  id: string;
  name: string;
  coordinates: [number, number];
  nextArrival: string;
}

export interface TransitRoute {
  id: string;
  code: string;
  name: string;
  mode: 'bus' | 'train' | 'walk' | 'bike';
  status: 'On Time' | 'Slight Delay' | 'Optimal';
  duration: string;
  distance: string;
  departureTime: string;
  arrivalTime: string;
  transfers: number;
  stops: TransitStop[];
  pathCoordinates: [number, number][];
  ecoChoice?: boolean;
  fastest?: boolean;
}

export interface PersonalSavedRoute {
  id: string;
  route_name: string;
  source: string;
  destination: string;
  via: string;
  estimatedMinutes: number;
  departureTime: string;
  type: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  clearance: string;
  twoFactorEnabled: boolean;
  voiceProfileScore: number;
  voiceVerified: boolean;
  localDataStorageOnly: boolean;
  telemetrySharing: boolean;
  language: string;
  alertVerbosity: 'Minimal' | 'Standard' | 'Detailed';
}

export interface VerificationPipelineStep {
  step: number;
  name: string;
  description: string;
  status: 'idle' | 'processing' | 'passed' | 'failed';
  score?: number;
  detail?: string;
}
