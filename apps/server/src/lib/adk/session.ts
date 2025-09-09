import { ADKClient } from './client';
import type { ADKSession } from './types';

export interface SessionManager {
  getCurrentSession(): ADKSession | null;
  createNewSession(): Promise<ADKSession>;
  restoreSession(sessionId: string): Promise<ADKSession | null>;
  clearSession(): void;
  isSessionValid(): boolean;
}

export class LocalStorageSessionManager implements SessionManager {
  private currentSession: ADKSession | null = null;
  private readonly storageKey = 'adk-session';
  
  constructor(private adkClient: ADKClient) {
    this.loadSessionFromStorage();
  }

  getCurrentSession(): ADKSession | null {
    return this.currentSession;
  }

  async createNewSession(): Promise<ADKSession> {
    try {
      // Clear any existing session
      this.clearSession();
      
      // Create new session via ADK service
      const session = await this.adkClient.createSession();
      
      // Store the session
      this.currentSession = session;
      this.saveSessionToStorage(session);
      
      return session;
    } catch (error) {
      console.error('Failed to create new session:', error);
      throw error;
    }
  }

  async restoreSession(sessionId: string): Promise<ADKSession | null> {
    try {
      // Try to get session from ADK service
      const session = await this.adkClient.getSession(sessionId);
      
      if (session) {
        this.currentSession = session;
        this.saveSessionToStorage(session);
      }
      
      return session;
    } catch (error) {
      console.warn('Failed to restore session:', error);
      // Clear invalid session from storage
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    this.currentSession = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    
    // Check if session is not too old (24 hours)
    const sessionAge = Date.now() - (this.currentSession.lastUpdateTime * 1000);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
    
    if (sessionAge > maxAge) {
      this.clearSession();
      return false;
    }
    
    return true;
  }

  private loadSessionFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const session = JSON.parse(stored) as ADKSession;
        if (this.isSessionDataValid(session)) {
          this.currentSession = session;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.warn('Failed to load session from storage:', error);
      this.clearSession();
    }
  }

  private saveSessionToStorage(session: ADKSession): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
    } catch (error) {
      console.warn('Failed to save session to storage:', error);
    }
  }

  private isSessionDataValid(session: any): boolean {
    return (
      session &&
      typeof session.id === 'string' &&
      typeof session.appName === 'string' &&
      typeof session.userId === 'string' &&
      typeof session.lastUpdateTime === 'number'
    );
  }
}

/**
 * Hook for managing ADK sessions in React components
 */
export class ADKSessionHook {
  private sessionManager: SessionManager;
  
  constructor(adkClient: ADKClient) {
    this.sessionManager = new LocalStorageSessionManager(adkClient);
  }

  async getOrCreateSession(): Promise<ADKSession> {
    const currentSession = this.sessionManager.getCurrentSession();
    
    if (currentSession && this.sessionManager.isSessionValid()) {
      // Try to restore the session to verify it's still valid
      const restored = await this.sessionManager.restoreSession(currentSession.id);
      if (restored) {
        return restored;
      }
    }
    
    // Create a new session if none exists or current is invalid
    return await this.sessionManager.createNewSession();
  }

  getCurrentSession(): ADKSession | null {
    return this.sessionManager.getCurrentSession();
  }

  clearSession(): void {
    this.sessionManager.clearSession();
  }

  async refreshSession(): Promise<ADKSession | null> {
    const current = this.sessionManager.getCurrentSession();
    if (!current) return null;
    
    return await this.sessionManager.restoreSession(current.id);
  }
}
