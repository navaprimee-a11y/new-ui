import {
  ActivityLogItem,
  PersonalSavedRoute,
  TransitRoute,
  UserProfile,
} from '../types';

// Realistic geographic coordinates for Coimbatore transit network
// Coimbatore Junction: [10.9972, 76.9629]
// Gandhipuram Central Bus Stand: [11.0183, 76.9658]
// Peelamedu / PSG Tech: [11.0252, 77.0041]
// TIDEL Park Coimbatore / Tech Hub: [11.0264, 77.0322]
// Singanallur Bus Terminal: [10.9996, 77.0255]
// Ukkadam Bus Stand: [10.9885, 76.9602]
// RS Puram: [11.0092, 76.9482]
// Saravanampatti Tech Zone: [11.0825, 76.9961]

export const COIMBATORE_ROUTES: TransitRoute[] = [
  {
    id: '12',
    code: '12',
    name: 'Route 12 - Blue Line (Central to Tech Park)',
    mode: 'bus',
    status: 'Optimal',
    duration: '27 min',
    distance: '8.4 km',
    departureTime: '08:45',
    arrivalTime: '09:12',
    transfers: 0,
    fastest: true,
    stops: [
      { id: 's1', name: 'Coimbatore Junction', coordinates: [10.9972, 76.9629], nextArrival: '08:45' },
      { id: 's2', name: 'Gandhipuram Central', coordinates: [11.0183, 76.9658], nextArrival: '08:54' },
      { id: 's3', name: 'Nava India', coordinates: [11.0228, 76.9882], nextArrival: '09:01' },
      { id: 's4', name: 'Peelamedu Tech Junction', coordinates: [11.0252, 77.0041], nextArrival: '09:07' },
      { id: 's5', name: 'TIDEL Park North', coordinates: [11.0264, 77.0322], nextArrival: '09:12' },
    ],
    pathCoordinates: [
      [10.9972, 76.9629],
      [11.0068, 76.9645],
      [11.0183, 76.9658],
      [11.0205, 76.9765],
      [11.0228, 76.9882],
      [11.0242, 76.9975],
      [11.0252, 77.0041],
      [11.0258, 77.0184],
      [11.0264, 77.0322],
    ],
  },
  {
    id: '11A',
    code: '11A',
    name: 'Route 11A - Avinashi Rapid (Ukkadam to Airport)',
    mode: 'bus',
    status: 'On Time',
    duration: '34 min',
    distance: '11.2 km',
    departureTime: '08:50',
    arrivalTime: '09:24',
    transfers: 0,
    ecoChoice: true,
    stops: [
      { id: 'u1', name: 'Ukkadam Hub', coordinates: [10.9885, 76.9602], nextArrival: '08:50' },
      { id: 'u2', name: 'Town Hall', coordinates: [10.9961, 76.9588], nextArrival: '08:56' },
      { id: 'u3', name: 'Gandhipuram', coordinates: [11.0183, 76.9658], nextArrival: '09:05' },
      { id: 'u4', name: 'Hopes College', coordinates: [11.0271, 77.0195], nextArrival: '09:16' },
      { id: 'u5', name: 'Coimbatore Airport Terminal', coordinates: [11.0305, 77.0435], nextArrival: '09:24' },
    ],
    pathCoordinates: [
      [10.9885, 76.9602],
      [10.9961, 76.9588],
      [11.0045, 76.9632],
      [11.0183, 76.9658],
      [11.0228, 76.9882],
      [11.0271, 77.0195],
      [11.0305, 77.0435],
    ],
  },
  {
    id: '4',
    code: '4',
    name: 'Route 4 - Sathy Express (Town Hall to Saravanampatti)',
    mode: 'bus',
    status: 'Slight Delay',
    duration: '38 min',
    distance: '13.5 km',
    departureTime: '09:05',
    arrivalTime: '09:43',
    transfers: 1,
    stops: [
      { id: 't1', name: 'Town Hall', coordinates: [10.9961, 76.9588], nextArrival: '09:05' },
      { id: 't2', name: 'Gandhipuram', coordinates: [11.0183, 76.9658], nextArrival: '09:14' },
      { id: 't3', name: 'Ganapathy', coordinates: [11.0423, 76.9785], nextArrival: '09:26' },
      { id: 't4', name: 'Saravanampatti Tech Zone', coordinates: [11.0825, 76.9961], nextArrival: '09:43' },
    ],
    pathCoordinates: [
      [10.9961, 76.9588],
      [11.0092, 76.9625],
      [11.0183, 76.9658],
      [11.0315, 76.9712],
      [11.0423, 76.9785],
      [11.0621, 76.9875],
      [11.0825, 76.9961],
    ],
  },
  {
    id: 'T1',
    code: 'T1',
    name: 'Express T-Line Commuter Rail',
    mode: 'train',
    status: 'Optimal',
    duration: '21 min',
    distance: '9.8 km',
    departureTime: '08:52',
    arrivalTime: '09:13',
    transfers: 0,
    stops: [
      { id: 'tr1', name: 'Coimbatore Main Junction', coordinates: [10.9972, 76.9629], nextArrival: '08:52' },
      { id: 'tr2', name: 'Coimbatore North Station', coordinates: [11.0195, 76.9515], nextArrival: '09:01' },
      { id: 'tr3', name: 'Peelamedu Railway Halt', coordinates: [11.0268, 77.0125], nextArrival: '09:13' },
    ],
    pathCoordinates: [
      [10.9972, 76.9629],
      [11.0085, 76.9562],
      [11.0195, 76.9515],
      [11.0245, 76.9821],
      [11.0268, 77.0125],
    ],
  },
];

