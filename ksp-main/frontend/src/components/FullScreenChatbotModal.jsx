import React, { useState, useEffect } from 'react';
import Chatbot from './Chatbot';
import ErrorBoundary from './ErrorBoundary';
import { Shield, MapPin, Radio, X } from 'lucide-react';

const DEFAULT_DIVISIONS = [
  "Bengaluru Division",
  "Mysuru Division",
  "Belagavi Division",
  "Kalaburagi Division",
  "Kolar Division",
  "State HQ Command"
];

/**
 * FULL SCREEN KSP DRISHTI CHATBOT MODAL
 * Matches the standalone full-screen console layout with division switching and 100vw/100vh immersive canvas.
 */
function FullScreenChatbotModal({ initialDivision = "Bengaluru Division", onClose, onAddDocument }) {
  const [selectedDivision, setSelectedDivision] = useState(initialDivision || "Bengaluru Division");
  const [divisionsList, setDivisionsList] = useState(DEFAULT_DIVISIONS);

  useEffect(() => {
    fetch('/api/calendar/divisions')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.divisions)) {
          const formatted = data.divisions.map(d => d.endsWith('Command') || d.endsWith('Division') ? d : `${d} Division`);
          setDivisionsList(formatted);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddDoc = (doc) => {
    if (onAddDocument) onAddDocument(doc);
  };

  return (
    <ErrorBoundary>
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#090d16',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#f8fafc',
        overflow: 'hidden'
      }}>
        {/* STANDALONE CHATBOT UI TOP BAR */}
        <header style={{
          height: '52px',
          minHeight: '52px',
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          zIndex: 50
        }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.5)'
            }}>
              <Shield size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.04em', color: '#ffffff' }}>
                KSP DRISHTI
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.02em', marginTop: '-2px' }}>
                KARNATAKA STATE POLICE COMMAND AI
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Division Selector */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.78rem'
            }}>
              <MapPin size={13} color="#60a5fa" />
              <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Division:</span>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#60a5fa',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {divisionsList.map(divName => (
                  <option key={divName} value={divName} style={{ background: '#0f172a', color: '#f8fafc' }}>
                    {divName}
                  </option>
                ))}
              </select>
            </div>

            {/* UI Module Ready Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '0.7rem',
              color: '#34d399',
              fontWeight: 700
            }}>
              <Radio size={12} color="#34d399" />
              <span>UI MODULE READY</span>
            </div>

            {/* Close / Return to Dashboard Button */}
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Return to Main Dashboard"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#f87171';
                }}
              >
                <X size={14} /> Return to Console
              </button>
            )}
          </div>
        </header>

        {/* CHATBOT UI COMPONENT CONTAINER (FULL HEIGHT) */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <Chatbot key={selectedDivision} onAddDocument={handleAddDoc} divisionName={selectedDivision} onClose={onClose} />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default FullScreenChatbotModal;
