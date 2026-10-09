import { UserSession } from '../types';

const SESSION_KEY = 'transitvoice_session_state';

const DEFAULT_SESSION: UserSession = {
  authenticated: true,
  userId: 'USR-8842-AX',
  userName: 'Alex Mercer',
  email: 'a.mercer@transit.io',
  role: 'Transit Systems Analyst',
  clearanceLevel: 'Clearance: Level 3',
  token: 'tv_sec_token_99f2b84e',
  lastVerifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

class SessionService {
  private currentSession: UserSession;
  private listeners: Array<(session: UserSession) => void> = [];

  constructor() {
    this.currentSession = this.loadSession();
  }

  private loadSession(): UserSession {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return { ...DEFAULT_SESSION };
  }

  private saveSession(): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(this.currentSession));
    } catch {
      // Storage unavailable
    }
    this.notify();
  }

  public getSession(): UserSession {
    return { ...this.currentSession };
  }

  public async checkSession(): Promise<UserSession> {
    return this.getSession();
  }

  public login(userId: string = 'USR-8842-AX'): UserSession {
    this.currentSession = {
      ...this.currentSession,
      authenticated: true,
      userId,
      token: `tv_token_${Math.random().toString(36).substring(2, 10)}`,
      lastVerifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.saveSession();
    return this.getSession();
  }

  public logout(): void {
    this.currentSession = {
      ...this.currentSession,
      authenticated: false,
      token: undefined,
    };
    this.saveSession();
  }

  public subscribe(listener: (session: UserSession) => void): () => void {
    this.listeners.push(listener);
    listener(this.getSession());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const s = this.getSession();
    this.listeners.forEach((l) => l(s));
  }
}

export const sessionManager = new SessionService();
