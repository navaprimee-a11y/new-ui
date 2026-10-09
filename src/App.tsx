import React, { useState, useEffect } from 'react';
import { ScreenId, UserSession } from './types';
import { sessionManager } from './services/sessionService';
import { NavigationSidebar } from './components/layout/NavigationSidebar';
import { TopHeader } from './components/layout/TopHeader';
import { HomeScreen } from './components/screens/HomeScreen';
import { NavigationScreen } from './components/screens/NavigationScreen';
import { RouteSearchScreen } from './components/screens/RouteSearchScreen';
import { PersonalTransportScreen } from './components/screens/PersonalTransportScreen';
import { SecurityVerificationScreen } from './components/screens/SecurityVerificationScreen';
import { ActivityHistoryScreen } from './components/screens/ActivityHistoryScreen';
import { ProfileSettingsScreen } from './components/screens/ProfileSettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('home');
  const [session, setSession] = useState<UserSession>(sessionManager.getSession());
  const [navRouteId, setNavRouteId] = useState<string>('12');

  useEffect(() => {
    const unsubscribe = sessionManager.subscribe((newSession) => {
      setSession(newSession);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    if (session.authenticated) {
      sessionManager.logout();
    } else {
      sessionManager.login();
    }
  };

  const handleAuthenticateSession = () => {
    sessionManager.login();
  };

  const handleSelectRouteForNav = (routeId: string) => {
    setNavRouteId(routeId);
    setCurrentScreen('navigation');
  };

  return (
    <div className="min-h-screen bg-[#080e18] text-[#f8fafc] flex flex-col md:flex-row antialiased selection:bg-[#38bdf8]/30 selection:text-[#38bdf8]">
      {/* Desktop Persistent Midnight Tech Sidebar */}
      <NavigationSidebar
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Content Area (Offset by sidebar width on desktop) */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Universal Top Header */}
        <TopHeader
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          session={session}
          onOpenVoice={() => setCurrentScreen('home')}
        />

        {/* Dynamic Screen Viewport */}
        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto">
          {currentScreen === 'home' && (
            <HomeScreen
              session={session}
              onNavigate={setCurrentScreen}
              onAuthenticateSession={handleAuthenticateSession}
            />
          )}

          {currentScreen === 'navigation' && (
            <NavigationScreen initialRouteId={navRouteId} />
          )}

          {currentScreen === 'routes' && (
            <RouteSearchScreen
              onSelectRouteForNav={handleSelectRouteForNav}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'personal' && (
            <PersonalTransportScreen
              session={session}
              onNavigate={setCurrentScreen}
              onSelectRouteForNav={handleSelectRouteForNav}
            />
          )}

          {currentScreen === 'security' && (
            <SecurityVerificationScreen
              session={session}
              onAuthenticateSession={handleAuthenticateSession}
            />
          )}

          {currentScreen === 'activity' && (
            <ActivityHistoryScreen
              session={session}
              onNavigate={setCurrentScreen}
            />
          )}

          {currentScreen === 'profile' && (
            <ProfileSettingsScreen session={session} />
          )}
        </main>

        {/* Bottom Navigation for Mobile (Touch Screen Support) */}
        <nav
          className="md:hidden sticky bottom-0 z-40 bg-[#0d1524]/95 backdrop-blur-md border-t border-[#334155]/70 px-2 py-2 flex items-center justify-around text-xs shadow-2xl"
          aria-label="Mobile Bottom Navigation"
        >
          {[
            { id: 'home', label: 'Voice', icon: 'mic' },
            { id: 'routes', label: 'Routes', icon: 'directions_bus' },
            { id: 'navigation', label: 'Map', icon: 'explore' },
            { id: 'personal', label: 'Personal', icon: 'person' },
            { id: 'security', label: 'Security', icon: 'shield' },
            { id: 'activity', label: 'Activity', icon: 'history' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentScreen(item.id as ScreenId)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                currentScreen === item.id
                  ? 'text-[#38bdf8] font-bold'
                  : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
