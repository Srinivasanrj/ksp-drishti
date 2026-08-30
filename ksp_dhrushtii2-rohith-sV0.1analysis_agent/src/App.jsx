import React, { useState } from 'react';
import Chatbot from './components/Chatbot';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import DraggableGlobalChat from './components/DraggableGlobalChat';
import { GlobalInvestigationContextProvider } from './context/GlobalInvestigationContext';
import { initialDatasetState } from './analytics/services/datasetStore';
import { globalNetworkStore } from './analytics/services/networkAnalyticsService';
import { Shield, MapPin, Radio, BarChart2 } from 'lucide-react';

/**
 * STANDALONE CHATBOT UI MODULE ENTRY POINT
 * Supports seamless switching between Chatbot Console and Advanced Analytics Hub,
 * with shared dataset state across both interfaces.
 */
function AppContent() {
  const [selectedDivision, setSelectedDivision] = useState('Bengaluru Division');
  const [activeView, setActiveView] = useState('chat'); // 'chat' | 'analytics'
  const [analyticsInitialTab, setAnalyticsInitialTab] = useState('dashboard');
  const [datasetState, setDatasetState] = useState(initialDatasetState);
  
  // MOCK LOGIN STATE
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return window.location.hash !== '#login';
  });
  const [badgeId, setBadgeId] = useState('OFFICER_BGL_001');
  const [password, setPassword] = useState('ksp2026');

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    setIsLoggedIn(true);
    if (window.location.hash === '#login') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleQuickBypass = () => {
    setIsLoggedIn(true);
    if (window.location.hash === '#login') {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    window.location.hash = '#login';
  };

  // Ingestion callback
  const handleDatasetLoaded = ({ filename, fileSizeBytes, sha256, headers, records }) => {
    // Synchronize both Tabular Store and Network Topology Graph Store
    globalNetworkStore.loadDataset(records, headers, filename);

    setDatasetState(prev => ({
      ...prev,
      isLoaded: true,
      filename,
      fileSizeBytes,
      sha256,
      columns: headers,
      rawRecords: records,
      filteredRecords: records
    }));
  };

  // Filter slicer callbacks
  const handleUpdateFilters = (key, value) => {
    setDatasetState(prev => {
      const newFilters = { ...prev.filters, [key]: value };
      let filtered = [...prev.rawRecords];

      if (newFilters.division && newFilters.division !== 'All') {
        filtered = filtered.filter(r => (r.Division || r.division) === newFilters.division);
      }
      if (newFilters.district && newFilters.district !== 'All') {
        filtered = filtered.filter(r => (r.District || r.district) === newFilters.district);
      }
      if (newFilters.policeStation && newFilters.policeStation !== 'All') {
        filtered = filtered.filter(r => (r.Police_Station || r.police_station || r.Station) === newFilters.policeStation);
      }
      if (newFilters.crimeCategory && newFilters.crimeCategory !== 'All') {
        filtered = filtered.filter(r => (r.Crime_Category || r.crime_category || r.Category) === newFilters.crimeCategory);
      }
      if (newFilters.status && newFilters.status !== 'All') {
        filtered = filtered.filter(r => (r.Status || r.status) === newFilters.status);
      }
      if (newFilters.year && newFilters.year !== 'All') {
        filtered = filtered.filter(r => String(r.Year || r.year || (r.Date ? r.Date.split('-')[0] : '')) === String(newFilters.year));
      }
      if (newFilters.searchKeyword && newFilters.searchKeyword.trim()) {
        const kw = newFilters.searchKeyword.toLowerCase();
        filtered = filtered.filter(r => Object.values(r).some(val => String(val).toLowerCase().includes(kw)));
      }

      return {
        ...prev,
        filters: newFilters,
        filteredRecords: filtered
      };
    });
  };

  const handleResetFilters = () => {
    setDatasetState(prev => ({
      ...prev,
      filters: initialDatasetState.filters,
      filteredRecords: prev.rawRecords
    }));
  };

  // Central Session Reset Handler (SOLID: App.jsx orchestrates data lifecycle)
  const handleSessionReset = () => {
    globalNetworkStore.reset();
    setDatasetState(initialDatasetState);
  };

  // Central Session Restore Handler (SOLID: Restores full investigation context across tabs)
  const handleRestoreSessionData = (savedDatasetState) => {
    if (savedDatasetState && savedDatasetState.isLoaded && savedDatasetState.rawRecords?.length > 0) {
      setDatasetState(savedDatasetState);
      const headers = savedDatasetState.columns || Object.keys(savedDatasetState.rawRecords[0] || {});
      globalNetworkStore.loadDataset(
        savedDatasetState.rawRecords,
        headers,
        savedDatasetState.filename || 'Restored Investigation'
      );
    } else {
      handleSessionReset();
    }
  };

  // MOCK LOGIN PORTAL VIEW
  if (!isLoggedIn) {
    return (
      <ErrorBoundary>
        <div style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#090d16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
        }}>
          <div style={{
            width: '380px',
            padding: '36px 32px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.2)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.6)',
              border: '1px solid rgba(147, 197, 253, 0.5)'
            }}>
              <Shield size={32} color="#ffffff" />
            </div>

            <h2 style={{
              margin: '0 0 4px 0',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#f8fafc',
              textAlign: 'center',
              letterSpacing: '0.5px'
            }}>
              KSP SENTINEL AI
            </h2>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.75rem',
              color: '#94a3b8',
              textAlign: 'center'
            }}>
              Law Enforcement Officer Access
            </p>

            <form onSubmit={handleLoginSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Badge ID
                </label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="e.g. OFFICER_BGL_001"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Security Pin / Passcode
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 14px',
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                }}
              >
                Sign In to Sentinel Console
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#334155' }} />
            </div>

            <button
              onClick={handleQuickBypass}
              style={{
                width: '100%',
                padding: '11px',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Quick Launch Assistant (Bypass Login)
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (activeView === 'analytics') {
    return (
      <ErrorBoundary>
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
          <AnalyticsDashboard
            divisionName={selectedDivision}
            onBackToChat={() => setActiveView('chat')}
            datasetState={datasetState}
            initialTab={analyticsInitialTab}
            onDatasetLoaded={handleDatasetLoaded}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
          />
          <DraggableGlobalChat divisionName={selectedDivision} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#090d16',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#f8fafc',
        position: 'relative'
      }}>
        {/* CHATBOT UI COMPONENT CONTAINER */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '100vh' }}>
          <Chatbot
            divisionName={selectedDivision}
            onNavigateToAnalytics={() => { setAnalyticsInitialTab('dashboard'); setActiveView('analytics'); }}
            onNavigateToNetwork={() => { setAnalyticsInitialTab('network_graph'); setActiveView('analytics'); }}
            onDatasetIngested={handleDatasetLoaded}
            onSessionReset={handleSessionReset}
            onRestoreSessionData={handleRestoreSessionData}
            isDatasetLoaded={datasetState.isLoaded}
            datasetState={datasetState}
          />
        </main>
        
        {/* DRAGGABLE GLOBAL CHAT OVERLAY */}
        <DraggableGlobalChat divisionName={selectedDivision} />
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <GlobalInvestigationContextProvider>
      <AppContent />
    </GlobalInvestigationContextProvider>
  );
}
