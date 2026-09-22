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
import { api } from './services/api';
import { AUDITED_DASHBOARD_SNAPSHOT } from './data/auditedProjectOutputs';
import { DashboardStatistics, RecentAnalysisItem, AnalysisDetail, User, SystemHealth } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [recent, setRecent] = useState<RecentAnalysisItem[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [user, setUser] = useState<User | null>(null);
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
    api.getMe().then(u => setUser(u));
    fetchDashboardData();

    // Periodic telemetry refresh
    const interval = setInterval(() => {
      // Only poll automatically if not manually inspecting offline snapshot
      if (!isOfflineSnapshot) {
        fetchDashboardData();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, isOfflineSnapshot]);

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* Sidebar Navigation */}
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
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
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