const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act-101',
    type: 'voice',
    title: 'Voice Command',
    details: 'Find fastest route to Central Station avoiding heavy traffic zones.',
    timestamp: '10:42 AM',
    relativeTime: 'Today',
    securityLevel: 'verified',
    status: 'completed',
  },
  {
    id: 'act-102',
    type: 'route',
    title: 'Route Calculation',
    details: 'Generated 3 alternative paths. Selected Route 12 - Blue Line (est. 27 mins).',
    timestamp: '10:42 AM',
    relativeTime: 'Today',
    securityLevel: 'standard',
    status: 'completed',
  },
  {
    id: 'act-103',
    type: 'security',
    title: 'Spectral Verification',
    details: 'Resemblyzer voice match verified with 95.8% confidence against enrolled biometric model.',
    timestamp: '09:45 AM',
    relativeTime: 'Today',
    securityLevel: 'verified',
    status: 'completed',
  },
  {
    id: 'act-104',
    type: 'system',
    title: 'Location Override',
    details: 'GPS signal brief flutter in Sector 4 tunnel; dead reckoning sensor fusion active.',
    timestamp: '09:15 AM',
    relativeTime: 'Today',
    securityLevel: 'elevated',
    status: 'active',
  },
  {
    id: 'act-105',
    type: 'profile',
    title: 'Profile Preference Update',
    details: 'Updated default commute preferences to Eco-mode & minimal alert verbosity.',
    timestamp: '08:00 AM',
    relativeTime: 'Today',
    securityLevel: 'secure',
    status: 'completed',
  },
  {
    id: 'act-106',
    type: 'security',
    title: 'System Login',
    details: 'Session token issued from recognized console with hardware keystore verification.',
    timestamp: '07:58 AM',
    relativeTime: 'Today',
    securityLevel: 'verified',
    status: 'completed',
  },
];

