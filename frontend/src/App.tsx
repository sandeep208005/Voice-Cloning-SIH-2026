import React, { useState, useEffect, useCallback } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ForensicLabView } from './components/ForensicLabView';
import { RealtimeRadarView } from './components/RealtimeRadarView';
import { ChallengeVerificationView } from './components/ChallengeVerificationView';
import { HistoryView } from './components/HistoryView';
import { ModelsView } from './components/ModelsView';
import { ProjectOutputsDashboard } from './components/ProjectOutputsDashboard';
import { AuthModal } from './components/AuthModal';
import { AuthView } from './components/AuthView';
import { api } from './services/api';
import { AUDITED_DASHBOARD_SNAPSHOT } from './data/auditedProjectOutputs';
import { DashboardStatistics, RecentAnalysisItem, AnalysisDetail, User, SystemHealth } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [recent, setRecent] = useState<RecentAnalysisItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [isOfflineSnapshot, setIsOfflineSnapshot] = useState(false);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState<AnalysisDetail | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const [statsData, recentData, healthData] = await Promise.all([
        api.getDashboardStatistics(),
        api.getRecentAnalyses(),
        api.getHealth().catch(() => null),
      ]);
      setStats(statsData);
      setRecent(recentData);
      setHealth(healthData);
      setDashboardError(null);
      setIsOfflineSnapshot(false);
    } catch (err: any) {
      console.warn('Dashboard telemetry fetch failed:', err);
      setDashboardError(err.message || 'Unable to connect to DeepShield AI backend.');
      setHealth(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleLoadOfflineSnapshot = () => {
    setStats(AUDITED_DASHBOARD_SNAPSHOT.stats);
    setRecent(AUDITED_DASHBOARD_SNAPSHOT.recent);
    setIsOfflineSnapshot(true);
    setDashboardError(null);
  };

  useEffect(() => {
    let isMounted = true;
    api.getMe()
      .then(u => {
        if (isMounted) {
          setUser(u);
          if (u) {
            fetchDashboardData();
          }
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setIsCheckingAuth(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fetchDashboardData]);

  // Periodic telemetry refresh only when user is logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (!isOfflineSnapshot) {
        fetchDashboardData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, isOfflineSnapshot, user]);

  const handleSelectAnalysis = async (id: string) => {
    try {
      const detail = await api.getAnalysisDetail(id);
      setSelectedAnalysisDetail(detail);
      setActiveTab('lab');
    } catch (err: any) {
      alert(err.message || 'Failed to inspect analysis.');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  // Initial Security Handshake Loader
  if (isCheckingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-void)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--cyan)',
          borderRadius: '50%',
          animation: 'radar-sweep 1s linear infinite',
        }} />
        <p style={{ marginTop: '16px', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.08em' }}>
          INITIALIZING SECURITY CLEARANCE HANDSHAKE...
        </p>
      </div>
    );
  }

  // Unauthenticated: Direct Landing on Login/Register Screen
  if (!user) {
    return (
      <AuthView
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          fetchDashboardData();
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Navigation (Desktop Sidebar, Mobile Header, Drawer & Bottom Bar) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        health={health}
        onRefreshHealth={fetchDashboardData}
      />

      {/* Main View Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            recent={recent}
            loading={loadingStats}
            error={dashboardError}
            isOfflineSnapshot={isOfflineSnapshot}
            onRetry={fetchDashboardData}
            onLoadSnapshot={handleLoadOfflineSnapshot}
            onNavigateToLab={() => { setSelectedAnalysisDetail(null); setActiveTab('lab'); }}
            onNavigateToOutputs={() => setActiveTab('outputs')}
            onSelectAnalysis={handleSelectAnalysis}
          />
        )}

        {activeTab === 'outputs' && (
          <ProjectOutputsDashboard
            onNavigateToLab={() => { setSelectedAnalysisDetail(null); setActiveTab('lab'); }}
          />
        )}

        {activeTab === 'lab' && (
          <ForensicLabView
            onAnalysisCompleted={fetchDashboardData}
            selectedAnalysisDetail={selectedAnalysisDetail}
            onClearSelected={() => setSelectedAnalysisDetail(null)}
          />
        )}

        {activeTab === 'realtime' && (
          <RealtimeRadarView />
        )}

        {activeTab === 'challenge' && (
          <ChallengeVerificationView />
        )}

        {activeTab === 'history' && (
          <HistoryView onSelectAnalysis={handleSelectAnalysis} />
        )}

        {activeTab === 'models' && (
          <ModelsView />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(newUser) => setUser(newUser)}
      />
    </div>
  );
};

export default App;
