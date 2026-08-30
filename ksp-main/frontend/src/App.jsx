/**
 * Karnataka State Police - KSP DRISHTI Command Platform
 * App Main Component & Division Console Router
 */

import React, { useState } from 'react';
import { Bot, ShieldAlert, X, BarChart2, Share2, LogOut, Shield, UserCheck, ShieldCheck, PlusCircle, FolderKanban } from 'lucide-react';
import MainMap from './components/MainMap';
import Insights from './components/Insights';
import PanicSOS from './components/PanicSOS';
import SocialFeed from './components/SocialFeed';
import Login from './components/Login';

// Division Head Console Components
import BengaluruHeadDashboard from './components/BengaluruHeadDashboard';
import MysuruHeadDashboard from './components/MysuruHeadDashboard';
import BelagaviHeadDashboard from './components/BelagaviHeadDashboard';
import KalaburagiHeadDashboard from './components/KalaburagiHeadDashboard';

import KSPLoadingScreen from './components/KSPLoadingScreen';
import DrishtiLanding from './ksp_drishti_landing/DrishtiLanding';

function App() {
  // App Initial Landing Screen State
  const [isLoading, setIsLoading] = useState(true);

  // Authentication & Officer User State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Application UI State
  const [panicActive, setPanicActive] = useState(false);
  const [leftTab, setLeftTab] = useState('insights');
  const [showDrishtiAgent, setShowDrishtiAgent] = useState(false);

  const handleLoginSuccess = (userAuthData) => {
    setCurrentUser(userAuthData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // 1. KSP DRISHTI Interactive Landing Page
  if (isLoading) {
    return <DrishtiLanding onComplete={() => setIsLoading(false)} />;
  }

  // 2. Unauthenticated -> Show Multi-Division Login Portal
  if (!isAuthenticated) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // 2. Division Head & Police Station Unit Routing
  const username = currentUser?.username || '';
  const divId = currentUser?.division?.id || '';

  const isBengaluruUser = username === 'ksp.bengaluru.head' || username.startsWith('ksp.bengaluru') || username.startsWith('ksp.chikkaballapura') || username.startsWith('ksp.chitradurga') || username.startsWith('ksp.davanagere') || username.startsWith('ksp.kolar') || username.startsWith('ksp.kgf') || username.startsWith('ksp.ramanagara') || username.startsWith('ksp.tumakuru') || divId === 'bengaluru';
  const isMysuruUser = username === 'ksp.mysuru.head' || username.startsWith('ksp.mysuru') || username.startsWith('ksp.chamarajanagara') || username.startsWith('ksp.chikkamagaluru') || username.startsWith('ksp.dakshina.kannada') || username.startsWith('ksp.hassan') || username.startsWith('ksp.kodagu') || username.startsWith('ksp.mandya') || username.startsWith('ksp.udupi') || divId === 'mysuru';
  const isBelagaviUser = username === 'ksp.belagavi.head' || username.startsWith('ksp.belagavi') || username.startsWith('ksp.bagalkote') || username.startsWith('ksp.dharwad') || username.startsWith('ksp.gadag') || username.startsWith('ksp.haveri') || username.startsWith('ksp.uttara.kannada') || username.startsWith('ksp.vijayapura') || divId === 'belagavi';
  const isKalaburagiUser = username === 'ksp.kalaburagi.head' || username.startsWith('ksp.kalaburagi') || username.startsWith('ksp.ballari') || username.startsWith('ksp.bidar') || username.startsWith('ksp.koppal') || username.startsWith('ksp.raichur') || username.startsWith('ksp.vijayanagara') || username.startsWith('ksp.yadgir') || divId === 'kalaburagi';

  let dashboardContent = null;

  if (isBengaluruUser) {
    dashboardContent = <BengaluruHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  } else if (isMysuruUser) {
    dashboardContent = <MysuruHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  } else if (isBelagaviUser) {
    dashboardContent = <BelagaviHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  } else if (isKalaburagiUser) {
    dashboardContent = <KalaburagiHeadDashboard currentUser={currentUser} onLogout={handleLogout} />;
  } else {
    // 3. State Control Room (HQ Command Console UI)
    dashboardContent = (
      <div className="app-window" style={{ background: '#ECE6D9', minHeight: '100vh' }}>
        {/* Top Header Bar matching DRISHTI theme */}
        <header className="main-header" style={{ borderBottom: '2px solid #D49B44', background: '#132B20', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', padding: '8px 18px' }}>
          <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/ksp_police_logo.png" alt="KSP Crest" className="logo-image" style={{ width: '38px', height: '38px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            <div className="header-title">
              <h1 style={{ background: 'linear-gradient(135deg, #F3C065 0%, #E5A842 50%, #D49B44 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.6px' }}>
                KARNATAKA STATE POLICE
              </h1>
              <p style={{ color: '#FCFCFA', opacity: 0.9, fontWeight: 700, margin: '2px 0 0 0', fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                KSP DRISHTI • STATE CONTROL ROOM
              </p>
            </div>
          </div>

          <div className="header-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* User Role Pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '5px 12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1.5px solid rgba(212,155,68,0.5)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
            }}>
              <ShieldCheck size={16} style={{ color: '#D49B44' }} />
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#F3C065', lineHeight: 1.1 }}>
                  {currentUser?.unitName || 'State Control Room (HQ)'}
                </span>
                <span style={{ fontSize: '0.62rem', color: '#FCFCFA', opacity: 0.85, fontWeight: 600 }}>
                  Officer: {currentUser?.username || 'State Police Director (SCRB)'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: '0.68rem', background: 'rgba(252,252,250,0.12)', color: '#FCFCFA',
                  border: '1px solid rgba(252,252,250,0.3)', padding: '4px 10px', borderRadius: '6px',
                  fontWeight: 700, cursor: 'pointer', marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#D49B44'; e.currentTarget.style.color = '#F3C065'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(252,252,250,0.3)'; e.currentTarget.style.color = '#FCFCFA'; }}
              >
                <LogOut size={12} /> Log Out
              </button>
            </div>

            {/* Status Indicator */}
            <div className="status-container" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '100px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div className="status-dot" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981', width: '8px', height: '8px', borderRadius: '50%' }}></div>
              <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.72rem' }}>Live State Grid Active</span>
            </div>

            {/* Panic SOS Button */}
            <button 
              className="sos-toggle-btn"
              onClick={() => setPanicActive(true)}
              style={{
                background: '#dc2626', color: 'white', border: 'none',
                padding: '6px 14px', borderRadius: '100px', fontWeight: 800,
                fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 12px rgba(220,38,38,0.35)'
              }}
            >
              <ShieldAlert size={15} /> Panic Mode
            </button>
          </div>
        </header>

        {/* Panic Emergency Overlay */}
        {panicActive && (
          <PanicSOS onClose={() => setPanicActive(false)} />
        )}

        {/* 2-Column Desktop Grid Layout (Map Expanded) */}
        <div className="dashboard-grid" style={{ padding: '14px', gap: '14px', gridTemplateColumns: '350px 1fr' }}>
          {/* Left Column: Analytics & Social Feed */}
          <div className="dashboard-panel" style={{ background: '#FCFCFA', border: '1px solid #D4CEBF', borderRadius: '14px', boxShadow: '0 4px 16px rgba(19,43,32,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', background: '#EDE7DB', padding: '4px', borderRadius: '10px', margin: '12px 12px 0 12px', border: '1px solid #D4CEBF' }}>
              <button
                style={{
                  flex: 1, padding: '7px 10px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.74rem',
                  background: leftTab === 'insights' ? '#132B20' : 'transparent',
                  color: leftTab === 'insights' ? '#F59E0B' : '#5A6860',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: leftTab === 'insights' ? '0 2px 6px rgba(19,43,32,0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setLeftTab('insights')}
              >
                <BarChart2 size={14} /> Crime Analytics
              </button>
              <button
                style={{
                  flex: 1, padding: '7px 10px', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.74rem',
                  background: leftTab === 'social' ? '#132B20' : 'transparent',
                  color: leftTab === 'social' ? '#F59E0B' : '#5A6860',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: leftTab === 'social' ? '0 2px 6px rgba(19,43,32,0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setLeftTab('social')}
              >
                <Share2 size={14} /> Social MCP Feed
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
              {leftTab === 'insights' ? <Insights /> : <SocialFeed />}
            </div>
          </div>

          {/* Center Column: Interactive Map Interface */}
          <div className="view-map-container" style={{ position: 'relative', background: '#FCFCFA', border: '1px solid #D4CEBF', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(19,43,32,0.06)' }}>
            <MainMap />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {dashboardContent}

      {/* Floating KSP DRISHTI Assistant Trigger */}
      <button
        className="floating-chatbot-trigger"
        onClick={() => setShowDrishtiAgent(true)}
        title="KSP DRISHTI Intelligence Assistant"
        aria-label="KSP DRISHTI Assistant"
      >
        <Bot size={26} />
      </button>

      {/* DRISHTI AGENT OVERLAY */}
      {showDrishtiAgent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999999,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ background: '#132B20', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', borderBottom: '2px solid #D49B44' }}>
            <button onClick={() => setShowDrishtiAgent(false)} style={{ background: 'none', border: 'none', color: '#D49B44', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', fontSize: '14px' }}>
              <X size={20} /> Close Intelligence Assistant
            </button>
          </div>
          <iframe 
            src="http://localhost:5174" 
            style={{ width: '100%', height: '100%', border: 'none', flex: 1 }} 
            title="Drishti Analysis Agent"
          />
        </div>
      )}
    </>
  );
}

export default App;