const SAVED_ROUTES: PersonalSavedRoute[] = [
  {
    id: 'pr-1',
    route_name: 'Home (RS Puram) to Tech Park (TIDEL)',
    source: 'RS Puram',
    destination: 'TIDEL Park North',
    via: 'Avinashi Road Express Corridor',
    estimatedMinutes: 28,
    departureTime: '08:15 AM',
    type: 'Frequent Commute',
  },
  {
    id: 'pr-2',
    route_name: 'TIDEL Hub to Central Railway Station',
    source: 'TIDEL Park North',
    destination: 'Coimbatore Junction',
    via: 'Route 12 Blue Line Direct',
    estimatedMinutes: 27,
    departureTime: '05:30 PM',
    type: 'Daily Return',
  },
  {
    id: 'pr-3',
    route_name: 'Airport Express to Gandhipuram',
    source: 'Coimbatore Airport',
    destination: 'Gandhipuram Central',
    via: 'Route 11A Rapid',
    estimatedMinutes: 22,
    departureTime: '10:00 AM',
    type: 'Transit Link',
  },
];

const INITIAL_PROFILE: UserProfile = {
  name: 'Alex Mercer',
  email: 'a.mercer@transit.io',
  role: 'Transit Systems Analyst',
  clearance: 'Clearance: Level 3',
  twoFactorEnabled: true,
  voiceProfileScore: 95,
  voiceVerified: true,
  localDataStorageOnly: true,
  telemetrySharing: false,
  language: 'English (US) - Transit Optimized',
  alertVerbosity: 'Standard',
};

class ApiService {
  private activityLogs: ActivityLogItem[] = [...INITIAL_ACTIVITY_LOGS];
  private profile: UserProfile = { ...INITIAL_PROFILE };
  private savedRoutes: PersonalSavedRoute[] = [...SAVED_ROUTES];

  // Preserved interface: apiClient.getPersonalHistory()
  public async getPersonalHistory() {
    return {
      status: 'success',
      data: this.activityLogs.map((log) => ({
        ...log,
        activity_desc: `[${log.title}] ${log.details} (${log.timestamp})`,
      })),
    };
  }

  // Preserved interface: apiClient.getPersonalRoutes()
  public async getPersonalRoutes() {
    return {
      status: 'success',
      data: [...this.savedRoutes],
    };
  }

  // Preserved interface: apiClient.getPersonalProfile()
  public async getPersonalProfile() {
    return {
      status: 'success',
      data: { ...this.profile },
    };
  }

  // Preserved interface: apiClient.getTransitInfo()
  public async getTransitInfo() {
    return {
      status: 'success',
      data: {
        status: 'Optimal System Operation',
        region: 'Coimbatore Metropolitan Transit Grid',
        activeLines: 24,
        busesTracked: 142,
        serverLatencyMs: 14,
        offlineReady: true,
        alerts: [
          'Sector 4 Avinashi Road flyover utility work completed; normal speed resumed.',
        ],
      },
    };
  }

  // Preserved interface: apiClient.getTransitRoute(id)
  public async getTransitRoute(id: string) {
    const route = COIMBATORE_ROUTES.find((r) => r.id === id) || COIMBATORE_ROUTES[0];
    return {
      status: 'success',
      data: { ...route },
    };
  }

  // Preserved interface: apiClient.searchRoutes(from, to, mode)
  public async searchRoutes(from?: string, to?: string, mode?: string) {
    let filtered = [...COIMBATORE_ROUTES];
    if (mode && mode !== 'all') {
      filtered = filtered.filter((r) => r.mode === mode);
    }
    return {
      status: 'success',
      data: filtered,
    };
  }

  public addActivityLog(item: Omit<ActivityLogItem, 'id' | 'timestamp' | 'relativeTime'>): ActivityLogItem {
    const now = new Date();
    const newLog: ActivityLogItem = {
      id: `act-${Date.now()}`,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      relativeTime: 'Just now',
      ...item,
    };
    this.activityLogs.unshift(newLog);
    return newLog;
  }

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...updates };
    return { ...this.profile };
  }
}

export const apiClient = new ApiService();
