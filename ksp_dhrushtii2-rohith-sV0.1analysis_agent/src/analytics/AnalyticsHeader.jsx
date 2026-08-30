import React from 'react';
import { Shield, ArrowLeft, BarChart2, Sparkles, Database, Layers, CheckCircle2 } from 'lucide-react';

export default function AnalyticsHeader({ divisionName, onBackToChat, activeTab, setActiveTab }) {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #0b1329 0%, #111e38 50%, #0b1329 100%)',
      borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      zIndex: 40
    }}>
      {/* LEFT: Branding & Return Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onBackToChat}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(30, 41, 59, 0.8)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'; e.currentTarget.style.color = '#93c5fd'; }}
        >
          <ArrowLeft size={14} /> Return to Drishti Assistant
        </button>

        <div style={{ height: '24px', width: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: '#38bdf8' }} />
            <h2 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 900,
              letterSpacing: '0.03em',
              background: 'linear-gradient(90deg, #ffffff 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              KSP ADVANCED ANALYTICS & DYNAMIC RAG HUB
            </h2>
          </div>
          <div style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 700, marginTop: '1px' }}>
            Multi-Spectrum Verification Desk • Active Scope: <span style={{ color: '#60a5fa' }}>{divisionName}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: View Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '10px',
        padding: '3px',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('checklist')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'checklist' ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
            color: activeTab === 'checklist' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '7px',
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: activeTab === 'checklist' ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <CheckCircle2 size={13} /> Exploration Checklist
        </button>

        <button
          onClick={() => setActiveTab('visualizer')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'visualizer' ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
            color: activeTab === 'visualizer' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '7px',
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: activeTab === 'visualizer' ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <BarChart2 size={13} /> Visual Spectrum Playground
        </button>

        <button
          onClick={() => setActiveTab('byod')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'byod' ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'transparent',
            color: activeTab === 'byod' ? '#ffffff' : '#94a3b8',
            border: 'none',
            borderRadius: '7px',
            padding: '5px 12px',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: activeTab === 'byod' ? '0 2px 8px rgba(37, 99, 235, 0.4)' : 'none'
          }}
        >
          <Database size={13} /> Dynamic BYOD Connector
        </button>
      </div>
    </div>
  );
}
